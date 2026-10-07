import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import { applyMaterials, disposeModel } from './model';
import type {Selection} from './domain';
import type { Project } from './project';
export interface ViewportApi { frame:()=>void;capture:()=>Promise<Blob>;exportGlb:()=>Promise<ArrayBuffer>; }
export function Viewport({model,project,selected,api,selection}:{selection?:Selection;model:GLTF|null;project:Project|null;selected:string|null;api:React.RefObject<ViewportApi|null>}) {
  const host=useRef<HTMLDivElement>(null),controller=useRef<{update:(p:Project|null,id:string|null,state?:Selection)=>void}|null>(null);
  const [error,setError]=useState(''),[environmentLoading,setEnvironmentLoading]=useState(false);
  useEffect(()=>{
    const element=host.current!;let active=true,needsRender=true,environmentRequest=0,previousHdri='',previousCamera='',dofEnabled=false,currentFocalLength=50,areaReady=false,selectedLightType='directional';let areaPromise:Promise<void>|null=null;let hdrEnvironment:THREE.WebGLRenderTarget|null=null,composer:EffectComposer|null=null,bokeh:BokehPass|null=null;let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});setError('');}catch{setError('WebGL is unavailable. Try a browser with hardware acceleration enabled.');return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    element.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','3D model preview. Drag to orbit, scroll to zoom.');
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,0.01,1000);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
    let environment:THREE.WebGLRenderTarget|null=null;if(model){const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();environment=pmrem.fromScene(room,0.04);room.dispose();pmrem.dispose();scene.environment=environment.texture;}
    const grid=new THREE.GridHelper(20,40,'#3c494b','#283133');scene.add(grid);
    const floorMaterial=new THREE.MeshStandardMaterial({color:'#20292b',roughness:0.55,metalness:0.15});
    grid.visible=Boolean(model);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.y=-0.015;floor.receiveShadow=true;floor.visible=Boolean(model);scene.add(floor);
    const key=new THREE.DirectionalLight('#f3f3e9',3);key.position.set(4,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key,key.target);
    const spot=new THREE.SpotLight('#ffffff',70,0,Math.PI/4,0.5,2);spot.castShadow=true;scene.add(spot,spot.target);const area=new THREE.RectAreaLight('#ffffff',8,3,3);scene.add(area);
    const fill=new THREE.DirectionalLight('#b4d8ef',1.2);fill.position.set(-5,4,-4);scene.add(fill);
    const preview=new THREE.Group();scene.add(preview);
    let bounds=new THREE.Box3(),span=3;
    if(model){preview.add(model.scene);bounds.setFromObject(model.scene);const size=bounds.getSize(new THREE.Vector3());span=Math.max(size.x,size.y,size.z,0.01);const center=bounds.getCenter(new THREE.Vector3());preview.position.set(-center.x,-bounds.min.y,-center.z);model.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});}
    floor.scale.setScalar(Math.max(1,span/5));grid.scale.setScalar(Math.max(0.001,span/4));
    camera.near=Math.max(span/1000,0.0001);camera.far=Math.max(span*100,10);
    controls.minDistance=span*0.3;controls.maxDistance=span*10;
    key.position.multiplyScalar(span/3);key.shadow.camera.left=-span;key.shadow.camera.right=span;key.shadow.camera.top=span;key.shadow.camera.bottom=-span;key.shadow.camera.near=Math.max(span/1000,0.0001);key.shadow.camera.far=span*15;spot.shadow.camera.near=key.shadow.camera.near;spot.shadow.camera.far=span*15;key.shadow.bias=-0.0001;
    function frame(){controls.target.set(0,model?bounds.getSize(new THREE.Vector3()).y/2:0.5,0);camera.position.copy(controls.target).add(new THREE.Vector3(span*1.4,span*0.9,span*1.6));controls.update();}
    frame();let highlight:THREE.BoxHelper|null=null;
    function update(p:Project|null,id:string|null,state?:Selection){needsRender=true;
      if(model&&p)applyMaterials(model,p,state);
      const studio=p?.studio??{environment:'dark',intensity:1,exposure:1,focalLength:50};
      scene.background=new THREE.Color(studio.environment==='white'?'#c5c9c8':'#141c1e');floorMaterial.color.set(studio.environment==='white'?'#bfc4c1':'#20292b');grid.visible=Boolean(model)&&studio.environment!=='white';scene.environmentIntensity=studio.intensity;key.intensity=3*studio.intensity;fill.intensity=1.2*studio.intensity;renderer.toneMappingExposure=studio.exposure;currentFocalLength=studio.focalLength;camera.setFocalLength(currentFocalLength);
      const quality=p?.studio.quality??'balanced',pixelRatio=quality==='performance'?1:quality==='balanced'?Math.min(devicePixelRatio,1.5):quality==='high'?Math.min(devicePixelRatio,2):2;renderer.setPixelRatio(pixelRatio);renderer.shadowMap.enabled=quality!=='performance';const shadowSize=quality==='ultra'?2048:quality==='high'?1536:1024;
      for(const light of [key,spot])if(light.shadow.mapSize.x!==shadowSize){light.shadow.map?.dispose();light.shadow.map=null;light.shadow.mapSize.set(shadowSize,shadowSize);}
      const position=p?.studio.lightPosition??[4,8,5],rotation=p?.studio.lightRotation??[0,0,0],euler=new THREE.Euler(...rotation.map(THREE.MathUtils.degToRad) as [number,number,number]);key.position.fromArray(position).multiplyScalar(span/3);spot.position.copy(key.position);area.position.copy(key.position);
      const direction=new THREE.Vector3(0,bounds.getSize(new THREE.Vector3()).y/2,0).sub(key.position).normalize().applyEuler(euler);key.target.position.copy(key.position).add(direction);spot.target.position.copy(key.target.position);area.lookAt(key.target.position);const type=p?.studio.lightType??'directional';key.visible=type==='directional';spot.visible=type==='spot';selectedLightType=type;area.visible=type==='area'&&areaReady;if(type==='area'&&!areaPromise)areaPromise=import('three/addons/lights/RectAreaLightUniformsLib.js').then(({RectAreaLightUniformsLib})=>{RectAreaLightUniformsLib.init();areaReady=true;if(active){area.visible=selectedLightType==='area';needsRender=true;}}).catch(()=>{if(active)setError('Area-light shader resources could not load.');});spot.intensity=70*studio.intensity;area.intensity=8*studio.intensity;const size=p?.studio.lightSize??3;area.width=size*span/3;area.height=size*span/3;spot.penumbra=Math.min(1,size/10);key.shadow.radius=size;
      const temperature=(p?.studio.temperature??6500)/100;const red=temperature<=66?255:329.698727446*Math.pow(temperature-60,-0.1332047592),green=temperature<=66?99.4708025861*Math.log(temperature)-161.1195681661:288.1221695283*Math.pow(temperature-60,-0.0755148492),blue=temperature>=66?255:temperature<=19?0:138.5177312231*Math.log(temperature-10)-305.0447927307;const color=new THREE.Color().setRGB(...[red,green,blue].map(v=>THREE.MathUtils.clamp(v/255,0,1)) as [number,number,number],THREE.SRGBColorSpace);key.color.copy(color);spot.color.copy(color);area.color.copy(color);
      floorMaterial.roughness=p?.studio.groundRoughness??0.55;scene.environmentRotation.y=THREE.MathUtils.degToRad(p?.studio.environmentRotation??0);
      const preset=p?.studio.cameraPreset??'hero';if(previousCamera!==preset){frame();if(preset==='front')camera.position.copy(controls.target).add(new THREE.Vector3(0,0,span*2.2));if(preset==='side')camera.position.copy(controls.target).add(new THREE.Vector3(span*2.2,0,0));if(preset==='top')camera.position.copy(controls.target).add(new THREE.Vector3(0,span*2.2,0.001));controls.update();previousCamera=preset;}
      dofEnabled=p?.studio.dof??false;if(dofEnabled&&!composer){composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));bokeh=new BokehPass(scene,camera,{focus:p?.studio.focusDistance??10,aperture:0.0001,maxblur:0.008});composer.addPass(bokeh);composer.addPass(new OutputPass());}if(bokeh){bokeh.materialBokeh.uniforms.focus.value=p?.studio.focusDistance??10;bokeh.materialBokeh.uniforms.aperture.value=0.001/(p?.studio.aperture??2.8);}
      const hdri=p?.studio.hdriId??'';if(previousHdri!==hdri){previousHdri=hdri;const request=++environmentRequest;setEnvironmentLoading(Boolean(hdri));if(!hdri){hdrEnvironment?.dispose();hdrEnvironment=null;scene.environment=environment?.texture??null;}else{const match=/^\/view\/([a-f0-9-]{36})$/.exec(location.pathname),url=match?`/api/public/releases/${match[1]}/environment`:`/api/projects/${p!.id}/environment/${hdri}`;void new RGBELoader().loadAsync(url).then(texture=>{if(!active||request!==environmentRequest){texture.dispose();return;}const generator=new THREE.PMREMGenerator(renderer),target=generator.fromEquirectangular(texture);generator.dispose();texture.dispose();hdrEnvironment?.dispose();hdrEnvironment=target;scene.environment=target.texture;needsRender=true;setEnvironmentLoading(false);}).catch(()=>{if(active&&request===environmentRequest){setError('HDRI could not be loaded. Check asset access or replace the environment.');setEnvironmentLoading(false);}});}}
      resize();

      if(highlight){scene.remove(highlight);highlight.geometry.dispose();(highlight.material as THREE.Material).dispose();highlight=null;}
      if(model&&id){let selectedObject:THREE.Object3D|undefined;model.scene.traverse(o=>{if(o.userData.platformNodeId===id)selectedObject=o;});if(selectedObject){preview.updateMatrixWorld(true);highlight=new THREE.BoxHelper(selectedObject,'#d5e9a7');scene.add(highlight);}}
    }
    controller.current={update};update(project,selected,selection);
    function resize(){needsRender=true;const {width,height}=element.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(width,height);}camera.aspect=width/height;camera.setFocalLength(currentFocalLength);camera.updateProjectionMatrix();}
    const observer=new ResizeObserver(resize);observer.observe(element);resize();
    api.current={frame,capture:async()=>{
      if(!model)throw new Error('Import a model before capture.');
      const size=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect;
      const visible=highlight?.visible;if(highlight)highlight.visible=false;
      try{renderer.setPixelRatio(1);renderer.setSize(1920,1080,false);camera.aspect=1920/1080;camera.setFocalLength(currentFocalLength);camera.updateProjectionMatrix();if(composer&&dofEnabled){composer.setPixelRatio(1);composer.setSize(1920,1080);composer.render();}else renderer.render(scene,camera);return await new Promise<Blob>((resolve,reject)=>renderer.domElement.toBlob(blob=>blob?resolve(blob):reject(new Error('Capture failed.')),'image/png'));}
      finally{renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;camera.setFocalLength(currentFocalLength);camera.updateProjectionMatrix();if(highlight&&visible!==undefined)highlight.visible=visible;if(composer){composer.setPixelRatio(ratio);composer.setSize(size.x,size.y);}needsRender=true;}
    },exportGlb:async()=>{if(!model)throw new Error('Import a model first.');const result=await new (await import('three/addons/exporters/GLTFExporter.js')).GLTFExporter().parseAsync(model.scene,{binary:true,animations:model.animations,onlyVisible:true});if(!(result instanceof ArrayBuffer))throw new Error('Binary export failed.');return result;}};
    controls.addEventListener('change',()=>{needsRender=true;});let raf=0;function animate(){raf=requestAnimationFrame(animate);controls.update();if(needsRender&&!document.hidden){if(composer&&dofEnabled)composer.render();else renderer.render(scene,camera);renderer.domElement.dataset.renderStats=JSON.stringify({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,pixelRatio:renderer.getPixelRatio(),shadows:renderer.shadowMap.enabled,shadowSize:key.shadow.mapSize.x,dof:dofEnabled,focalLength:camera.getFocalLength(),exposure:renderer.toneMappingExposure});needsRender=false;}}animate();
    const lost=(event:Event)=>{event.preventDefault();setError('Graphics context lost. Save your local draft, then reload to restart the viewport.');};renderer.domElement.addEventListener('webglcontextlost',lost);
    return()=>{active=false;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();api.current=null;controller.current=null;renderer.domElement.removeEventListener('webglcontextlost',lost);if(highlight){highlight.geometry.dispose();(highlight.material as THREE.Material).dispose();}if(model){preview.remove(model.scene);disposeModel(model);}grid.geometry.dispose();(grid.material as THREE.Material).dispose();floor.geometry.dispose();floorMaterial.dispose();environment?.dispose();hdrEnvironment?.dispose();key.shadow.dispose();spot.shadow.dispose();bokeh?.dispose();composer?.passes.forEach(pass=>{if(pass!==bokeh)pass.dispose();});composer?.dispose();renderer.dispose();renderer.domElement.remove();};
  },[model]);
  useEffect(()=>controller.current?.update(project,selected,selection),[project,selected,selection]);
  return <div className="viewport" ref={host}>{environmentLoading&&<span className="environment-loading" role="status">Loading HDR environment…</span>}{error&&<div className="viewport-error" role="alert">{error}</div>}</div>;
}

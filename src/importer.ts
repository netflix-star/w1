export const MAX_ASSET_BYTES = 50 * 1024 * 1024;
const MAX_NODES = 5000;
type Json = Record<string, any>;
export interface NodeInfo { id: string; index: number; name: string; children: string[]; mesh?: number; materialIds: string[]; triangles: number; translation: number[]; rotation: number[]; scale: number[];matrix?:number[]; }
export interface MaterialInfo { id: string; index: number; name: string; color: string; metallic: number; roughness: number; clearcoat: number;clearcoatRoughness?:number;transmission?:number;ior?:number;hasBaseColorMap?:boolean;hasNormalMap?:boolean; }
export interface AssetReport { nodes: NodeInfo[]; materials: MaterialInfo[]; roots: string[]; triangles: number; warnings: string[]; animations: number; textures: number; }
const supported = new Set(['KHR_materials_clearcoat', 'KHR_materials_transmission', 'KHR_materials_ior', 'KHR_materials_unlit', 'KHR_materials_emissive_strength', 'KHR_materials_specular', 'KHR_materials_sheen', 'KHR_materials_iridescence', 'KHR_materials_anisotropy', 'KHR_texture_transform', 'KHR_lights_punctual', 'KHR_mesh_quantization']);
function fail(message: string): never { throw new Error(message); }
function array(value: unknown, name: string): any[] { if (value === undefined) return []; if (!Array.isArray(value)) fail(`${name} must be an array.`); return value as any[]; }
function index(value: unknown, list: any[], name: string) { if (!Number.isInteger(value) || (value as number) < 0 || (value as number) >= list.length) fail(`Broken ${name} reference.`); }
function vector(v: unknown, count: number, name: string, fallback: number[]): number[] { if(v===undefined)return fallback; if(!Array.isArray(v)||v.length!==count||!v.every(n=>typeof n==='number'&&Number.isFinite(n)))fail(`Invalid ${name}.`); return v; }
export function inspectGlb(buffer: ArrayBuffer): AssetReport {
  if(buffer.byteLength>MAX_ASSET_BYTES) fail('File exceeds the 50 MiB import limit.');
  if(buffer.byteLength<20) fail('File is too short to be a GLB.');
  const view=new DataView(buffer);
  if(view.getUint32(0,true)!==0x46546c67 || view.getUint32(4,true)!==2)fail('Expected a binary glTF 2.0 (GLB) asset.');
  if(view.getUint32(8,true)!==buffer.byteLength)fail('GLB length does not match its header.');
  let offset=12, json:Json|undefined, binBytes=0, count=0;
  while(offset<buffer.byteLength) {
    if(offset+8>buffer.byteLength)fail('Truncated GLB chunk header.');
    const length=view.getUint32(offset,true),type=view.getUint32(offset+4,true); offset+=8;
    if(length%4 || offset+length>buffer.byteLength)fail('Invalid GLB chunk length.');
    if(count===0 && type!==0x4e4f534a)fail('GLB must start with a JSON chunk.');
    if(type===0x4e4f534a) {
      if(json)fail('Duplicate GLB JSON chunk.');
      try { json=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(buffer,offset,length))); } catch {fail('Malformed GLB JSON.');}
    } else if(type===0x004e4942) { if(count!==1)fail('Unexpected GLB binary chunk.'); binBytes=length; }
    else fail('Unsupported GLB chunk type.');
    offset+=length; count++;
  }
  if(!json || json.asset?.version!=='2.0')fail('Missing glTF 2.0 asset metadata.');
  const j=json;
  const nodes=array(j.nodes,'nodes'),meshes=array(j.meshes,'meshes'),materials=array(j.materials,'materials'),accessors=array(j.accessors,'accessors'),views=array(j.bufferViews,'bufferViews'),buffers=array(j.buffers,'buffers'),images=array(j.images,'images'),textures=array(j.textures,'textures'),scenes=array(j.scenes,'scenes');
  if(images.length>256||textures.length>256)fail('Asset exceeds the 256-image/texture limit.');
  if(nodes.length>MAX_NODES)fail('Asset exceeds the 5,000-node processing limit.');
  if(!meshes.length || !nodes.length || !scenes.length)fail('Asset must contain a scene with mesh geometry.');
  if(buffers.length!==1 || buffers[0]?.uri!==undefined || !Number.isInteger(buffers[0]?.byteLength) || buffers[0].byteLength<=0 || buffers[0].byteLength>binBytes || binBytes-buffers[0].byteLength>3)fail('Only self-contained GLBs with one embedded binary buffer are supported.');
  for(const b of views) {
    if(!b||b.buffer!==0||!Number.isInteger(b.byteLength)||b.byteLength<0||!Number.isInteger(b.byteOffset??0)||(b.byteOffset??0)<0||(b.byteOffset??0)+b.byteLength>buffers[0].byteLength)fail('Buffer view is outside the embedded buffer.');
  }
  const sizes:Record<string,number>={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
  const components:Record<number,number>={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
  for(const a of accessors) {
    if(!a||!sizes[a.type]||!components[a.componentType]||!Number.isInteger(a.count)||a.count<=0||a.count>6_000_000)fail('Invalid accessor shape or size.');
    if(a.sparse)fail('Sparse accessors are not supported in this first import milestone.');
    index(a.bufferView,views,'accessor buffer view');
    const b=views[a.bufferView], unit=sizes[a.type]*components[a.componentType],stride=b.byteStride??unit, start=a.byteOffset??0;
    if(!Number.isInteger(start)||start<0||!Number.isInteger(stride)||stride<unit||start+(a.count-1)*stride+unit>b.byteLength)fail('Accessor exceeds its buffer view.');
  }
  for(const image of images) { if(image?.uri!==undefined)fail('External/data URI images are unsupported. Embed textures in the GLB; no external requests are allowed.'); index(image?.bufferView,views,'image buffer view'); if(!['image/png','image/jpeg'].includes(image.mimeType))fail('Only embedded PNG/JPEG textures are supported in this milestone.'); }
  for(const t of textures)index(t?.source,images,'texture image');
  // Reject all URI dependencies, including extension-defined ones, before the loader sees them.
  function rejectUris(value:any) { if(!value||typeof value!=='object')return; for(const [key,item] of Object.entries(value)) { if(key==='uri')fail('URI dependencies are unsupported; use a self-contained GLB.'); rejectUris(item); } }
  rejectUris(j);
  for(const ext of array(j.extensionsRequired,'extensionsRequired'))if(!supported.has(ext))fail(`Required extension ${ext} is unsupported.`);
  const warnings:string[]=[];
  for(const ext of array(j.extensionsUsed,'extensionsUsed'))if(!supported.has(ext))warnings.push(`Optional extension ${ext} is unsupported; its effect may be absent.`);
  const meshTriangles=meshes.map((m,i)=>{
    let total=0;
    for(const p of array(m?.primitives,`mesh ${i} primitives`)) {
      if(!p?.attributes || p.attributes.POSITION===undefined)fail('Mesh primitive has no POSITION accessor.');
      for(const a of Object.values(p.attributes))index(a,accessors,'vertex accessor');
      if(p.material!==undefined)index(p.material,materials,'primitive material');
      if(p.indices!==undefined)index(p.indices,accessors,'index accessor');
      if(p.mode!==undefined&&p.mode!==4)fail('Only triangle meshes are supported in this milestone.');
      const accessor=accessors[p.indices??p.attributes.POSITION];
      if(accessor.count%3)fail('Triangle primitive count must be divisible by three.');
      total+=accessor.count/3;
      if(p.attributes.TEXCOORD_0===undefined)warnings.push(`Mesh ${i} has no UV0 coordinates.`);
    }
    return total;
  });
  const parents=new Set<number>();
  const info:NodeInfo[]=nodes.map((n,i)=>{
    if(!n||typeof n!=='object')fail('Invalid scene node.');
    if(n.mesh!==undefined)index(n.mesh,meshes,'node mesh');
    const children=array(n.children,'children');
    for(const child of children) {index(child,nodes,'child node');if(parents.has(child))fail('A scene node has multiple parents.');parents.add(child);}
    if(n.matrix!==undefined)vector(n.matrix,16,'node matrix',[]);
    return {id:`node_${i}`,index:i,name:typeof n.name==='string'?n.name:`Node ${i+1}`,children:children.map(c=>`node_${c}`),mesh:n.mesh,materialIds:n.mesh===undefined?[]:[...new Set<string>(meshes[n.mesh].primitives.filter((p:any)=>p.material!==undefined).map((p:any)=>`material_${p.material}`))],triangles:n.mesh===undefined?0:meshTriangles[n.mesh],translation:vector(n.translation,3,'translation',[0,0,0]),rotation:vector(n.rotation,4,'rotation',[0,0,0,1]),scale:vector(n.scale,3,'scale',[1,1,1]),...(n.matrix?{matrix:n.matrix}:{})};
  });
  const visiting=new Set<string>(),visited=new Set<string>();
  function walk(n:NodeInfo,depth:number) {if(depth>128)fail('Scene hierarchy exceeds the 128-level limit.');if(visiting.has(n.id))fail('Scene hierarchy contains a cycle.');if(visited.has(n.id))return;visiting.add(n.id);n.children.forEach(id=>walk(info[Number(id.slice(5))],depth+1));visiting.delete(n.id);visited.add(n.id);}
  info.forEach(n=>walk(n,0));
  const sceneIndex=j.scene??0;index(sceneIndex,scenes,'default scene');
  for(const s of scenes)for(const n of array(s?.nodes,'scene roots')) {index(n,nodes,'scene node');if(parents.has(n))fail('Scene root also has a parent.');}
  const roots=array(scenes[sceneIndex].nodes,'scene roots').map(n=>`node_${n}`);
  if(!roots.length)fail('Default scene is empty.');
  const triangles=info.reduce((sum,n)=>sum+n.triangles,0);
  if(triangles>2_000_000)fail('Asset exceeds the 2-million-triangle processing limit.');
  if(triangles>250_000)warnings.push('High geometry count: add optimized derivatives before production delivery.');
  if(array(j.animations,'animations').length)warnings.push('Animations are preserved on export but playback authoring is not implemented.');
  const colorHex=(rgb:number[])=>'#'+rgb.slice(0,3).map(v=>Math.round((v <= 0.0031308 ? 12.92 * Math.max(0,v) : 1.055 * Math.pow(Math.min(1,v),1/2.4) - 0.055)*255).toString(16).padStart(2,'0')).join('');
  return {nodes:info,materials:materials.map((m,i)=>({id:`material_${i}`,index:i,name:m.name??`Material ${i+1}`,color:colorHex(m.pbrMetallicRoughness?.baseColorFactor??[1,1,1]),metallic:m.pbrMetallicRoughness?.metallicFactor??1,roughness:m.pbrMetallicRoughness?.roughnessFactor??1,clearcoat:m.extensions?.KHR_materials_clearcoat?.clearcoatFactor??0,clearcoatRoughness:m.extensions?.KHR_materials_clearcoat?.clearcoatRoughnessFactor??0,transmission:m.extensions?.KHR_materials_transmission?.transmissionFactor??0,ior:m.extensions?.KHR_materials_ior?.ior??1.5,hasBaseColorMap:Boolean(m.pbrMetallicRoughness?.baseColorTexture),hasNormalMap:Boolean(m.normalTexture)})),roots,triangles,warnings:[...new Set(warnings)],animations:array(j.animations,'animations').length,textures:textures.length};
}

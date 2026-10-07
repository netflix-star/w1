import {parentPort,workerData} from 'node:worker_threads';
import {tsImport} from 'tsx/esm/api';
import validator from 'gltf-validator';
import sharp from 'sharp';
try {
 const {inspectGlb}=await tsImport('../src/importer.ts',import.meta.url);
 let bytes=new Uint8Array(workerData.bytes??workerData),runtimeSource; if(workerData.kind==='export'){const {configuredGlb}=await tsImport('../src/configured-export.ts',import.meta.url);runtimeSource=configuredGlb(bytes.buffer,workerData.context.project,workerData.context.state);bytes=new Uint8Array(runtimeSource);}if(workerData.kind==='gltf'){const {normalizeModel}=await tsImport('../src/gltf.ts',import.meta.url);runtimeSource=normalizeModel(bytes.buffer).bytes;bytes=new Uint8Array(runtimeSource);}if(workerData.kind==='hdr'){const {RGBELoader}=await import('three/addons/loaders/RGBELoader.js');const header=new TextDecoder().decode(bytes.slice(0,Math.min(4096,bytes.length)));const dimensions=/[-+]Y (\d+) [-+]X (\d+)/.exec(header);if(!dimensions||Number(dimensions[1])>2048||Number(dimensions[2])>4096)throw new Error('HDRI must have valid dimensions up to 4096×2048.');const texture=new RGBELoader().parse(bytes.buffer);if(!texture)throw new Error('Malformed Radiance HDR image.');parentPort.postMessage({report:{width:texture.width,height:texture.height}});}else{const report=inspectGlb(bytes.buffer);
 const result=await validator.validateBytes(bytes,{maxIssues:100,externalResourceFunction:()=>Promise.reject(new Error('External resources are forbidden.'))});
 if(result.issues.numErrors)throw new Error(result.issues.messages.filter(m=>m.severity===0).slice(0,5).map(m=>m.message).join(' '));
 const view=new DataView(bytes.buffer),length=view.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+length))),binStart=28+length;
 let memory=0;
 for(const image of json.images??[]){const b=json.bufferViews[image.bufferView],imageBytes=bytes.slice(binStart+(b.byteOffset??0),binStart+(b.byteOffset??0)+b.byteLength),metadata=await sharp(imageBytes,{limitInputPixels:16_777_216}).metadata();if(!metadata.width||!metadata.height||metadata.width>4096||metadata.height>4096)throw new Error('Texture exceeds the 4096×4096 import budget.');await sharp(imageBytes,{limitInputPixels:16_777_216}).stats();memory+=metadata.width*metadata.height*4*4/3;}
 if(memory>256*1024*1024)throw new Error('Estimated texture memory exceeds 256 MiB.');
 report.warnings.push(...result.issues.messages.filter(m=>m.severity===1).slice(0,10).map(m=>m.message));
 parentPort.postMessage({report:{...report,...(runtimeSource?{runtimeSource}:{})}});}
}catch(e){parentPort.postMessage({error:e.message??'Asset processing failed.'});}

import {MAX_ASSET_BYTES} from './importer';
export function normalizeModel(source:ArrayBuffer):{bytes:ArrayBuffer;format:'glb'|'gltf'}{
 if(source.byteLength>MAX_ASSET_BYTES)throw new Error('File exceeds the 50 MiB import limit.');
 if(source.byteLength>=4&&new DataView(source).getUint32(0,true)===0x46546c67)return {bytes:source,format:'glb'};
 let document:any;try{document=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(source));}catch{throw new Error('Expected GLB or self-contained glTF 2.0 JSON.');}
 if(!document||document.asset?.version!=='2.0'||!Array.isArray(document.buffers))throw new Error('Expected glTF 2.0 with embedded buffers.');
 const chunks:Uint8Array[]=[],offsets:number[]=[];let length=0;
 function decode(uri:unknown,kind:'buffer'|'image'){
  const match=typeof uri==='string'?/^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(uri):null;
  const allowed=kind==='buffer'?['application/octet-stream','application/gltf-buffer']:['image/png','image/jpeg'];
  if(!match||!allowed.includes(match[1]))throw new Error('glTF dependencies must be embedded base64 buffers and PNG/JPEG images. External requests are forbidden.');
  if(match[2].length>MAX_ASSET_BYTES*4/3)throw new Error('Embedded dependency exceeds the size budget.');
  let raw:string;try{raw=atob(match[2]);}catch{throw new Error('Malformed base64 dependency.');}
  const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));return {bytes,mime:match[1]};
 }
 function append(bytes:Uint8Array){const offset=length;const padded=new Uint8Array(Math.ceil(bytes.length/4)*4);padded.set(bytes);chunks.push(padded);length+=padded.length;if(length>MAX_ASSET_BYTES)throw new Error('Decoded glTF exceeds the size budget.');return offset;}
 for(const buffer of document.buffers){const {bytes}=decode(buffer.uri,'buffer');if(buffer.byteLength!==bytes.length)throw new Error('Embedded buffer length mismatch.');offsets.push(append(bytes));}
 document.bufferViews??=[];if(!Array.isArray(document.bufferViews))throw new Error('Invalid glTF buffer views.');
 for(const view of document.bufferViews){if(!view||!Number.isInteger(view.buffer)||view.buffer<0||view.buffer>=offsets.length)throw new Error('Invalid glTF buffer reference.');if(!Number.isInteger(view.byteOffset??0)||(view.byteOffset??0)<0||!Number.isInteger(view.byteLength)||view.byteLength<0||(view.byteOffset??0)+view.byteLength>document.buffers[view.buffer].byteLength)throw new Error('glTF buffer view exceeds its source buffer.');view.byteOffset=(view.byteOffset??0)+offsets[view.buffer];view.buffer=0;}
 for(const image of document.images??[]){if(image.uri!==undefined){const {bytes,mime}=decode(image.uri,'image'),offset=append(bytes);image.bufferView=document.bufferViews.length;image.mimeType=mime;delete image.uri;document.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length});}}
 document.buffers=[{byteLength:length}];const json=new TextEncoder().encode(JSON.stringify(document)),jsonLength=Math.ceil(json.length/4)*4,total=28+jsonLength+length;
 if(total>MAX_ASSET_BYTES)throw new Error('Normalized GLB exceeds the size budget.');
 const bytes=new Uint8Array(total),view=new DataView(bytes.buffer);view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,total,true);view.setUint32(12,jsonLength,true);view.setUint32(16,0x4e4f534a,true);bytes.fill(32,20,20+jsonLength);bytes.set(json,20);view.setUint32(20+jsonLength,length,true);view.setUint32(24+jsonLength,0x004e4942,true);let offset=28+jsonLength;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return {bytes:bytes.buffer,format:'gltf'};
}

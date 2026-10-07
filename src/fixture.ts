// Small authored triangle fixture, used only by automated tests.
export function fixtureJson() {return {asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:'Test body',mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1},material:0}]}],materials:[{name:'Body paint',pbrMetallicRoughness:{baseColorFactor:[0.5,0.5,0.5,1],metallicFactor:0.3,roughnessFactor:0.6}}],buffers:[{byteLength:72}],bufferViews:[{buffer:0,byteOffset:0,byteLength:36},{buffer:0,byteOffset:36,byteLength:36}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-1,0,0],max:[1,1,0]},{bufferView:1,componentType:5126,count:3,type:'VEC3'}]};}
export function makeGlb(json:unknown=fixtureJson()):ArrayBuffer {
 const raw=new TextEncoder().encode(JSON.stringify(json)),length=Math.ceil(raw.length/4)*4;
 const buffer=new ArrayBuffer(12+8+length+8+72),view=new DataView(buffer),bytes=new Uint8Array(buffer);
 view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,buffer.byteLength,true);view.setUint32(12,length,true);view.setUint32(16,0x4e4f534a,true);bytes.fill(32,20,20+length);bytes.set(raw,20);
 view.setUint32(20+length,72,true);view.setUint32(24+length,0x004e4942,true);
 const values=[-1,0,0,1,0,0,0,1,0,0,0,1,0,0,1,0,0,1];values.forEach((v,i)=>view.setFloat32(28+length+i*4,v,true));return buffer;
}
export function fixtureGltf():ArrayBuffer {const j=fixtureJson() as any;j.buffers[0].uri='data:application/octet-stream;base64,'+btoa(String.fromCharCode(...new Uint8Array(makeGlb()).slice(-72)));return new TextEncoder().encode(JSON.stringify(j)).buffer as ArrayBuffer;}
export function fixtureHdr():Buffer {const header=Buffer.from('#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 2 +X 4\n');return Buffer.concat([header,Buffer.from([128,64,32,129,128,64,32,129,32,64,128,129,32,64,128,129,128,64,32,129,128,64,32,129,32,64,128,129,32,64,128,129])]);}

import {describe,it,expect} from 'vitest';
import {inspectGlb,MAX_ASSET_BYTES} from './importer';
import {fixtureJson,makeGlb} from './fixture';
describe('self-contained GLB import boundary',()=>{
 it('extracts stable IDs, names, hierarchy, geometry and PBR values',()=>{const r=inspectGlb(makeGlb());expect(r.nodes[0]).toMatchObject({id:'node_0',name:'Test body',triangles:1,materialIds:['material_0']});expect(r.materials[0]).toMatchObject({id:'material_0',metallic:0.3,roughness:0.6});expect(r.roots).toEqual(['node_0']);});
 it('rejects non-GLB content and bad version/length/chunks',()=>{expect(()=>inspectGlb(new ArrayBuffer(4))).toThrow();const b=makeGlb();new DataView(b).setUint32(4,1,true);expect(()=>inspectGlb(b)).toThrow('glTF 2.0');const c=makeGlb();new DataView(c).setUint32(8,20,true);expect(()=>inspectGlb(c)).toThrow('header');const d=makeGlb();new DataView(d).setUint32(12,0xfffffff0,true);expect(()=>inspectGlb(d)).toThrow('chunk length');});
 it('rejects oversized assets before parsing',()=>expect(()=>inspectGlb(new ArrayBuffer(MAX_ASSET_BYTES+1))).toThrow('50 MiB'));
 it('rejects external requests and path traversal dependencies',()=>{const j=fixtureJson() as any;j.images=[{uri:'../../private.png'}];expect(()=>inspectGlb(makeGlb(j))).toThrow('Embed textures');j.images=[];j.extensions={custom:{uri:'https://example.com/private'}};expect(()=>inspectGlb(makeGlb(j))).toThrow('URI');});
 it('rejects missing image and material references',()=>{const j=fixtureJson() as any;j.textures=[{source:4}];expect(()=>inspectGlb(makeGlb(j))).toThrow('texture image');j.textures=[];j.meshes[0].primitives[0].material=4;expect(()=>inspectGlb(makeGlb(j))).toThrow('material');});
 it('rejects unsupported required extensions',()=>{const j=fixtureJson() as any;j.extensionsRequired=['KHR_draco_mesh_compression'];expect(()=>inspectGlb(makeGlb(j))).toThrow('unsupported');});
 it('rejects out-of-bounds accessor data',()=>{const j=fixtureJson();j.accessors[0].count=400;expect(()=>inspectGlb(makeGlb(j))).toThrow('buffer view');});
 it('rejects cycles and duplicate parents',()=>{const j=fixtureJson() as any;j.nodes[0].children=[0];expect(()=>inspectGlb(makeGlb(j))).toThrow('cycle');j.nodes=[{children:[2]},{children:[2]},{mesh:0}];expect(()=>inspectGlb(makeGlb(j))).toThrow('multiple parents');});
 it('rejects nonfinite transforms and unsupported topology',()=>{const j=fixtureJson() as any;j.nodes[0].scale=['bad',1,1];expect(()=>inspectGlb(makeGlb(j))).toThrow('scale');delete j.nodes[0].scale;j.meshes[0].primitives[0].mode=1;expect(()=>inspectGlb(makeGlb(j))).toThrow('triangle meshes');});
 it('reports missing UVs without silently treating them as valid textured assets',()=>expect(inspectGlb(makeGlb()).warnings).toContain('Mesh 0 has no UV0 coordinates.'));
});

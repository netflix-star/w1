import {it,expect} from 'vitest';
import {normalizeModel} from './gltf';
import {fixtureGltf,makeGlb} from './fixture';
import {inspectGlb} from './importer';
it('normalizes embedded glTF without changing node/material identities',()=>{const converted=normalizeModel(fixtureGltf());expect(converted.format).toBe('gltf');expect(inspectGlb(converted.bytes).nodes).toEqual(inspectGlb(makeGlb()).nodes);});
it('preserves binary GLB bytes',()=>{const source=makeGlb();expect(normalizeModel(source).bytes).toBe(source);});
it('rejects malformed JSON and external dependency URIs',()=>{expect(()=>normalizeModel(new TextEncoder().encode('{bad').buffer)).toThrow();const j=JSON.parse(new TextDecoder().decode(fixtureGltf()));j.buffers[0].uri='https://example.com/buffer.bin';expect(()=>normalizeModel(new TextEncoder().encode(JSON.stringify(j)).buffer)).toThrow('forbidden');});

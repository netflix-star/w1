import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {makeGlb} from '../src/fixture';
import {inspectGlb} from '../src/importer';
// Creates an isolated test account/project; disposable development deployments only.
const origin=process.env.SMOKE_ORIGIN??'http://127.0.0.1:3003';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('Smoke test is restricted to a local disposable deployment.');
let cookie='';
async function call(path:string,method='GET',body?:unknown,binary=false){const response=await fetch(origin+path,{method,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body!==undefined?{'Content-Type':binary?'model/gltf-binary':'application/json'}:{})},body:body===undefined?undefined:binary?body as Buffer:JSON.stringify(body)});assert.ok(response.ok,`${method} ${path}: HTTP ${response.status}`);const header=response.headers.get('set-cookie');if(header)cookie=header.split(';')[0];return response;}
await call('/api/health');assert.match(await (await call('/')).text(),/\/assets\//);
const account=await (await call('/api/auth/register','POST',{email:`container-${randomUUID()}@example.test`,password:randomUUID()})).json();
const bytes=Buffer.from(makeGlb());const draft=await (await call(`/api/projects/import?workspaceId=${account.workspaceId}&name=Container.glb`,'POST',bytes,true)).json();
assert.deepEqual(Buffer.from(await (await call(`/api/projects/${draft.project.id}/asset`)).arrayBuffer()),bytes);
draft.project.materials.material_0={color:'#00ff00',metallic:0.7,roughness:0.2,clearcoat:1};
await call(`/api/projects/${draft.project.id}`,'PUT',draft);
const release=await (await call(`/api/projects/${draft.project.id}/publish`,'POST',{revision:2})).json();
const html=await call(`/view/${release.releaseId}`);assert.match(html.headers.get('content-security-policy')??'',/frame-ancestors 'self'/);
const job=await (await call(`/api/public/releases/${release.releaseId}/export-jobs`,'POST',{selections:{},quantities:{}})).json();
let complete=false;for(let attempt=0;attempt<40;attempt++){const state=await (await call(`/api/public/export-jobs/${job.id}`)).json();assert.notEqual(state.status,'failed',state.error);if(state.status==='complete'){complete=true;break;}await new Promise(resolve=>setTimeout(resolve,500));}assert.ok(complete,'Export job timed out');
const output=await (await call(`/api/public/export-jobs/${job.id}/file`)).arrayBuffer();assert.equal(inspectGlb(output).materials[0].color,'#00ff00');
await call(`/api/projects/${draft.project.id}`,'DELETE');assert.equal((await fetch(`${origin}/api/public/releases/${release.releaseId}`)).status,404);
console.log('Container smoke passed: static frontend, session auth, PostgreSQL, private S3 import/read, immutable publish, configured export worker and archive protection.');

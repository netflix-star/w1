import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {makeGlb} from '../src/fixture';
import {inspectGlb} from '../src/importer';
test('import, inspect, map, edit PBR, save/reload and export configured assets',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('button',{name:'Import your first GLB'})).toBeEnabled();
 await page.getByLabel('Import GLB asset').setInputFiles({name:'studio-test.glb',mimeType:'model/gltf-binary',buffer:Buffer.from(makeGlb())});
 await expect(page.getByRole('heading',{name:'Test body'})).toBeVisible();
 await page.getByLabel('Semantic role').selectOption('body');
 await page.getByLabel('Base color').fill('#ff0000');
 await page.getByLabel('Metallic',{exact:true}).fill('0.85');
 await page.getByLabel('Clearcoat',{exact:true}).fill('1');
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await page.getByLabel('Studio background').selectOption('white');
 await page.getByLabel('Exposure',{exact:true}).fill('1.3');
 await page.getByRole('button',{name:'Save draft',exact:true}).click();
 await expect(page.locator('.notification[role="status"]')).toContainText('Draft saved');
 await page.reload();await expect(page.locator('.notification[role="status"]')).toContainText('Local draft restored');
 await page.getByRole('button',{name:'Test body'}).click();
 await expect(page.getByLabel('Semantic role')).toHaveValue('body');await expect(page.getByLabel('Base color')).toHaveValue('#ff0000');await expect(page.getByLabel('Metallic',{exact:true})).toHaveValue('0.85');
 await page.getByRole('button',{name:'Export',exact:true}).click();
 const jsonPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Project JSON'}).click();const jsonDownload=await jsonPromise;const project=JSON.parse(await readFile((await jsonDownload.path())!,'utf8'));expect(project.mappings.node_0).toBe('body');expect(project.studio.exposure).toBe(1.3);
 const glbPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Configured GLB'}).click();const glb=await glbPromise;const bytes=await readFile((await glb.path())!);const report=inspectGlb(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));expect(report.materials[0].color).toBe('#ff0000');expect(report.materials[0].metallic).toBeCloseTo(0.85);expect(report.materials[0].clearcoat).toBe(1);
 const pngPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Studio image'}).click();const png=await pngPromise;const image=await readFile((await png.path())!);expect(image.readUInt32BE(16)).toBe(1920);expect(image.readUInt32BE(20)).toBe(1080);
 await page.screenshot({path:'/tmp/forma-authoring-desktop.png'});expect(errors).toEqual([]);
});
test('invalid import preserves the existing model and draft',async({page})=>{
 await page.goto('/');await expect(page.getByRole('button',{name:'Import your first GLB'})).toBeEnabled();
 await page.getByLabel('Import GLB asset').setInputFiles({name:'good.glb',mimeType:'model/gltf-binary',buffer:Buffer.from(makeGlb())});await expect(page.getByRole('heading',{name:'Test body'})).toBeVisible();
 await page.getByLabel('Import GLB asset').setInputFiles({name:'bad.glb',mimeType:'model/gltf-binary',buffer:Buffer.from('not a model')});await expect(page.getByRole('alert')).toContainText('Import rejected');await expect(page.getByRole('heading',{name:'Test body'})).toBeVisible();
});
test('mobile layout has no horizontal overflow and real import control',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.getByRole('button',{name:'Import your first GLB'})).toBeEnabled();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'/tmp/forma-authoring-mobile.png'});
});
test('studio settings change real renderer state, capture with DOF, and avoid resource growth on repeated edits',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.getByRole('button',{name:'Import your first GLB'})).toBeEnabled();await page.getByLabel('Import GLB asset').setInputFiles({name:'studio.glb',mimeType:'model/gltf-binary',buffer:Buffer.from(makeGlb())});await expect(page.getByRole('heading',{name:'Test body'})).toBeVisible();await page.getByRole('button',{name:'Studio',exact:true}).click();
 const canvas=page.locator('.viewport canvas');const stats=async()=>JSON.parse((await canvas.getAttribute('data-render-stats'))??'{}');
 await expect.poll(async()=>(await stats()).triangles).toBeGreaterThan(0);await page.getByLabel('Render quality').selectOption('performance');await expect.poll(async()=>(await stats()).shadows).toBe(false);await page.getByLabel('Render quality').selectOption('high');await expect.poll(async()=>(await stats()).shadowSize).toBe(1536);
 await page.getByLabel('Focal length (mm)',{exact:true}).fill('70');await expect.poll(async()=>(await stats()).focalLength).toBeCloseTo(70);
 await page.getByText('Advanced lighting & lens',{exact:true}).click();await page.getByLabel('Key light type').selectOption('spot');await page.getByLabel('Temperature (K)',{exact:true}).fill('3200');await page.getByLabel('Depth of field').check();await expect.poll(async()=>(await stats()).dof).toBe(true);
 const baseline=await stats();for(let i=0;i<8;i++){await page.getByLabel('Exposure',{exact:true}).fill(String(i%2?1.2:0.8));await expect.poll(async()=>(await stats()).exposure).toBe(i%2?1.2:0.8);}
 const after=await stats();expect(after.geometries).toBeLessThanOrEqual(baseline.geometries+1);expect(after.textures).toBeLessThanOrEqual(baseline.textures+1);
 await page.getByRole('button',{name:'Export',exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Studio image'}).click();const image=await readFile((await (await pending).path())!);expect(image.readUInt32BE(16)).toBe(1920);expect(image.readUInt32BE(20)).toBe(1080);expect(errors).toEqual([]);
});
test('bulk mapping and glass PBR properties persist and appear in configured exports',async({page})=>{
 const {fixtureJson}=await import('../src/fixture');const fixture=fixtureJson() as any;fixture.nodes.push({name:'Second component',mesh:0,translation:[2,0,0]});fixture.scenes[0].nodes=[0,1];await page.goto('/');await expect(page.getByRole('button',{name:'Import your first GLB'})).toBeEnabled();await page.getByLabel('Import GLB asset').setInputFiles({name:'bulk.glb',mimeType:'model/gltf-binary',buffer:Buffer.from(makeGlb(fixture))});await expect(page.getByRole('heading',{name:'Test body'})).toBeVisible();await page.getByLabel('Select component Test body',{exact:true}).check();await page.getByLabel('Select component Second component',{exact:true}).check();await page.getByLabel('Semantic role').selectOption('glass');await page.getByLabel('Material family').selectOption('glass');await page.getByLabel('Index of refraction',{exact:true}).fill('1.7');await page.getByRole('button',{name:'Save draft',exact:true}).click();await expect(page.locator('.notification')).toContainText('Draft saved');await page.getByRole('button',{name:'Export',exact:true}).click();const jsonPending=page.waitForEvent('download');await page.getByRole('button',{name:'Project JSON'}).click();const metadata=JSON.parse(await readFile((await (await jsonPending).path())!,'utf8'));expect(metadata.mappings).toEqual({node_0:'glass',node_1:'glass'});
 const glbPending=page.waitForEvent('download');await page.getByRole('button',{name:'Configured GLB'}).click();const bytes=await readFile((await (await glbPending).path())!),report=inspectGlb(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length));expect(report.materials[0].transmission).toBeCloseTo(0.95);expect(report.materials[0].ior).toBeCloseTo(1.7);await page.screenshot({path:'/tmp/forma-authoring-final.png'});
});

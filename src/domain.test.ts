import {describe,it,expect} from 'vitest';
import {defaults,resolve,validateProject,withDefaults} from './domain';
import {inspectGlb} from './importer';
import {makeGlb} from './fixture';
import type {Project} from './project';
function project():Project{return withDefaults({schemaVersion:1,id:'a',name:'Test',updatedAt:'',asset:{id:'a',name:'test',bytes:0,hash:'h'},report:inspectGlb(makeGlb()),materials:{},mappings:{},studio:{environment:'dark',intensity:1,exposure:1,focalLength:50},groups:[{id:'a',name:'A',required:true,defaultOptionId:'a1'},{id:'b',name:'B',required:false}],options:[{id:'a1',name:'A1',groupId:'a',kind:'feature',targets:[],price:100},{id:'b1',name:'B1',groupId:'b',kind:'package',targets:[],price:250}],rules:[],basePrice:1000,currency:'USD',variants:[{id:'sport',name:'Sport'}]});}
describe('shared deterministic configuration engine',()=>{
 it('resolves defaults and catalog prices in minor units',()=>{const p=project();expect(resolve(p,defaults(p)).price.total).toBe(1100);expect(resolve(p,{selections:{a:'a1',b:'b1'},quantities:{b1:2},variant:'sport'}).price.total).toBe(1600);});
 it('is deterministic for the same release and state',()=>{const p=project();expect(resolve(p,defaults(p))).toEqual(resolve(p,defaults(p)));});
 it.each(['requires','package-dependency'] as const)('enforces %s',type=>{const p=project();p.rules=[{id:'r',type,optionIds:['a1','b1']}];expect(()=>resolve(p,defaults(p))).toThrow('requires');expect(resolve(p,{selections:{a:'a1',b:'b1'},quantities:{},variant:'sport'}).price.total).toBe(1350);});
 it.each(['excludes','mutually-exclusive'] as const)('enforces %s',type=>{const p=project();p.rules=[{id:'r',type,optionIds:['a1','b1']}];expect(()=>resolve(p,{selections:{a:'a1',b:'b1'},quantities:{}})).toThrow();});
 it('enforces variants and quantities',()=>{const p=project();p.rules=[{id:'v',type:'variant-only',optionIds:['a1'],variantId:'sport'},{id:'q',type:'quantity',optionIds:['a1'],min:2,max:4}];expect(()=>resolve(p,{selections:{a:'a1'},quantities:{a1:2}})).toThrow('variant');expect(()=>resolve(p,defaults(p))).toThrow('quantity');expect(resolve(p,{selections:{a:'a1'},quantities:{a1:3},variant:'sport'}).price.total).toBe(1300);});
 it('rejects unknown selections, unselected quantities and client price fields',()=>{const p=project();for(const c of [{selections:{a:'missing'},quantities:{}},{selections:{a:'a1'},quantities:{b1:1}},{...defaults(p),price:1}])expect(()=>resolve(p,c)).toThrow();});
 it('blocks broken source targets and defaults',()=>{const p=project();p.options[0]={...p.options[0],kind:'visibility',targets:['missing'],visible:true};expect(validateProject(p).join()).toContain('missing node');p.groups[0].defaultOptionId='missing';expect(validateProject(p).join()).toContain('invalid default');});
});

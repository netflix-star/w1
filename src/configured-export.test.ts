import {it,expect} from 'vitest';
import {createProject} from './project';
import {configuredGlb} from './configured-export';
import {makeGlb} from './fixture';
import {inspectGlb} from './importer';
it('exports applied option PBR values and leaves source bytes untouched',async()=>{const source=makeGlb(),copy=source.slice(0),project=await createProject('fixture.glb',source,inspectGlb(source));project.groups=[{id:'paint',name:'Paint',required:true,defaultOptionId:'red'}];project.options=[{id:'red',groupId:'paint',name:'Red',kind:'material',targets:['node_0'],price:0,material:{color:'#ff0000',metallic:0.8,roughness:0.2,clearcoat:1}}];const configured=configuredGlb(source,project,{selections:{paint:'red'},quantities:{}}),report=inspectGlb(configured);expect(report.materials.at(-1)).toMatchObject({color:'#ff0000',metallic:0.8,clearcoat:1});expect(new Uint8Array(source)).toEqual(new Uint8Array(copy));});
it('rejects an export with no visible geometry',async()=>{const source=makeGlb(),project=await createProject('fixture.glb',source,inspectGlb(source));project.groups=[{id:'visibility',name:'Visibility',required:true,defaultOptionId:'hidden'}];project.options=[{id:'hidden',groupId:'visibility',name:'Hidden',kind:'visibility',targets:['node_0'],visible:false,price:0}];expect(()=>configuredGlb(source,project,{selections:{visibility:'hidden'},quantities:{}})).toThrow('empty');});

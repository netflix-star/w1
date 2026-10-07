import {normalizeModel} from './gltf';
import type {Studio} from './studio';
import type {OptionGroup,AuthoringOption,Rule} from './domain';
import type { AssetReport } from './importer';
export const roles=['unmapped','body','wheel','brake','glass','seat','dashboard','trim','accessory','custom'] as const;
export type Role=typeof roles[number];
export interface MaterialOverride { color:string; metallic:number; roughness:number; clearcoat:number;clearcoatRoughness?:number;transmission?:number;ior?:number;family?:'paint'|'metal'|'glass'|'leather'|'carbon'|'rubber'; }
export interface Project {
  groups:OptionGroup[];options:AuthoringOption[];rules:Rule[];basePrice:number;currency:'USD'|'EUR'|'GBP';variants:{id:string;name:string}[];
  branding?:{name:string;accent:string};embedOrigins?:string[];
  schemaVersion:1; id:string; name:string; updatedAt:string;
  asset:{id:string;name:string;bytes:number;hash:string;runtimeHash?:string};report:AssetReport;
  mappings:Record<string,Role>;materials:Record<string,MaterialOverride>;
  studio:Studio;
}
export interface LocalDraft {project:Project;source:ArrayBuffer;}
function database():Promise<IDBDatabase> {return new Promise((resolve,reject)=>{const r=indexedDB.open('forma-authoring',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function saveDraft(draft:LocalDraft) {const db=await database();try {await new Promise<void>((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(draft,'active');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new Error('Draft save aborted.'));});}finally{db.close();}}
export async function loadDraft():Promise<LocalDraft|undefined> {const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('drafts');const req=tx.objectStore('drafts').get('active');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}finally{db.close();}}
export async function createProject(name:string,source:ArrayBuffer,report:AssetReport):Promise<Project> {
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',source))).map(v=>v.toString(16).padStart(2,'0')).join('');
  return {groups:[],options:[],rules:[],basePrice:0,currency:'USD',variants:[],schemaVersion:1,id:crypto.randomUUID(),name:name.replace(/\.(glb|gltf)$/i,''),updatedAt:new Date().toISOString(),asset:{id:`asset_${hash}`,name,bytes:source.byteLength,hash,runtimeHash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',normalizeModel(source).bytes))).map(v=>v.toString(16).padStart(2,'0')).join('')},report,mappings:{},materials:{},studio:{environment:'dark',intensity:1,exposure:1,focalLength:50}};
}

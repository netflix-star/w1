import {mkdir,writeFile,readFile,unlink,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand,HeadBucketCommand,CreateBucketCommand} from '@aws-sdk/client-s3';
import {settings} from './settings';
const client=new S3Client({region:'us-east-1',endpoint:settings.storageEndpoint,forcePathStyle:true,credentials:{accessKeyId:settings.storageAccessKey,secretAccessKey:settings.storageSecretKey},requestChecksumCalculation:'WHEN_REQUIRED'});
const localRoot=join(process.cwd(),'.data','assets');
function localPath(key:string){if(!/^private\/[a-zA-Z0-9/-]+\.(glb|gltf|hdr)$/.test(key))throw new Error('Invalid asset storage key.');return join(localRoot,key);}
export async function prepareStorage(){if(settings.storageDriver==='filesystem'){await mkdir(localRoot,{recursive:true});return;}try{await client.send(new HeadBucketCommand({Bucket:settings.storageBucket}));}catch(e){if((e as {$metadata?:{httpStatusCode?:number}}).$metadata?.httpStatusCode!==404)throw e;await client.send(new CreateBucketCommand({Bucket:settings.storageBucket}));}}
export async function putAsset(key:string,bytes:Buffer,mime='model/gltf-binary'){if(settings.storageDriver==='filesystem'){const path=localPath(key);await mkdir(join(path,'..'),{recursive:true});await writeFile(path,bytes,{flag:'wx',mode:0o600});return;}await client.send(new PutObjectCommand({Bucket:settings.storageBucket,Key:key,Body:bytes,ContentType:mime,IfNoneMatch:'*'}));}
export async function getAsset(key:string){if(settings.storageDriver==='filesystem'){const path=localPath(key),bytes=await readFile(path);const body=Readable.from(bytes) as any;body.transformToByteArray=async()=>new Uint8Array(bytes);return {Body:body,ContentLength:(await stat(path)).size};}const result=await client.send(new GetObjectCommand({Bucket:settings.storageBucket,Key:key}));if(!result.Body)throw new Error('Stored asset has no body.');return result;}
export async function removeAsset(key:string){if(settings.storageDriver==='filesystem'){await unlink(localPath(key));return;}await client.send(new DeleteObjectCommand({Bucket:settings.storageBucket,Key:key}));}

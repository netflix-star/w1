import {readFileSync,existsSync} from 'node:fs';
// Local .env is never bundled into the frontend. Process environment wins.
if(existsSync('.env'))for(const line of readFileSync('.env','utf8').split('\n')){const match=/^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);if(match&&process.env[match[1]]===undefined)process.env[match[1]]=match[2];}
function required(name:string){const value=process.env[name];if(!value)throw new Error(`Missing server configuration: ${name}`);return value;}
export const settings={storageDriver:process.env.STORAGE_DRIVER??'s3',port:Number(process.env.API_PORT??3001),production:process.env.NODE_ENV==='production',databaseUrl:required('DATABASE_URL'),storageEndpoint:required('STORAGE_ENDPOINT'),storageBucket:required('STORAGE_BUCKET'),storageAccessKey:required('STORAGE_ACCESS_KEY'),storageSecretKey:required('STORAGE_SECRET_KEY'),origins:(process.env.APP_ORIGINS??'http://127.0.0.1:5173,http://localhost:5173').split(','),publicOrigin:process.env.PUBLIC_ORIGIN??'http://127.0.0.1:5173',registrationEnabled:process.env.REGISTRATION_ENABLED===undefined?process.env.NODE_ENV!=='production':process.env.REGISTRATION_ENABLED==='true',trustProxyHops:Number(process.env.TRUST_PROXY_HOPS??0)};
if(settings.production&&(!settings.publicOrigin.startsWith('https://')||settings.origins.some(o=>!o.startsWith('https://'))))throw new Error('Production origins must use HTTPS.');

if(settings.production&&settings.storageDriver!=='s3')throw new Error('Production requires S3-compatible object storage.');

if(!Number.isInteger(settings.trustProxyHops)||settings.trustProxyHops<0||settings.trustProxyHops>3)throw new Error('TRUST_PROXY_HOPS must be 0–3, matching trusted reverse proxies.');

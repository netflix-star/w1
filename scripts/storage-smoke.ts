import {randomUUID} from 'node:crypto';
import {prepareStorage,putAsset,getAsset,removeAsset} from '../server/storage';
const key=`private/${randomUUID()}/${randomUUID()}/smoke.glb`,bytes=Buffer.from('storage-verification');
await prepareStorage();await putAsset(key,bytes);
try{const result=await getAsset(key),read=Buffer.from(await result.Body!.transformToByteArray());if(!read.equals(bytes))throw new Error('Storage changed the uploaded bytes.');let protectedWrite=false;try{await putAsset(key,Buffer.from('overwrite'));}catch{protectedWrite=true;}if(!protectedWrite)throw new Error('Immutable object overwrite was allowed.');console.log('Storage upload, byte-for-byte read and overwrite protection passed.');}finally{await removeAsset(key);}

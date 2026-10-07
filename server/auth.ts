import {randomBytes,createHash,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import type {Request,Response,NextFunction} from 'express';
import {pool} from './db';
import {settings} from './settings';
const scrypt=promisify(scryptCallback);
export function hashToken(token:string){return createHash('sha256').update(token).digest('hex');}
export async function passwordHash(password:string){const salt=randomBytes(16).toString('hex'),key=await scrypt(password,salt,64) as Buffer;return `${salt}:${key.toString('hex')}`;}
export async function verifyPassword(password:string,stored:string){const [salt,hex]=stored.split(':'),expected=Buffer.from(hex,'hex'),actual=await scrypt(password,salt,64) as Buffer;return expected.length===actual.length&&timingSafeEqual(expected,actual);}
export async function session(req:Request,res:Response,next:NextFunction){try{const match=/(?:^|;\s*)forma_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie??'');if(match){const result=await pool.query('SELECT u.id,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[hashToken(match[1])]);res.locals.user=result.rows[0];res.locals.tokenHash=hashToken(match[1]);}next();}catch(e){next(e);}}
export function requireUser(_req:Request,res:Response,next:NextFunction){if(!res.locals.user)return res.status(401).json({error:'Authentication required.'});next();}
export async function createSession(res:Response,userId:string){const token=randomBytes(32).toString('hex');await pool.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval \'7 days\')',[hashToken(token),userId]);res.cookie('forma_session',token,{httpOnly:true,secure:settings.production,sameSite:'lax',path:'/',maxAge:7*24*3600*1000});}
export class HttpError extends Error{constructor(public status:number,message:string){super(message);}}
export async function member(workspaceId:string,userId:string,write=false){const r=await pool.query('SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2',[workspaceId,userId]);if(!r.rowCount)throw new HttpError(404,'Workspace not found.');if(write&&r.rows[0].role==='viewer')throw new HttpError(403,'Editing permission required.');return r.rows[0].role as string;}
export async function projectFor(id:string,userId:string,write=false){const r=await pool.query('SELECT p.*,m.role,a.object_key FROM projects p JOIN memberships m ON m.workspace_id=p.workspace_id JOIN assets a ON a.id=p.asset_id WHERE p.id=$1 AND m.user_id=$2 AND p.archived_at IS NULL',[id,userId]);if(!r.rowCount)throw new HttpError(404,'Project not found.');if(write&&r.rows[0].role==='viewer')throw new HttpError(403,'Editing permission required.');return r.rows[0];}

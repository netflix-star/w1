import pg from 'pg';
import {settings} from './settings';
export const pool=new pg.Pool({connectionString:settings.databaseUrl,max:10});
export async function transaction<T>(fn:(db:pg.PoolClient)=>Promise<T>):Promise<T>{const db=await pool.connect();try{await db.query('BEGIN');const value=await fn(db);await db.query('COMMIT');return value;}catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}}

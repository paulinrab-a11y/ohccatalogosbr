import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
async function dbSetup(){const db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb,updated_at timestamptz);
create table auth.sessions(id uuid,user_id uuid,not_after timestamptz);
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
grant usage on schema auth,public to authenticated,service_role;`);
await db.exec(readFileSync('supabase/migrations/20260922172052_audit_gateway_controls.sql','utf8'));return db;}
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002',c='00000000-0000-4000-8000-000000000003';
test('atomic role mutation preserves final admin and rechecks revocation after serialization',async()=>{
 const db=await dbSetup();try{
 for(const [id,email,role]of [[a,'a@example.invalid','ohc_admin'],[b,'b@example.invalid','ohc_admin'],[c,'c@example.invalid','user']]){await db.query('insert into auth.users values($1,$2,$3,null)',[id,email,JSON.stringify({role,provider:'email'})]);await db.query('insert into auth.sessions values($1,$1,null)',[id]);}
 const act=async(id:string,email:string,make=false)=>{
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[id,JSON.stringify({session_id:id})]);
  await db.exec('set role authenticated');try{return (await db.query<{r:any}>('select public.ohc_audit_change_admin_role($1,$2) r',[email,make])).rows[0].r;}finally{await db.exec('reset role');}
 };
 assert.equal((await act(c,'a@example.invalid',true)).error,'not_authorized');
 assert.equal((await act(a,'a@example.invalid')).error,'cannot_remove_self');
 assert.equal((await act(a,'b@example.invalid')).ok,true);
 assert.equal((await act(b,'a@example.invalid')).error,'not_authorized');
 assert.equal((await db.query("select count(*)::int n from auth.users where raw_app_meta_data->>'role'='ohc_admin'")).rows[0].n,1);
 assert.equal((await act(a,'b@example.invalid',true)).ok,true);
 assert.equal((await db.query("select raw_app_meta_data->>'provider' p from auth.users where id=$1",[b])).rows[0].p,'email');
 await db.query('delete from auth.sessions where id=$1',[a]);assert.equal((await act(a,'b@example.invalid')).error,'not_authorized');
 assert.equal((await db.query('select count(*)::int n from public.ohc_admin_role_audit')).rows[0].n,2);
 await db.exec('set role anon');await assert.rejects(db.query('select public.ohc_audit_change_admin_role($1,true)',['a@example.invalid']),/permission denied/);
 }finally{await db.close();}
});
test('database shared limiter applies origin and account-pair limits, expiry and restricted grants',async()=>{
 const db=await dbSetup();try{
 await db.exec('set role service_role');const origin='a'.repeat(64),pair='b'.repeat(64);
 for(let i=0;i<5;i++)assert.equal((await db.query<{r:any}>("select public.ohc_audit_consume_limit('otp-send',$1,$2) r",[origin,pair])).rows[0].r.allowed,true);
 assert.equal((await db.query<{r:any}>("select public.ohc_audit_consume_limit('otp-send',$1,$2) r",[origin,pair])).rows[0].r.allowed,false);
 assert.equal((await db.query<{r:any}>("select public.ohc_audit_consume_limit('otp-send',$1,$2) r",['c'.repeat(64),'d'.repeat(64)])).rows[0].r.allowed,true);
 await db.exec("update ohc_audit_rate_limits set window_start=now()-interval '16 minutes'");assert.equal((await db.query<{r:any}>("select public.ohc_audit_consume_limit('otp-send',$1,$2) r",[origin,pair])).rows[0].r.allowed,true);
 await db.exec('reset role;set role authenticated');await assert.rejects(db.query("select public.ohc_audit_consume_limit('otp-send',$1,null)",[origin]),/permission denied/);await assert.rejects(db.query('select * from ohc_audit_rate_limits'),/permission denied/);await assert.rejects(db.query('select * from ohc_admin_role_audit'),/permission denied/);
 }finally{await db.close();}
});

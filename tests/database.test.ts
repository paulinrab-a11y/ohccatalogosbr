import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const schema=JSON.parse(readFileSync('tests/fixtures/database-schema.json','utf8'));
const ident=(s:string)=>'"'+s.replaceAll('"','""')+'"';
test('live grants/policies reproduced locally: anon + users A/B cannot CRUD private rows',async()=>{
 const db=new PGlite();
 try {
 await db.exec('create role anon; create role authenticated; grant usage on schema public to anon, authenticated;');
 const tables=[...new Set<string>(schema.columns.map((c:{table_name:string})=>c.table_name))];
 for(const table of tables){
  const columns=schema.columns.filter((c:{table_name:string})=>c.table_name===table);
  // Preserve column types and actual policies/grants. Constraints/defaults/FKs are outside this RLS test.
  await db.exec(`create table ${ident(table)} (${columns.map((c:{column_name:string;udt_name:string})=>ident(c.column_name)+' '+(c.udt_name.startsWith('_')?c.udt_name.slice(1)+'[]':c.udt_name)).join(',')}); alter table ${ident(table)} enable row level security;`);
  const flags=columns.filter((c:{column_name:string})=>['ativo','publicado','aprovado_administrador'].includes(c.column_name)).map((c:{column_name:string})=>c.column_name);
  await db.exec(`insert into ${ident(table)} ${flags.length?'('+flags.map(ident).join(',')+') values ('+flags.map(()=>'true').join(',')+')':'default values'};`);
  if(flags.length) await db.exec(`insert into ${ident(table)} (${flags.map(ident).join(',')}) values (${flags.map(()=>'false').join(',')});`);
 }
 for(const g of schema.grants) await db.exec(`grant ${g.privilege_type} on ${ident(g.table_name)} to ${ident(g.grantee)};`);
 for(const p of schema.policies) await db.exec(`create policy ${ident(p.policyname)} on ${ident(p.tablename)} for ${p.cmd} to ${p.roles.map(ident).join(',')} ${p.qual?'using ('+p.qual+')':''} ${p.with_check?'with check ('+p.with_check+')':''};`);
 let checks=0;
 for(const principal of [{role:'anon',id:''},{role:'authenticated',id:'00000000-0000-4000-8000-000000000001'},{role:'authenticated',id:'00000000-0000-4000-8000-000000000002'}]){
  await db.exec(`set role ${principal.role};`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[principal.id]);
  for(const table of tables){
   const isPublic=['catalog_products','BASE DE DADOS DOS VOLANTES'].includes(table);
   try{const result=await db.query(`select * from ${ident(table)}`);assert.equal(result.rows.length,isPublic?1:0,`${table} visible rows`);}catch(e){if(isPublic)throw e;assert.match(String(e),/permission denied/);}checks++;
   const column=schema.columns.find((c:{table_name:string})=>c.table_name===table).column_name;
   for(const sql of [`insert into ${ident(table)} default values`,`update ${ident(table)} set ${ident(column)}=${ident(column)}`,`delete from ${ident(table)}`]){
    try{const result=await db.query(sql);assert.equal(result.affectedRows,0,`${table} unauthorized write`);}catch(e){assert.match(String(e),/permission denied|row-level security/);}checks++;
   }
  }
  await db.exec('reset role;');
 }
 assert.equal(checks,156);
 } finally {await db.close();}
});
test('session predicate rejects wrong owner, expired and deleted sessions; execute restricted',async()=>{
 const db=new PGlite();
 try{
 await db.exec('create role anon; create role authenticated; create role service_role; create schema auth; create table auth.sessions(id uuid,user_id uuid,not_after timestamptz); grant usage on schema public to anon,authenticated,service_role;');
 await db.exec(readFileSync('supabase/migrations/20260922115606_audit_session_validation.sql','utf8'));
 const sid='00000000-0000-4000-8000-000000000001',uid='00000000-0000-4000-8000-000000000002';
 await db.query('insert into auth.sessions values($1,$2,null)',[sid,uid]);
 const active=async(user=uid)=> (await db.query<{ok:boolean}>('select public.ohc_audit_session_active($1,$2) as ok',[sid,user])).rows[0].ok;
 await db.exec('set role service_role');assert.equal(await active(),true);assert.equal(await active(sid),false);await db.exec('reset role');
 await db.exec("update auth.sessions set not_after=now()-interval '1 minute'");assert.equal(await active(),false);
 await db.exec('delete from auth.sessions');assert.equal(await active(),false);
 for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await assert.rejects(active(),/permission denied/);await db.exec('reset role');}
 }finally{await db.close();}
});
test('actual database limiter accepts 60 and rejects the 61st request across callers',async()=>{
 const db=new PGlite();
 try{
 await db.exec('create table public.compatibility_public_rate_limits(scope text primary key,window_started_at timestamptz,request_count integer,updated_at timestamptz);');
 await db.exec(schema.functions.find((f:{proname:string})=>f.proname==='ohc_consume_public_rate_limit').definition);
 const results=await Promise.all(Array.from({length:61},()=>db.query<{result:{allowed:boolean;retry_after:number}}>('select public.ohc_consume_public_rate_limit() result')));
 assert.equal(results.filter(r=>r.rows[0].result.allowed).length,60);assert.ok(results[60].rows[0].result.retry_after>0);
 await db.exec("update compatibility_public_rate_limits set window_started_at=now()-interval '61 seconds'");
 assert.equal((await db.query<{result:{allowed:boolean}}>('select public.ohc_consume_public_rate_limit() result')).rows[0].result.allowed,true);
 }finally{await db.close();}
});

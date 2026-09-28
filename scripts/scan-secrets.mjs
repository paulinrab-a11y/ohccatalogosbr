import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const rules = [
 ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
 ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
 ['privileged-api-key', /\b(?:sb_secret_[A-Za-z0-9_-]{20,}|sk_live_[A-Za-z0-9]{20,}|sk-proj-[A-Za-z0-9_-]{40,})\b/],
 ['database-password-url', /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]{8,}@/],
 ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
 ['hardcoded-secret', /(?:SERVICE_ROLE_KEY|OHC_EDGE_TOKEN|VERCEL_TOKEN|JWT_SECRET)\s*[:=]\s*["'][A-Za-z0-9_\-.]{24,}["']/i],
];
const findings=[];let scanned=0,history=0;
function scan(content,path){
 scanned++;
 for(const [rule,pattern] of rules)if(pattern.test(content))findings.push({path,rule});
 for(const match of content.matchAll(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g)){
  try{const claims=JSON.parse(Buffer.from(match[0].split('.')[1],'base64url'));if(claims.role!=='anon')findings.push({path,rule:'non-public-jwt'});}catch{}
 }
}
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){
 if(['node_modules','.git','.vercel','test-results','playwright-report'].includes(e.name))continue;
 const path=dir+'/'+e.name;if(e.isDirectory()){walk(path);continue;}
 if(/\.(?:webp|png|jpg|jpeg|glb|mp4|woff2|zip)$/i.test(path))continue;
 if(statSync(path).size>15000000)continue;scan(readFileSync(path,'utf8'),path);
}}
walk('.');
// Historical content is scanned without printing matching values.
try{const objects=execFileSync('git',['rev-list','--objects','--all'],{encoding:'utf8'}).trim().split('\n');
 for(const object of objects){const [sha,...parts]=object.split(' ');const path=parts.join(' ');if(!path||/\.(?:webp|png|jpg|jpeg|glb|mp4|woff2|zip)$/i.test(path))continue;
  if(execFileSync('git',['cat-file','-t',sha],{encoding:'utf8'}).trim()!=='blob')continue;
  scan(execFileSync('git',['cat-file','blob',sha],{encoding:'utf8',maxBuffer:20*1024*1024}),`history:${sha.slice(0,8)}:${path}`);history++;
 }
}catch(error){console.error('History scanning unavailable; source/build scan completed.');if(process.env.CI)process.exitCode=1;}
console.log(JSON.stringify({scanned,history_blobs:history,findings,limits:'Pattern-based inspection, not proof of absence; binaries excluded; no secret values logged.'},null,2));
if(findings.length)process.exitCode=1;

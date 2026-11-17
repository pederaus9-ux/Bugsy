'use strict';
// Public projection only. Never copy logs, source diagnostics, or raw artifacts.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os');
const MANIFEST_SHA='cb295313e3b7788f5dd6a63f92c09799a09f1523dacf8fa736ae62485434331d';
const MAX=8*1024*1024, statuses=['passed','failed','pending','running','blocked','timed_out','interrupted'];
const fail=()=>{throw Error('Quality receipt rejected');};
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function object(x,keys){if(!x||Object.getPrototypeOf(x)!==Object.prototype)fail();for(const k of Reflect.ownKeys(x)){if(typeof k!=='string'||!keys.includes(k)||!('value' in Object.getOwnPropertyDescriptor(x,k)))fail();}}
function number(x,max=1e9){if(typeof x!=='number'||!Number.isFinite(x)||x<0||x>max)fail();return x;}
function string(x,re){if(typeof x!=='string'||x.length>300||!re.test(x))fail();return x;}
function date(x){string(x,/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);if(new Date(x).toISOString()!==x)fail();return x;}
function enumeration(x,values){if(!values.includes(x))fail();return x;}
function same(a,b){if(JSON.stringify(a)!==JSON.stringify(b))fail();}
function manifest(){const raw=fs.readFileSync(path.join(__dirname,'../quality-loops.json'));if(sha(raw)!==MANIFEST_SHA)fail();return JSON.parse(raw);}
function identities(m,file){if(file==='horse-contact-feasibility.test.mjs')return m.horseContactCases.map(c=>({file,pattern:'^'+c.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$',caseName:c.name,expectedMeasurements:c.measurements}));if(file==='animal-visual.test.mjs')return m.visualPatterns.map(pattern=>({file,pattern}));return [{file}];}
function projectComparison(c,m){
 if(c===null)return null;
 object(c,['regressions','fixes','unchanged','notComparable','durationIsGamePerformance']);
 if(c.durationIsGamePerformance!==false)fail();
 const ids=m.lanes.map(l=>l.id),reasons=['No baseline selected','Test manifest changed; refusing pass/fail comparison',...['testFingerprint','runnerFingerprint','node','platform','hardware'].map(k=>'Incompatible or missing '+k),...ids,...m.lanes.filter(l=>l.kind==='browser').map(l=>l.id+': rendered measurement identity must be reviewed separately')];
 const out={};for(const k of ['regressions','fixes','unchanged','notComparable']){
  if(!Array.isArray(c[k])||c[k].length>reasons.length||new Set(c[k]).size!==c[k].length)fail();
  out[k]=c[k].map(x=>enumeration(x,k==='notComparable'?reasons:ids));
 }
 out.durationIsGamePerformance=false;return out;
}
function projectReport(r){
 const m=manifest();
 object(r,['schemaVersion','id','status','startedAt','finishedAt','head','branch','dirty','sourceStatus','manifestHash','testFingerprint','runnerFingerprint','runtimeTree','node','platform','hardware','executionContext','iteration','budgetMinutes','scope','notQualification','lanes','comparison','baseline','runnerError','publicProjection']);
 if(r.schemaVersion!==1||r.manifestHash!==MANIFEST_SHA||typeof r.dirty!=='boolean')fail();
 const out={schemaVersion:1,head:string(r.head,/^[a-f0-9]{40}$/),manifestHash:MANIFEST_SHA,dirty:r.dirty};
 for(const k of ['testFingerprint','runnerFingerprint'])out[k]=string(r[k],/^[a-f0-9]{64}$/);
 out.runtimeTree=string(r.runtimeTree,/^[a-f0-9]{40}$/);
 // These strings originate on the collector host, never from test-controlled text.
 if(r.node!==process.version||r.platform!==process.platform||r.hardware!==(os.cpus()[0]?.model))fail();
 Object.assign(out,{node:process.version,platform:process.platform,hardware:os.cpus()[0].model});
 out.iteration=number(r.iteration,3);if(!Number.isInteger(out.iteration)||out.iteration<1)fail();
 out.id=string(r.id,/^\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d-\d{3}Z-[a-f0-9]{8}-[1-3]$/);
 date(out.id.slice(0,24).replace(/T(\d\d)-(\d\d)-(\d\d)-(\d{3})Z$/, 'T$1:$2:$3.$4Z'));
 if(!out.id.endsWith('-'+out.head.slice(0,8)+'-'+out.iteration))fail();
 out.startedAt=date(r.startedAt);out.finishedAt=r.finishedAt===null?null:date(r.finishedAt);
 out.status=enumeration(r.status,statuses);out.executionContext=enumeration(r.executionContext,['local','GitHub Actions']);out.budgetMinutes=number(r.budgetMinutes,60);
 if(!Array.isArray(r.lanes)||r.lanes.length<1||r.lanes.length>m.lanes.length)fail();const seen=new Set();
 out.lanes=r.lanes.map(l=>{
 object(l,['id','title','kind','timeoutSeconds','files','defaultEnabled','status','steps']);
 const def=m.lanes.find(x=>x.id===l.id);if(!def||def.kind!=='node'||seen.has(l.id))fail();seen.add(l.id);
 for(const key of Object.keys(def))same(l[key],def[key]);
 const expected=def.files.flatMap(f=>identities(m,f));if(!Array.isArray(l.steps)||l.steps.length!==expected.length)fail();
 return {...def,status:enumeration(l.status,statuses),steps:l.steps.map((s,i)=>{
 object(s,['file','pattern','caseName','expectedMeasurements','status','log','artifacts','startedAt','finishedAt','code','signal','durationMs','evidenceFile','evidenceSha256','measurements','matchedTests','evidenceError','error','reason']);
 const identity=expected[i];for(const k of ['file','pattern','caseName','expectedMeasurements'])same(s[k],identity[k]);
 const t={...identity,status:enumeration(s.status,statuses)};
 for(const k of ['durationMs','measurements','matchedTests'])if(k in s)t[k]=number(s[k]);
 for(const k of ['startedAt','finishedAt'])if(k in s)t[k]=date(s[k]);
 if('evidenceSha256' in s)t.evidenceSha256=string(s.evidenceSha256,/^[a-f0-9]{64}$/);
 if('code' in s){if(s.code!==null&&(!Number.isInteger(s.code)||s.code<0||s.code>255))fail();t.code=s.code;}
 if('signal' in s)t.signal=enumeration(s.signal,[null,'SIGTERM','SIGKILL','SIGINT','SIGABRT','SIGSEGV']);
 return t;
 })};
 });
 // Preserve compareReports conclusions only from its finite literal vocabulary.
 out.comparison=projectComparison(r.comparison,m);
 if(r.baseline){
  object(r.baseline,['status','id','head','sourceRunId','artifactId','reason']);
  out.baseline={status:enumeration(r.baseline.status,['not_selected','unavailable','loaded'])};
  if('head'in r.baseline)out.baseline.head=string(r.baseline.head,/^[a-f0-9]{40}$/);
  if('id'in r.baseline)out.baseline.id=string(r.baseline.id,/^\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d-\d{3}Z-[a-f0-9]{8}-[1-3]$/);
  for(const k of ['sourceRunId','artifactId'])if(k in r.baseline)out.baseline[k]=string(r.baseline[k],/^[1-9]\d{0,19}$/);
 }
 out.publicProjection={schemaVersion:1,diagnostics:'withheld',comparison:'finite-original-conclusions',hardwareIdentity:'collector-host-verified'};
 if('publicProjection'in r)same(r.publicProjection,out.publicProjection);
 return out;
}
function readJson(root,parts){let p=path.resolve(root);for(const part of [null,...parts]){if(part!==null)p=path.join(p,part);const st=fs.lstatSync(p);if(st.isSymbolicLink())fail();}const st=fs.statSync(p);if(!st.isFile()||st.size>MAX)fail();return JSON.parse(fs.readFileSync(p,'utf8'));}
function collect(source,output){
 const latest=readJson(source,['latest.json']);object(latest,['id']);string(latest.id,/^\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d-\d{3}Z-[a-f0-9]{8}-[1-3]$/);
 const r=projectReport(readJson(source,[latest.id,'report.json']));if(r.id!==latest.id)fail();
 const dest=path.resolve(output);if(fs.existsSync(dest))fail();const parent=path.dirname(dest);if(fs.realpathSync(parent)!==parent)fail();
 fs.mkdirSync(dest,{mode:0o700});fs.mkdirSync(path.join(dest,r.id),{mode:0o700});
 fs.writeFileSync(path.join(dest,r.id,'report.json'),JSON.stringify(r)+'\n',{flag:'wx',mode:0o600});
 fs.writeFileSync(path.join(dest,'latest.json'),JSON.stringify({id:r.id})+'\n',{flag:'wx',mode:0o600});
 return r;
}
module.exports={projectReport,projectComparison,collect,identities,manifest,readJson,MANIFEST_SHA};
if(require.main===module){try{const a=process.argv.slice(2);if(a.length!==4||a[0]!=='--source'||a[2]!=='--output')fail();collect(a[1],a[3]);process.stdout.write('Quality receipt collected\n');}catch{process.stderr.write('Quality receipt rejected\n');process.exitCode=1;}}

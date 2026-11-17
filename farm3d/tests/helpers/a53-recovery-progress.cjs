'use strict';
const fs=require('node:fs'),path=require('node:path');
const keys=(v,a)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===a.slice().sort().join('|');
const category=e=>{try{return e?.name==='AssertionError'?'assertion':e?.name==='TimeoutError'?'timeout':e?.name==='TargetClosedError'?'browser-operation':'other';}catch{return'other';}};
const integer=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max;
function valid(v){return keys(v,['schema','checkpoint','checks','overflow','caught','uncaught','exitCode'])&&v.schema===1&&integer(v.checkpoint,34)&&Array.isArray(v.checks)&&v.checks.length<=64&&v.checks.every(x=>typeof x==='boolean')&&typeof v.overflow==='boolean'&&(v.exitCode===null||integer(v.exitCode,255))&&['caught','uncaught'].every(k=>v[k]===null||keys(v[k],['site','category','checkpoint'])&&(k==='caught'?['body','top']:['uncaughtException','unhandledRejection','other']).includes(v[k].site)&&['assertion','timeout','browser-operation','other'].includes(v[k].category)&&integer(v[k].checkpoint,34));}
function create({runnerTemp=process.env.RUNNER_TEMP,events=process,write=fs.writeFileSync,mkdir=fs.mkdirSync}={}){
 const s={schema:1,checkpoint:0,checks:[],overflow:false,caught:null,uncaught:null,exitCode:null};
 const observe=fn=>{try{fn();if(runnerTemp&&valid(s)){const p=path.join(runnerTemp,'a53-recovery-progress','phase.json');mkdir(path.dirname(p),{recursive:true});write(p,JSON.stringify(s)+'\n');}}catch{}};
 events.on('uncaughtExceptionMonitor',(e,origin)=>observe(()=>{if(!s.uncaught)s.uncaught={site:['uncaughtException','unhandledRejection'].includes(origin)?origin:'other',category:category(e),checkpoint:s.checkpoint};}));
 events.on('exit',code=>observe(()=>{s.exitCode=integer(code,255)?code:null;}));observe(()=>{});
 return{mark(n){observe(()=>{if(integer(n,34)&&n>0)s.checkpoint=n;});},check(v){observe(()=>{if(typeof v!=='boolean')return;if(s.checks.length<64)s.checks.push(v);else s.overflow=true;});},caught(e,site){observe(()=>{if(!s.caught&&['body','top'].includes(site))s.caught={site,category:category(e),checkpoint:s.checkpoint};});}};
}
module.exports={valid,create,category};

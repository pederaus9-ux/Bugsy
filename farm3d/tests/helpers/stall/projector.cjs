'use strict';
const MAX_BYTES=65536;
const number=(v,limit=1e6)=>{if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>limit)throw Error('invalid finite telemetry');return v;};
const positive=(v,limit)=>{number(v,limit);if(v<0)throw Error('negative value');return v;};
const count=v=>{number(v,1e9);if(!Number.isInteger(v)||v<0)throw Error('invalid count');return v;};
const flag=v=>{if(typeof v!=='boolean')throw Error('invalid flag');return v;};
const point=p=>{if(!Array.isArray(p)||p.length!==2)throw Error('invalid point');return p.map(v=>number(v));};
const choice=(v,a)=>{if(!a.includes(v))throw Error('invalid enum');return v;};
const keys=['requests','applied','failed','cancelled','snapshotVisits','plannerVisits','validationVisits','used','remaining','maxUsed','queued'];
function project(raw){
 if(!raw||!Array.isArray(raw.actors)||raw.actors.length!==5)throw Error('invalid actors');
 const ids=new Set();const actors=raw.actors.map(a=>{const id=count(a.id);if(id>4||ids.has(id))throw Error('invalid identity');ids.add(id);
 const pathCount=count(a.pathCount),waypointCount=count(a.waypointCount);if(pathCount>64||waypointCount>64||!Array.isArray(a.pathPrefix)||a.pathPrefix.length!==Math.min(3,pathCount)||!Array.isArray(a.waypointPrefix)||a.waypointPrefix.length!==Math.min(3,waypointCount))throw Error('invalid route');
 return{id,position:point(a.position),kind:choice(a.kind,['bed','other','none']),stage:choice(a.stage,['approach','align','hold','exit','other','none']),weight:positive(a.weight,1),custom:flag(a.custom),guardPresent:flag(a.guardPresent),guardIdentityMatches:flag(a.guardIdentityMatches),nonfinal:flag(a.nonfinal),rootStaticClear:flag(a.rootStaticClear),rootPenClear:flag(a.rootPenClear),nextStaticClear:flag(a.nextStaticClear),nextPenClear:flag(a.nextPenClear),edgeStaticClear:flag(a.edgeStaticClear),edgePenClear:flag(a.edgePenClear),pathCount,waypointCount,pathPrefix:a.pathPrefix.map(point),waypointPrefix:a.waypointPrefix.map(point),goal:a.goal===null?null:point(a.goal)};
 });
 const stats={};for(const k of keys)stats[k]=count(raw.stats[k]);if(stats.used>512||stats.remaining>512||stats.maxUsed>512||stats.queued>16||![0,512].includes(stats.used+stats.remaining)||stats.maxUsed<stats.used)throw Error('invalid budget');
 return{hz:choice(raw.hz,[30,60,120]),reverse:flag(raw.reverse),checkpoint:choice(raw.checkpoint,['start','first-stall','terminal']),simSeconds:positive(raw.simSeconds,500),actors,stats};
}
function encode(samples){if(!Array.isArray(samples)||samples.length>18)throw Error('invalid samples');const seen=new Set();const clean=samples.map(project);for(const s of clean){const k=[s.hz,s.reverse,s.checkpoint].join(':');if(seen.has(k))throw Error('duplicate sample');seen.add(k);}const text=JSON.stringify({schema:1,scope:'synthetic-v1-stall-only',samples:clean});if(Buffer.byteLength(text)>MAX_BYTES)throw Error('oversize telemetry');return text;}
module.exports={project,encode,keys,MAX_BYTES};

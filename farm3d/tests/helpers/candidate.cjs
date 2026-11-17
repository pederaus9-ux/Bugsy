'use strict';
const crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const PRE='40a2bbcef45e5a29f463768937ef849a8aff53075d7820fba613d5064e5a294c';
const helpers=`// Narrow default-bed transit safety; transient ownership only, never a geometry exemption.
const cowCareTransitGuards=new WeakMap();
function cowCarePointUnoccupied(p){return !!p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&!OBST.some(o=>insideObst(o,p,.42));}
function cowCareTransitStatus(a,task,p){
  let guard=cowCareTransitGuards.get(task);
  const context=task.kind==='bed'&&task.stage==='approach'&&!task.layoutReturn&&!COW_YARD_LAYOUT.custom&&!!task.token&&!!task.station;
  if(!guard){
    if(!context||task.path.length<2||!cowCarePointUnoccupied(a.pos)||!cowCarePointUnoccupied(p))return 0;
    guard={actor:a,ref:a.ref,index:a.ref.i,token:task.token,station:task.station};cowCareTransitGuards.set(task,guard);return 1;
  }
  if(!context||guard.actor!==a||guard.ref!==a.ref||guard.index!==a.ref.i||guard.token!==task.token||guard.station!==task.station)return 2;
  // A changed leg or geometry must requalify against CURRENT registry, not old skipA.
  return cowCarePointUnoccupied(a.pos)&&cowCarePointUnoccupied(p)?1:2;
}
function cowCareTransitStepClear(from,to,status){
  return status===1&&fitsPen(PENS.courtyard,from.x,from.y,.42)&&fitsPen(PENS.courtyard,to.x,to.y,.42)&&cowCarePointUnoccupied(to)&&hitsBlock(from,to,.42,null)<0;
}
`;
const transformations=[
 ["}else if(!blockedBedLeg&&!task.waypoints.length){if(task.stage==='exit')","}else if(!blockedBedLeg&&!task.waypoints.length&&!cowCareTransitGuards.has(task)){if(task.stage==='exit')"],
 ['function updateCowTaskStep(a,dt,t){',helpers+'function updateCowTaskStep(a,dt,t){'],
 ["      if(typeof steerCowPersonalSpace==='function'){ // personal-space cushion on care trips too", "      const transitStatus=cowCareTransitStatus(a,task,p);let transitCommitted=false;\n      if(typeof steerCowPersonalSpace==='function'){ // personal-space cushion on care trips too"],
 ["      const next=new THREE.Vector2(ox+nx,oz+nz),blockingCows=animals.filter(b=>b!==a&&b.kind==='cow'&&Math.hypot(b.g.position.x-next.x,b.g.position.z-next.y)<.85);\n      if(!blockingCows.length&&cowGateSegmentClear(a.pos,next)){a.g.position.x=next.x;a.g.position.z=next.y;}",
  "      let next=new THREE.Vector2(ox+nx,oz+nz);const preferredClear=!transitStatus||cowCareTransitStepClear(a.pos,next,transitStatus);let transitClear=preferredClear;\n      if(transitStatus&&!transitClear){\n        const desired=new THREE.Vector2(ox+dx/(d||1)*step,oz+dz/(d||1)*step);\n        if(cowCareTransitStepClear(a.pos,desired,transitStatus)){next=desired;nx=desired.x-ox;nz=desired.y-oz;transitClear=true;}\n      }\n      const blockingCows=animals.filter(b=>b!==a&&b.kind==='cow'&&Math.hypot(b.g.position.x-next.x,b.g.position.z-next.y)<.85);\n      if(!blockingCows.length&&transitClear&&cowGateSegmentClear(a.pos,next)){a.g.position.x=next.x;a.g.position.z=next.y;transitCommitted=true;}"],
 ["            if(clear){a.g.position.x=x;a.g.position.z=z;task.avoidSide=sign;break;}","            if(clear&&(!transitStatus||cowCareTransitStepClear(a.pos,new THREE.Vector2(x,z),transitStatus))){a.g.position.x=x;a.g.position.z=z;task.avoidSide=sign;transitCommitted=true;break;}"],
 ["      else if(d<.035)task.path.shift();", "      else if(d<.035&&(!transitStatus||(transitCommitted&&Math.hypot(a.g.position.x-p.x,a.g.position.z-p.y)<.035))){task.path.shift();if(transitStatus&&task.path.length<2)cowCareTransitGuards.delete(task);}"]
];
function replace(s,a,b){if(s.split(a).length!==2)throw Error('occurrence');return s.replace(a,b);}
function patch(input){const b=Buffer.from(input);if(sha(b)!==PRE)throw Error('preimage');let s=b.toString();for(const [a,c]of transformations)s=replace(s,a,c);return Buffer.from(s);}
function inverse(input){let s=Buffer.from(input).toString();for(const [a,c]of [...transformations].reverse())s=replace(s,c,a);const b=Buffer.from(s);if(sha(b)!==PRE)throw Error('inverse');return b;}
module.exports={patch,inverse,transformations,helpers,preimageSha256:PRE};

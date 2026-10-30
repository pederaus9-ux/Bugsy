import test from 'node:test';import assert from 'node:assert/strict';
import {steerCowPersonalSpace,COW_CONTACT,COW_PERSONAL} from '../cow-personal-space.js';
// A small kinematic stand-in for the game's ordinary cow steering: velocity eases toward the steered
// desire and a step that would end inside contact distance is refused (as index.html does).
function simulate(starts,targets,{seconds=20,hz=30,retarget}={}){
  const cows=starts.map(([x,y],i)=>({id:'c'+i,x,y,vx:0,vy:0,target:{x:targets[i][0],y:targets[i][1]},state:{selfId:'c'+i},heading:null,reversals:0,turn:0}));
  let minGap=Infinity,redirects=0;const dt=1/hz;
  for(let f=0;f<seconds*hz;f++){const t=f*dt;
    for(const c of cows){
      const tx=c.target.x-c.x,ty=c.target.y-c.y,d=Math.hypot(tx,ty);
      const want=d<.35?{x:0,y:0}:{x:tx/d*.9,y:ty/d*.9};
      const others=cows.filter(o=>o!==c).map(o=>({id:o.id,x:o.x,y:o.y}));
      const s=steerCowPersonalSpace({x:c.x,y:c.y},want,others,c.state,t);
      if(s.redirect){redirects++;const n=others.reduce((m,o)=>Math.hypot(o.x-c.x,o.y-c.y)<Math.hypot(m.x-c.x,m.y-c.y)?o:m);c.target=retarget?retarget(c,others):{x:c.x+(c.x-n.x)*3,y:c.y+(c.y-n.y)*3};}
      c.vx+=(s.x-c.vx)*Math.min(1,dt*4);c.vy+=(s.y-c.vy)*Math.min(1,dt*4);
      const nx=c.x+c.vx*dt,ny=c.y+c.vy*dt;
      const clear=others.every(o=>Math.hypot(nx-o.x,ny-o.y)>=Math.min(COW_CONTACT,Math.hypot(c.x-o.x,c.y-o.y)));
      if(clear){const mx=nx-c.x,my=ny-c.y;if(Math.hypot(mx,my)/dt>.02){const h=Math.atan2(mx,my);if(c.heading!==null){let dh=h-c.heading;dh=Math.atan2(Math.sin(dh),Math.cos(dh));c.turn+=Math.abs(dh);if(Math.abs(dh)>Math.PI/2)c.reversals++;}c.heading=h;}c.x=nx;c.y=ny;}else{c.vx=c.vy=0;}
    }
    for(let i=0;i<cows.length;i++)for(let j=i+1;j<cows.length;j++)minGap=Math.min(minGap,Math.hypot(cows[i].x-cows[j].x,cows[i].y-cows[j].y));
  }
  return {cows,minGap,redirects};
}
test('two cows walking head-on keep the cushion and never reach contact distance',()=>{
  const r=simulate([[-4,0],[4,0]],[[4,0],[-4,0]]);
  assert.ok(r.minGap>COW_CONTACT+.2,'min gap '+r.minGap);
  for(const c of r.cows){assert.equal(c.reversals,0,'no heading flip-flop');assert.ok(c.turn<2*Math.PI,'no spinning: total turn '+c.turn);}
});
test('two cows that start overlapping the cushion separate without spinning',()=>{
  const r=simulate([[0,0],[.9,0]],[[3,0],[-3,0]],{seconds:10});
  const [a,b]=r.cows;assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=COW_PERSONAL-.05,'they end outside personal space');
  assert.ok(r.minGap>=COW_CONTACT-1e-9);
  for(const c of r.cows)assert.ok(c.turn<2*Math.PI,'no spinning: total turn '+c.turn);
});
test('glancing and same-target approaches never touch',()=>{
  for(const [s,g] of [[[[-4,.3],[4,-.3]],[[4,.3],[-4,-.3]]],[[[-3,0],[0,3]],[[1,0],[1,0]]],[[[-3,-3],[3,-3],[0,3]],[[0,0],[0,0],[0,0]]]]){
    const r=simulate(s,g,{seconds:15});assert.ok(r.minGap>=COW_CONTACT,'min gap '+r.minGap);
    for(const c of r.cows)assert.ok(c.reversals<=2,JSON.stringify(g)+' reversals '+c.reversals);
  }
});
test('side choice is held through the cooldown (hysteresis)',()=>{
  const state={selfId:'a'},other=[{id:'b',x:1.2,y:0}];
  const first=steerCowPersonalSpace({x:0,y:0},{x:1,y:.001},other,state,0),side=state.side;
  steerCowPersonalSpace({x:0,y:0},{x:1,y:-.001},other,state,.5);assert.equal(state.side,side,'a tiny wobble does not flip the side');
  assert.ok(first.x*1+first.y*0<1);
});
test('steering cost is bounded',()=>{
  const others=Array.from({length:30},(_,i)=>({id:'o'+i,x:Math.cos(i)*1.2,y:Math.sin(i)*1.2})),state={selfId:'s'};
  const t0=performance.now();for(let i=0;i<30000;i++)steerCowPersonalSpace({x:0,y:0},{x:1,y:0},others,state,i/30);
  assert.ok((performance.now()-t0)/30000<.05,'per call well under 0.05 ms');
});

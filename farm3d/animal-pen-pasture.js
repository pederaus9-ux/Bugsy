// Bigger default pastures (owner-approved 2026-10-30 17:57 CDT, amendment A41).
// Rather than rewriting the frozen PR95 templates, a farm still on a template-sized pen is grown into a
// custom pen through the same record the in-game pen editor saves: fence edges move outward one metre
// at a time (the editor's snap), and every step must pass the full pen validation against the live farm
// (buildings, fields, paths, decorations, other pens, hills). Buildings inside the pen (shelter, beds,
// feed, water, robot, coop) keep their exact positions, so no station or animal ever ends up outside.
import {PEN_TEMPLATES} from './animal-pen-templates.js?v=1';
import {defaultSiteRecord} from './animal-pen-layout.js?v=1';
import {polygonArea} from './animal-pen-geometry.js?v=1';
export const PASTURE_TARGET_RATIO=1.5;
const clone=x=>structuredClone(x);
const ring=s=>s.boundary.map(v=>[v.x,v.z]);
function signedArea(p){let a=0;for(let i=0;i<p.length;i++){const[x1,z1]=p[i],[x2,z2]=p[(i+1)%p.length];a+=x1*z2-x2*z1;}return a/2;}
/** Template baseline area for a fenced kind, or 0 for unfenced kinds. */
/**
 * True when edge a->b lies against a structure wall (a long thin block within 0.6 m covering at least three quarters of the
 * edge). Moving such an edge only adds a strip hidden behind the barn wall: the fence the player sees stays put
 * and cows wander into a narrow corridor "outside" it (owner report 2026-10-30 19:44 CDT).
 */
export function edgeAgainstWall(a,b,walls=[]){
  const horiz=Math.abs(b.z-a.z)<1e-6,vert=Math.abs(b.x-a.x)<1e-6;if(!horiz&&!vert)return false;
  const lo=horiz?Math.min(a.x,b.x):Math.min(a.z,b.z),hi=horiz?Math.max(a.x,b.x):Math.max(a.z,b.z),len=hi-lo;
  for(const [x,z,hw,hd] of walls){
    const along=horiz?[x-hw,x+hw]:[z-hd,z+hd],across=horiz?Math.abs(z-a.z):Math.abs(x-a.x),thin=horiz?hd:hw;
    const overlap=Math.min(hi,along[1])-Math.max(lo,along[0]);
    if(across<.02)continue; // the pen's own fence rail sits exactly on the edge: not a wall
    if(thin<=.5&&across<=.6+thin&&overlap>=len*.75)return true;
  }
  return false;
}
/** A pen this module grew earlier (axis-aligned rectangle around the template, no interior runs, default
 * structures) whose growth went behind a structure wall: reset it to the template so it can regrow in the open. */
export function wallBoundPasture(animalPens,kind,walls){
  const site=animalPens?.sites?.[kind],def=defaultSiteRecord(kind);
  if(!site?.boundary||site.runs?.length||site.boundary.length!==4||JSON.stringify(site.structures)!==JSON.stringify(def.structures))return null;
  const xs=site.boundary.map(v=>v.x),zs=site.boundary.map(v=>v.z),dx=def.boundary.map(v=>v.x),dz=def.boundary.map(v=>v.z);
  const [x0,x1,z0,z1]=[Math.min(...xs),Math.max(...xs),Math.min(...zs),Math.max(...zs)],[d0,d1,e0,e1]=[Math.min(...dx),Math.max(...dx),Math.min(...dz),Math.max(...dz)];
  if(new Set(xs).size!==2||new Set(zs).size!==2||x0>d0||x1<d1||z0>e0||z1<e1)return null;
  const B=def.boundary,moved=[[x0<d0,B.find(v=>v.x===d0&&v.z===e0),B.find(v=>v.x===d0&&v.z===e1)],[x1>d1,B.find(v=>v.x===d1&&v.z===e0),B.find(v=>v.x===d1&&v.z===e1)],[z0<e0,B.find(v=>v.z===e0&&v.x===d0),B.find(v=>v.z===e0&&v.x===d1)],[z1>e1,B.find(v=>v.z===e1&&v.x===d0),B.find(v=>v.z===e1&&v.x===d1)]];
  if(!moved.some(([m,a,b])=>m&&edgeAgainstWall(a,b,walls)))return null;
  const value=clone(animalPens);value.sites[kind]={...clone(site),boundary:clone(def.boundary)};return value;
}
export function templateArea(kind){const b=PEN_TEMPLATES[kind]?.baseline;return b?.polygon?polygonArea(b.polygon):0;}
/**
 * Grow `kind`'s pen in an AnimalPens value toward PASTURE_TARGET_RATIO x its template area.
 * isValid(candidateAnimalPens) must run the game's full decode/resolve/validate. Returns
 * {value,area,from,steps} with the grown layout, or null when the pen is already big enough,
 * customized beyond the template size, or cannot grow at all.
 */
export function growPasture(animalPens,kind,options={}){const it=growPastureSteps(animalPens,kind,options);let r=it.next();while(!r.done)r=it.next();return r.value;}
/** Same as growPasture, but yields after every validation so the game can spread the work over frames. */
export function* growPastureSteps(animalPens,kind,{isValid,ratio=PASTURE_TARGET_RATIO,maxSteps=48,walls=[]}={}){
  if(typeof isValid!=='function')throw new TypeError('growPasture needs isValid');
  const base=templateArea(kind);if(!base)return null;
  const start=clone(animalPens??{v:1,revision:0,sites:{}});start.sites??={};
  const site=start.sites[kind]?clone(start.sites[kind]):defaultSiteRecord(kind);
  if(!site.boundary||site.runs?.length)return null; // interior fences mean a player design: leave it alone
  const from=polygonArea(ring(site)),target=base*ratio;
  if(from>=target-1e-6||from>base*1.05)return null; // already big, or already enlarged by the player
  const orient=Math.sign(signedArea(ring(site)))||1;let cur=site,area=from,steps=0,moved=true;
  while(area<target-1e-6&&moved&&steps<maxSteps){
    moved=false;
    for(let i=0;i<cur.boundary.length&&area<target-1e-6&&steps<maxSteps;i++){
      const a=cur.boundary[i],b=cur.boundary[(i+1)%cur.boundary.length],ex=b.x-a.x,ez=b.z-a.z,len=Math.hypot(ex,ez);if(len<1e-6)continue;
      if(edgeAgainstWall(a,b,walls))continue; // never grow out behind the barn wall
      // Outward normal for this winding, snapped to whole metres like the editor's moveEdge.
      const nx=Math.round(ez/len*orient),nz=Math.round(-ex/len*orient);if(!nx&&!nz)continue;
      const next=clone(cur),na=next.boundary[i],nb=next.boundary[(i+1)%next.boundary.length];
      na.x+=nx;na.z+=nz;nb.x+=nx;nb.z+=nz;
      const nextArea=polygonArea(ring(next));if(nextArea<=area+1e-6)continue;
      const candidate=clone(start);candidate.sites[kind]=next;
      let ok=false;try{ok=!!isValid(candidate);}catch{ok=false;}
      yield steps;
      if(ok){cur=next;area=nextArea;steps++;moved=true;}
    }
  }
  if(!steps)return null;
  const value=clone(start);value.sites[kind]=cur;value.revision=(start.revision|0)+1;
  return {value,area,from,steps};
}

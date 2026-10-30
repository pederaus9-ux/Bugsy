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
export function templateArea(kind){const b=PEN_TEMPLATES[kind]?.baseline;return b?.polygon?polygonArea(b.polygon):0;}
/**
 * Grow `kind`'s pen in an AnimalPens value toward PASTURE_TARGET_RATIO x its template area.
 * isValid(candidateAnimalPens) must run the game's full decode/resolve/validate. Returns
 * {value,area,from,steps} with the grown layout, or null when the pen is already big enough,
 * customized beyond the template size, or cannot grow at all.
 */
export function growPasture(animalPens,kind,{isValid,ratio=PASTURE_TARGET_RATIO,maxSteps=48}={}){
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
      // Outward normal for this winding, snapped to whole metres like the editor's moveEdge.
      const nx=Math.round(ez/len*orient),nz=Math.round(-ex/len*orient);if(!nx&&!nz)continue;
      const next=clone(cur),na=next.boundary[i],nb=next.boundary[(i+1)%next.boundary.length];
      na.x+=nx;na.z+=nz;nb.x+=nx;nb.z+=nz;
      const nextArea=polygonArea(ring(next));if(nextArea<=area+1e-6)continue;
      const candidate=clone(start);candidate.sites[kind]=next;
      let ok=false;try{ok=!!isValid(candidate);}catch{ok=false;}
      if(ok){cur=next;area=nextArea;steps++;moved=true;}
    }
  }
  if(!steps)return null;
  const value=clone(start);value.sites[kind]=cur;value.revision=(start.revision|0)+1;
  return {value,area,from,steps};
}

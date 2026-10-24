// Test-only exact specialization of the accepted rectangular cow slab.
// The native journey still checks every skinned vertex on every simulated
// frame. It compares this result with the production sampler on all vertices
// after Apply before beginning the long continuation.
import {PEN_TEMPLATES} from '../animal-pen-templates.js?v=1';

const polygon=PEN_TEMPLATES.cow.baseline.polygon;
const floor=PEN_TEMPLATES.cow.baseline.floor;
const xs=polygon.map(p=>p[0]),zs=polygon.map(p=>p[1]);
const x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs);
if(polygon.length!==4||new Set(polygon.map(p=>p.join(','))).size!==4||
 polygon.some(([x,z])=>(x!==x0&&x!==x1)||(z!==z0&&z!==z1))||
 !(x1>x0&&z1>z0))throw Error('Cow slab is no longer the reviewed rectangle');

export function fastCowSupport(site,x,z,groundY){
 const [shiftX,shiftZ]=site.components.shelter.delta;
 const px=x-shiftX,pz=z-shiftZ;
 const dx=Math.max(x0-px,0,px-x1),dz=Math.max(z0-pz,0,pz-z1);
 return (dx===0&&dz===0)||Math.hypot(dx,dz)<=1e-9?floor:groundY(x,z);
}

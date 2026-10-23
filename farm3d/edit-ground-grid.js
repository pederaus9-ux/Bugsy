import * as T from './lib/three.module.min.js';
import {pointInShape,shapeIntersectsPolygon} from './animal-pen-geometry.js?v=1';

const STEP=1,HALF=.45,MAX_CELLS=10000;
function bounds(shape){
 if(shape.type==='capsule')return[Math.min(shape.a[0],shape.b[0])-shape.r,Math.max(shape.a[0],shape.b[0])+shape.r,Math.min(shape.a[1],shape.b[1])-shape.r,Math.max(shape.a[1],shape.b[1])+shape.r];
 if(shape.type==='circle')return[shape.x-shape.r,shape.x+shape.r,shape.z-shape.r,shape.z+shape.r];
 if(shape.type==='rectangle')return[shape.x-shape.hw,shape.x+shape.hw,shape.z-shape.hd,shape.z+shape.hd];
 const points=shape.points??[];return[Math.min(...points.map(p=>p[0])),Math.max(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[1]))];
}
/** A neutral visual lattice, never an Apply/placement oracle. */
export function createEditableGroundGrid(groundY){
 const group=new T.Group();group.name='Editable ground grid';group.visible=false;let key='',lines=null;
 function updateMask({land=[],blocked=[],path=[]}={}){
  const next=JSON.stringify([land,blocked,path]);if(key===next)return false;key=next;
  if(lines){group.remove(lines);lines.geometry.dispose();lines.material.dispose();lines=null;}
  const start=performance.now(),limits=land.map(bounds),objects=[...blocked,...path].map(s=>({shape:s,b:bounds(s)})),tiles=[],positions=[];
  if(!limits.length){Object.assign(group.userData,{tileCount:0,maskedCount:0,states:'unchecked',bounds:null,tiles:[],buildMs:performance.now()-start});return true;}
  const x0=Math.ceil(Math.min(...limits.map(b=>b[0]))),x1=Math.floor(Math.max(...limits.map(b=>b[1]))),z0=Math.ceil(Math.min(...limits.map(b=>b[2]))),z1=Math.floor(Math.max(...limits.map(b=>b[3])));
  if((x1-x0+1)*(z1-z0+1)>MAX_CELLS)throw Error('Editable ground grid exceeds its bounded farm extent');
  let masked=0;
  for(let x=x0;x<=x1;x+=STEP)for(let z=z0;z<=z1;z+=STEP){
   const corners=[[x-HALF,z-HALF],[x+HALF,z-HALF],[x+HALF,z+HALF],[x-HALF,z+HALF]];
   if(!corners.every(p=>land.some(s=>pointInShape(p,s))))continue;
   if(objects.some(({shape,b})=>b[0]<=x+HALF&&b[1]>=x-HALF&&b[2]<=z+HALF&&b[3]>=z-HALF&&shapeIntersectsPolygon(shape,corners))){masked++;continue;}
   const y=corners.map(p=>groundY(...p)+.09);if(y.some(n=>!Number.isFinite(n)))continue;
   tiles.push([x,z]);for(let i=0;i<4;i++){const j=(i+1)%4;positions.push(corners[i][0],y[i],corners[i][1],corners[j][0],y[j],corners[j][1]);}
  }
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(positions,3)),material=new T.LineBasicMaterial({color:0xf5f1d6,transparent:true,opacity:.48,depthTest:true,depthWrite:false});
  lines=new T.LineSegments(geometry,material);lines.renderOrder=997;group.add(lines);
  Object.assign(group.userData,{tileCount:tiles.length,maskedCount:masked,states:'unchecked',bounds:[x0,x1,z0,z1],tiles,buildMs:performance.now()-start});
  return true;
 }
 group.updateMask=updateMask;group.dispose=()=>{if(lines){group.remove(lines);lines.geometry.dispose();lines.material.dispose();lines=null;}key='';};return group;
}

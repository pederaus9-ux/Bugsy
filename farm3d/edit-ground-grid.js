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
 const group=new T.Group();group.name='Editable ground grid';group.visible=false;let key='',viewKey='',lines=null,world=null,fullBounds=null,large=false;
 function draw([x0,x1,z0,z1]){
  if(lines){group.remove(lines);lines.geometry.dispose();lines.material.dispose();lines=null;}
  const start=performance.now(),{land,blocked,path}=world,objects=[...blocked,...path].map(s=>({shape:s,b:bounds(s)})),tiles=[],positions=[];
  const step=Math.max(1,Math.ceil(Math.sqrt((x1-x0+1)*(z1-z0+1)/MAX_CELLS))),half=HALF*step;
  let masked=0;
  for(let x=x0;x<=x1;x+=step)for(let z=z0;z<=z1;z+=step){
   const corners=[[x-half,z-half],[x+half,z-half],[x+half,z+half],[x-half,z+half]];
   if(!corners.every(p=>land.some(s=>pointInShape(p,s))))continue;
   if(objects.some(({shape,b})=>b[0]<=x+half&&b[1]>=x-half&&b[2]<=z+half&&b[3]>=z-half&&shapeIntersectsPolygon(shape,corners))){masked++;continue;}
   const y=corners.map(p=>groundY(...p)+.09);if(y.some(n=>!Number.isFinite(n)))continue;
   tiles.push([x,z]);for(let i=0;i<4;i++){const j=(i+1)%4;positions.push(corners[i][0],y[i],corners[i][1],corners[j][0],y[j],corners[j][1]);}
  }
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(positions,3)),material=new T.LineBasicMaterial({color:0xf5f1d6,transparent:true,opacity:.48,depthTest:true,depthWrite:false});
  lines=new T.LineSegments(geometry,material);lines.renderOrder=997;group.add(lines);
  Object.assign(group.userData,{tileCount:tiles.length,maskedCount:masked,states:'unchecked',bounds:[x0,x1,z0,z1],fullBounds,step,tiles,buildMs:performance.now()-start});
  return true;
 }
 function updateView({x=0,z=0,dist=45,fov=38,aspect=1.5}={}){
  if(!large||!world)return false;
  const [fx0,fx1,fz0,fz1]=fullBounds,r=Math.tan(fov*Math.PI/360)*dist,rx=r*aspect+8,rz=r+8;
  const box=[Math.max(fx0,Math.floor((x-rx)/8)*8),Math.min(fx1,Math.ceil((x+rx)/8)*8),Math.max(fz0,Math.floor((z-rz)/8)*8),Math.min(fz1,Math.ceil((z+rz)/8)*8)],next=JSON.stringify(box);
  if(next===viewKey)return false;viewKey=next;return draw(box);
 }
 function updateMask({land=[],blocked=[],path=[]}={}){
  const next=JSON.stringify([land,blocked,path]);if(key===next)return false;key=next;viewKey='';world={land,blocked,path};
  const start=performance.now(),limits=land.map(bounds);
  if(!limits.length){if(lines){group.remove(lines);lines.geometry.dispose();lines.material.dispose();lines=null;}fullBounds=null;large=false;Object.assign(group.userData,{tileCount:0,maskedCount:0,states:'unchecked',bounds:null,fullBounds:null,tiles:[],buildMs:performance.now()-start});return true;}
  fullBounds=[Math.ceil(Math.min(...limits.map(b=>b[0]))),Math.floor(Math.max(...limits.map(b=>b[1]))),Math.ceil(Math.min(...limits.map(b=>b[2]))),Math.floor(Math.max(...limits.map(b=>b[3])))];
  large=(fullBounds[1]-fullBounds[0]+1)*(fullBounds[3]-fullBounds[2]+1)>MAX_CELLS;
  return large?updateView():draw(fullBounds);
 }
 group.updateMask=updateMask;group.updateView=updateView;group.dispose=()=>{if(lines){group.remove(lines);lines.geometry.dispose();lines.material.dispose();lines=null;}key=viewKey='';world=null;};return group;
}

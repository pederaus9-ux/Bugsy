// Actual skinned thigh/body comparison for the rejected landing-hold overlay.
import * as T from '../lib/three.module.min.js';
import {createChicken3D,updateChicken3D} from './experiments/chicken-motion/landing-hold-d.mjs';
const r=createChicken3D(.72),g=r.card.geometry,coat=new T.Color(0xf2efe4),body=r.card.skeleton.bones.indexOf(r.body),bodyIds=[],thighIds=r.legs.map(()=>[]);
for(let i=0;i<g.attributes.position.count;i++)if(Math.abs(g.attributes.color.getX(i)-coat.r)<1e-6&&Math.abs(g.attributes.color.getY(i)-coat.g)<1e-6&&Math.abs(g.attributes.color.getZ(i)-coat.b)<1e-6){
 if(g.attributes.skinIndex.getX(i)===body)bodyIds.push(i);
 for(let j=0;j<2;j++)if(g.attributes.skinIndex.getX(i)===r.card.skeleton.bones.indexOf(r.legs[j].hip))thighIds[j].push(i);
}
const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(bodyIds.flatMap(i=>[g.attributes.position.getX(i),g.attributes.position.getY(i),g.attributes.position.getZ(i)]),3));
const material=new T.MeshBasicMaterial({side:T.DoubleSide}),mesh=new T.Mesh(geometry,material);mesh.updateMatrixWorld(true);
const ray=new T.Raycaster(),point=new T.Vector3(),origin=new T.Vector3(),up=new T.Vector3(0,1,0);
let sampledNoVertexInsideBody=0,first=null,worstGap=0;
try{
 for(let n=0;n<198;n++){
  const dx=n<78?0:.8/60,dz=n<78?-.8/60:0;r.g.position.x+=dx;r.g.position.z+=dz;updateChicken3D(r,dx,dz,1/60,'walk');r.g.updateMatrixWorld(true);
  if(n%3!==0)continue;
  for(let j=0;j<2;j++){
   let overlap=false,maxY=-Infinity;
   for(const i of thighIds[j]){
    r.card.getVertexPosition(i,point);maxY=Math.max(maxY,point.y);origin.set(point.x,-3,point.z);ray.set(origin,up);
    const hits=ray.intersectObject(mesh),ys=hits.map(h=>h.point.y);
    if(ys.length>=2&&point.y>Math.min(...ys)+1e-7&&point.y<Math.max(...ys)-1e-7){overlap=true;break;}
   }
   if(!overlap){sampledNoVertexInsideBody++;if(!first)first={frame:n,leg:j,hipLocalY:r.legs[j].hip.position.y+r.spec.bodyY,maxThighLocalY:maxY};}
   worstGap=Math.max(worstGap,.18-maxY);
  }
 }
 console.log(JSON.stringify({height:.72,hz:60,warmSeconds:1.3,side:'right',sampledNoVertexInsideBody,first,conclusiveVerticalGapMm:Math.max(0,worstGap)*r.model.scale.x*1000},null,2));
}finally{geometry.dispose();material.dispose();r.dispose();}

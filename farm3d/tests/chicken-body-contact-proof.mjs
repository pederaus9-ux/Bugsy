import * as T from '../lib/three.module.min.js';
import {createChicken3D,updateChicken3D} from '../chicken3d.js';
const sphere=new T.SphereGeometry(1,10,8),count=sphere.index.count;sphere.dispose();
let checked=0,minClearance=Infinity;
for(const h of [.35,.72])for(const hz of [30,60,120]){
 const r=createChicken3D(h),geo=new T.BufferGeometry(),a=new T.Float32BufferAttribute(new Float32Array(count*3),3);geo.setAttribute('position',a);
 const mat=new T.MeshBasicMaterial({side:T.DoubleSide}),mesh=new T.Mesh(geo,mat),ray=new T.Raycaster(),point=new T.Vector3(),up=new T.Vector3(0,1,0),down=new T.Vector3(0,-1,0);
 try{
  for(let n=0;n<hz*12;n++){
   const run=n%(hz*3)>hz*2,v=h===.72?(run?2.4:.8):h*(run?1.4:.65),angle=n/hz*.7+(n%(hz*3)>hz?Math.PI:0),dx=-Math.sin(angle)*v/hz,dz=-Math.cos(angle)*v/hz;
   r.g.position.x+=dx;r.g.position.z+=dz;updateChicken3D(r,dx,dz,1/hz,run?'run':'walk');r.g.updateMatrixWorld(true);
   if(n%4)continue;
   for(let i=0;i<count;i++){r.card.getVertexPosition(i,point).applyMatrix4(r.card.matrixWorld);a.setXYZ(i,point.x,point.y,point.z);}
   geo.computeBoundingSphere();geo.computeBoundingBox();mesh.updateMatrixWorld(true);
   for(let j=0;j<2;j++){
    const center=r.legs[j].hip.getWorldPosition(point);ray.set(center,up);const above=ray.intersectObject(mesh)[0];ray.set(center,down);const below=ray.intersectObject(mesh)[0];
    if(!above||!below)throw Error(`detached hip h${h} hz${hz} n${n} leg${j}`);
    minClearance=Math.min(minClearance,above.distance,below.distance);checked++;
   }
  }
 }finally{r.dispose();geo.dispose();mat.dispose();}
}
console.log(JSON.stringify({actualSkinnedBodyHipIntersections:checked,minimumBodyInteriorClearanceMm:minClearance*1000,secondsPerScenario:12,scenarios:6},null,2));

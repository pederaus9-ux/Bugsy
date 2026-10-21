import * as THREE from './lib/three.module.min.js';

// Follow the west side of the established chicken yard, then turn toward the
// dairy's south gate. A ground surface only: never move saved farm objects.
export function createDairyPath({layout,groundY,material}){
 const gate=(layout.gate[0]+layout.gate[1])/2,end=layout.polygon[2][1]-.08;
 const points=[[-1.4,8.1],[-18.4,8.1],[-18.4,-20.5],[gate,-25.5],[gate,end]],samples=[];
 const distance=(x,z)=>Math.min(...points.slice(1).map(([bx,bz],i)=>{
  const[ax,az]=points[i],dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
  return Math.hypot(x-ax-t*dx,z-az-t*dz);
 }));
 const group=new THREE.Group();group.name='dairy-stone-path';
 const stoneMat=material?material.clone():new THREE.MeshStandardMaterial({roughness:.95});
 stoneMat.color.set(0xb4b1a8);stoneMat.roughness=.98;
 const stoneGeo=new THREE.CylinderGeometry(.38,.4,.065,6),positions=[],indices=[];
 const stonesAt=[];
 let travelled=0;
 for(let segment=1;segment<points.length;segment++){
  const[ax,az]=points[segment-1],[bx,bz]=points[segment],dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,n=Math.ceil(len/.56);
  for(let i=0;i<=n;i++){
   const t=i/n,x=ax+dx*t,z=az+dz*t;
   samples.push([x,z]);
   for(let side=0;side<2;side++){
    const xx=x+nx*(side? .88:-.88),zz=z+nz*(side? .88:-.88);
    positions.push(xx,groundY(xx,zz)+.018,zz);
   }
   if(i<n)for(let row=0;row<3;row++){
    const along=(i+.5+(row===1?.13:0))/n,side=(row-1)*.56,xx=ax+dx*along+nx*side,zz=az+dz*along+nz*side;
    stonesAt.push([xx,zz,Math.atan2(dx,dz),travelled+i*.56+row]);
   }
   if(i<n){const v=(positions.length/3)-2;indices.push(v,v+1,v+2,v+1,v+3,v+2);}
  }
  travelled+=len;
 }
 const bedGeo=new THREE.BufferGeometry();bedGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));bedGeo.setIndex(indices);bedGeo.computeVertexNormals();
 // The bed is already above the terrain. A negative polygon offset can pull it
 // in front of the raised stones at the normal wide farm camera distance.
 const bedMat=new THREE.MeshStandardMaterial({color:0x827e71,roughness:1});
 const bed=new THREE.Mesh(bedGeo,bedMat);bed.receiveShadow=true;group.add(bed);
 const stones=new THREE.InstancedMesh(stoneGeo,stoneMat,stonesAt.length),matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),colour=new THREE.Color();
 for(let i=0;i<stonesAt.length;i++){
  const[x,z,yaw,seed]=stonesAt[i],jitter=Math.sin(seed*19.91);
  rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),yaw+jitter*.17);
  matrix.compose(new THREE.Vector3(x,groundY(x,z)+.052,z),rotation,scale.set(.94+jitter*.04,1,.86+Math.cos(seed*17.3)*.04));stones.setMatrixAt(i,matrix);
  colour.setHSL(.105+Math.sin(seed)*.013,.035,.68+jitter*.1);stones.setColorAt(i,colour);
 }
 stones.receiveShadow=true;group.add(stones);
 let disposed=false;
 return{group,points,samples,stones,contains:(x,z,pad=0)=>distance(x,z)<.92+pad,
  dispose(){if(disposed)return;disposed=true;stoneGeo.dispose();stoneMat.dispose();bedGeo.dispose();bedMat.dispose();}};
}

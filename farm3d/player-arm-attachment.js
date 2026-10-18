// Complete the first-person silhouette without changing native hand clips/gait.
// The exported model stops at each elbow; its upper sleeve joins that current
// elbow to a body-relative shoulder behind the eye, independent of look pitch.
export function installArmAttachment({THREE:T,camera,fallback,getContext}) {
  const root=new T.Group();root.name='First-person upper sleeves';root.visible=false;
  const radius=.047,geometry=new T.CapsuleGeometry(radius,1,3,10),height=1+radius*2;
  const fallbackGeometry=[null,null],ringRadii=[.047,.046,.044,.042,.039,.0365,.0358,.0358,.0355,.035,.034+.014/24-.0002],collarOffsets=[-.006,0,.006,.014];
  const sleeves=[-1,1].map(side=>{const mesh=new T.Mesh(geometry,fallback.userData.sleeve);mesh.name=(side<0?'L':'R')+'_upperSleeve';mesh.renderOrder=10;mesh.frustumCulled=false;root.add(mesh);return mesh;});
  camera.add(root);
  const shoulder=new T.Vector3(),elbow=new T.Vector3(),direction=new T.Vector3(),axis=new T.Vector3(0,1,0),yaw=new T.Quaternion(),up=new T.Vector3(0,1,0),inverse=new T.Matrix4();
  const legacyY=.039+.12*Math.cos(Math.PI/2+.32),legacyZ=.15+.12*Math.sin(Math.PI/2+.32);
  const forward=new T.Vector3(),radialA=new T.Vector3(),radialB=new T.Vector3(),neck=new T.Vector3(),control1=new T.Vector3(),control2=new T.Vector3(),center=new T.Vector3(),tangent=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),normal=new T.Vector3(),turn=new T.Quaternion();
  let disposed=false;
  function makeFallbackGeometry(){
    const g=new T.BufferGeometry(),indices=[];g.setAttribute('position',new T.Float32BufferAttribute((ringRadii.length*12+1)*3,3));
    for(let j=0;j<ringRadii.length-1;j++)for(let k=0;k<12;k++){const x=j*12+k,y=(j+1)*12+k,z=j*12+(k+1)%12,w=(j+1)*12+(k+1)%12;indices.push(x,y,z,y,w,z);}
    const capIndex=ringRadii.length*12;for(let k=0;k<12;k++)indices.push(capIndex,(k+1)%12,k);
    g.setIndex(indices);return g;
  }
  function shapeFallback(mesh,joint){
    // The narrow elbow collar follows the native forearm axis. A curved,
    // tapered upper sleeve meets it tangentially, with its far lip buried
    // inside the unchanged native forearm instead of a wide capsule bulb.
    forward.set(0,-Math.cos(Math.PI/2+.32),-Math.sin(Math.PI/2+.32)).transformDirection(joint.matrixWorld).transformDirection(inverse);
    radialA.set(1,0,0).transformDirection(joint.matrixWorld).transformDirection(inverse);radialB.crossVectors(forward,radialA).normalize();
    neck.copy(elbow).addScaledVector(forward,-.018);direction.subVectors(elbow,shoulder);const span=direction.length();direction.normalize();
    control1.copy(shoulder).addScaledVector(direction,span*.45);control2.copy(neck).addScaledVector(forward,-.035);
    const g=mesh.geometry,p=g.attributes.position;
    for(let j=0;j<ringRadii.length;j++){
      if(j<7){const t=j/6,u=1-t;center.copy(shoulder).multiplyScalar(u*u*u).addScaledVector(control1,3*u*u*t).addScaledVector(control2,3*u*t*t).addScaledVector(neck,t*t*t);tangent.subVectors(control1,shoulder).multiplyScalar(3*u*u).addScaledVector(a.subVectors(control2,control1),6*u*t).addScaledVector(b.subVectors(neck,control2),3*t*t).normalize();}
      else{center.copy(elbow).addScaledVector(forward,collarOffsets[j-7]);tangent.copy(forward);}
      turn.setFromUnitVectors(forward,tangent);a.copy(radialA).applyQuaternion(turn);b.copy(radialB).applyQuaternion(turn);
      for(let k=0;k<12;k++){const theta=k*Math.PI/6;normal.copy(center).addScaledVector(a,Math.sin(theta)*ringRadii[j]).addScaledVector(b,Math.cos(theta)*ringRadii[j]);p.setXYZ(j*12+k,normal.x,normal.y,normal.z);}
    }
    p.setXYZ(ringRadii.length*12,shoulder.x,shoulder.y,shoulder.z);p.needsUpdate=true;g.computeVertexNormals();
    // Match the actual tapered native cylinder's side normal at the hidden lip.
    for(let j=9;j<11;j++)for(let k=0;k<12;k++){const theta=k*Math.PI/6;normal.copy(radialA).multiplyScalar(Math.sin(theta)).addScaledVector(radialB,Math.cos(theta)).addScaledVector(forward,-.01/.24).normalize();g.attributes.normal.setXYZ(j*12+k,normal.x,normal.y,normal.z);}
    g.attributes.normal.needsUpdate=true;
  }
  function update(){
    if(disposed)return;
    const ctx=getContext(),walk=ctx.walk,auth=camera.getObjectByName('Authored first-person hands'),authored=!!auth?.visible;
    root.visible=!!walk&&(authored||fallback.visible);if(!root.visible)return;
    camera.updateWorldMatrix(true,false);inverse.copy(camera.matrixWorld).invert();yaw.setFromAxisAngle(up,walk.yaw);
    for(let i=0;i<2;i++){
      const side=i?1:-1,mesh=sleeves[i],joint=authored?auth.getObjectByName((i?'R':'L')+'_arm'):fallback.children[i];
      mesh.visible=!!joint;if(!joint)continue;
      // The shoulders stay on the body when the camera looks down/up. Their
      // proximal ends extend past the side/near plane rather than capping in view.
      shoulder.set(side*.30,1.43,.10).applyQuaternion(yaw);shoulder.y+=ctx.ground||0;shoulder.x+=walk.pos.x;shoulder.z+=walk.pos.y;
      if(authored)joint.getWorldPosition(elbow);
      else {joint.updateWorldMatrix(true,false);elbow.set(0,legacyY,legacyZ).applyMatrix4(joint.matrixWorld);}
      shoulder.applyMatrix4(inverse);elbow.applyMatrix4(inverse);
      mesh.material=fallback.userData.sleeve;
      if(!authored){mesh.geometry=fallbackGeometry[i]||(fallbackGeometry[i]=makeFallbackGeometry());mesh.position.set(0,0,0);mesh.quaternion.identity();mesh.scale.set(1,1,1);shapeFallback(mesh,joint);continue;}
      mesh.geometry=geometry;direction.subVectors(shoulder,elbow);const length=direction.length();
      mesh.position.copy(shoulder).add(elbow).multiplyScalar(.5);
      mesh.quaternion.setFromUnitVectors(axis,direction.multiplyScalar(1/Math.max(length,1e-9)));
      mesh.scale.set(1,length/height,1);mesh.material=fallback.userData.sleeve;
    }
  }
  return {update,dispose(){if(disposed)return;disposed=true;root.removeFromParent();geometry.dispose();fallbackGeometry.forEach(g=>g?.dispose());}};
}

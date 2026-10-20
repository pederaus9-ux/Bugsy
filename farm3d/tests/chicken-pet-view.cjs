// Browser-test setup only. Select a camera view with a real, unobstructed
// native bird hit; never move birds, hide the coop or change hit priority.
function planChickenPetView() {
  const d=__dbg,camera=d.camera,position=camera.position.clone(),quaternion=camera.quaternion.clone(),views=[];
  const inspect=(yaw,label)=>{
    const birds=d.animals.filter(a=>a.kind==='chicken').map(a=>{
      const v=a.g.position.clone().setY(a.S.h*.5).project(camera),x=(v.x+1)*innerWidth/2,y=(1-v.y)*innerHeight/2,h=d.hitAt(x,y);
      const inMargins=x>120&&x<innerWidth-180&&y>70&&y<innerHeight-120;
      const nativeHit=h?.type==='animal'&&h.an===a,canvas=document.elementFromPoint(x,y)===d.renderer.domElement;
      return {i:a.ref.i,position:a.g.position.toArray(),x,y,inMargins,nativeHit,canvas,hit:h&&{type:h.type,station:h.station,i:h.an?.ref.i},eligible:inMargins&&nativeHit&&canvas};
    });
    views.push({yaw,label,camera:camera.position.toArray(),birds});return birds.some(b=>b.eligible);
  };
  try {
    if(inspect(2.6,'original rear overview'))return {yaw:2.6,views};
    for(const yaw of [-.45,Math.PI/2,-Math.PI/2,0,Math.PI]){
      camera.position.set(-10.7+Math.sin(yaw)*Math.cos(.65)*19,1+Math.sin(.65)*19,Math.cos(yaw)*Math.cos(.65)*19);
      camera.lookAt(position.clone().set(-10.7,1,0));camera.updateMatrixWorld(true);
      if(inspect(yaw,'candidate unobstructed overview'))return {yaw,views};
    }
    return {yaw:null,views};
  } finally {
    camera.position.copy(position);camera.quaternion.copy(quaternion);camera.updateMatrixWorld(true);
  }
}
module.exports={planChickenPetView};

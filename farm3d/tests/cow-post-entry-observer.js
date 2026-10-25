// Read-only test observer. It never changes actor state or advances animation.
(async()=>{
 const d=__dbg,THREE=await import('./lib/three.module.min.js'),rings=new Map();
 window.__postDiagnosis={post:d.cowYard.layout.obstacles[4],events:[]};
 const snap=a=>({clock:d.clock(),pos:a.g.position.toArray(),act:a.act,speed:a.lastSpd,yaw:a.rig3d.model.rotation.y,task:a.cowTask?{kind:a.cowTask.kind,stage:a.cowTask.stage,station:a.cowTask.station.id,path:a.cowTask.path?.map(p=>[p.x,p.y]),waypoints:a.cowTask.waypoints,avoidSide:a.cowTask.avoidSide,detourFor:a.cowTask.detourFor}:null,target:a.target?.toArray(),ordinaryPath:a.path?.map(p=>p.toArray())});
 for(const a of d.animals.filter(a=>a.kind==='cow'&&[3,4].includes(a.ref.i))){const update=a.update; a.update=function(dt,t){
  const before=snap(a),post=d.cowYard.layout.obstacles[4],[x,z,hw,hd]=post,inside=(p,pad)=>Math.abs(p[0]-x)<hw+pad&&Math.abs(p[2]-z)<hd+pad;
  const ring=rings.get(a.ref.i)||[];ring.push(before);if(ring.length>12)ring.shift();rings.set(a.ref.i,ring);
  update.call(a,dt,t);const after=snap(a);
  if((!inside(before.pos,.42)&&inside(after.pos,.42))||(!inside(before.pos,.4)&&inside(after.pos,.4))){
   const card=a.rig3d.card;a.g.updateMatrixWorld(true);card.skeleton.update();const v=new THREE.Vector3();let verticesInside=0,minSurfaceDistance=Infinity;
   const points=[];for(let i=0;i<card.geometry.attributes.position.count;i++){card.getVertexPosition(i,v);v.applyMatrix4(card.matrixWorld);if(v.y<.08||v.y>2.78)continue;const dx=Math.max(0,Math.abs(v.x-x)-hw),dz=Math.max(0,Math.abs(v.z-z)-hd);minSurfaceDistance=Math.min(minSurfaceDistance,Math.hypot(dx,dz));if(dx===0&&dz===0){verticesInside++;if(points.length<12)points.push({vertex:i,world:v.toArray()});}}
   window.__postDiagnosis.events.push({id:a.ref.i,dt,post,before,after,ring:[...ring],insidePoint4:inside(after.pos,.4),verticesInside,points,minSurfaceDistance,installedBlock:d.BLOCKS.find(b=>b.every((n,i)=>Math.abs(n-post[i])<1e-8))});
   if(inside(after.pos,.4))throw Error('Diagnostic first 0.4m padded post entry by cow '+a.ref.i);
  }
 };}
})();

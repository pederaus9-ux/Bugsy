// First-person hand posture and gait from owner-accepted6dc0a17d.
export function installPlayerMotion({THREE:T,G,camera,fallback,getContext}) {
  const state={enabled:true,amount:0,rest:1,run:0,lastT:null,mode:'hidden',phase:0,action:null};const empty=[];
  let base=empty,root=null,rootIndex=-1,authCache=null,fallbackCache=null,activeCache=null,nextMode='hidden',disposed=false;
  const axis=new T.Vector3(1,0,0),axisY=new T.Vector3(0,1,0),q=new T.Quaternion(),e=new T.Euler(),yawQ=new T.Quaternion(),parentQ=new T.Quaternion(),worldQ=new T.Quaternion(),targetPosition=new T.Vector3(),offset=new T.Vector3(),identity=new T.Quaternion(),worldInverse=new T.Matrix4(),worldPosition=new T.Vector3(),worldScale=new T.Vector3(),fingerBends=[-.10,-.18,-.10];
  const clearActive=()=>{base=empty;activeCache=null;};
  const snapshots=nodes=>nodes.map(n=>({n,p:n.position.clone(),q:n.quaternion.clone()}));
  function hierarchy(node){const records=[];node.traverse(n=>records.push({n,parent:n.parent,name:n.name,bone:n.isBone,children:n.children.slice()}));return records;}
  function valid(cache){for(const r of cache.hierarchy){if(r.n.parent!==r.parent||r.n.name!==r.name||r.n.isBone!==r.bone||r.n.children.length!==r.children.length)return false;for(let i=0;i<r.children.length;i++)if(r.n.children[i]!==r.children[i])return false;}if(cache.fingers)for(let i=0;i<cache.fingers.length;i++){const r=cache.fingers[i];if(r.hand.userData.fingers!==r.finger||r.finger?.parent!==r.parent)return false;}return true;}
  function authoredCache(node){const records=hierarchy(node),limbs=[];for(const name of ['L','R']){const fingers=[];for(let finger=0;finger<4;finger++)for(let joint=0;joint<3;joint++)fingers.push(node.getObjectByName(name+'_finger'+finger+'_'+joint));limbs.push({arm:node.getObjectByName(name+'_arm'),wrist:node.getObjectByName(name+'_wrist'),fingers});}return{root:node,hierarchy:records,limbs,snapshots:snapshots(records.filter(r=>r.bone&&/^(L|R)_(arm|wrist|finger)/.test(r.name)).map(r=>r.n))};}
  function legacyCache(){const fingers=fallback.children.map(hand=>({hand,finger:hand.userData.fingers,parent:hand.userData.fingers?.parent}));return{root:fallback,hierarchy:hierarchy(fallback),fingers,snapshots:snapshots(fallback.children.flatMap(h=>[h,...(h.userData.fingers?[h.userData.fingers.parent,h.userData.fingers]:[])]))};}
  function sync(){if(disposed){nextMode='hidden';return null;}const auth=root?.parent===camera&&root.name==='Authored first-person hands'&&camera.children[rootIndex]===root?root:camera.getObjectByName('Authored first-person hands');root=auth||null;rootIndex=root?camera.children.indexOf(root):-1;
    if(authCache&&(authCache.root!==root||!valid(authCache))){if(activeCache===authCache)clearActive();authCache=null;}
    if(fallbackCache&&!valid(fallbackCache)){if(activeCache===fallbackCache)clearActive();fallbackCache=null;}
    nextMode=root?.visible?'authored':fallback.visible?'fallback':'hidden';
    if(nextMode==='authored'){if(!authCache)authCache=authoredCache(root);return authCache;}
    if(nextMode==='fallback'){if(!fallbackCache)fallbackCache=legacyCache();return fallbackCache;}return null;
  }
  const restore=()=>{if(sync()!==activeCache){clearActive();return;}for(const b of base){b.n.position.copy(b.p);b.n.quaternion.copy(b.q);}};
  function apply(){
    if(!state.enabled||state.mode==='hidden'||!activeCache)return;
    // Ancestors stay unchanged during this synchronous two-limb apply. Refresh
    // once and reuse its inverse/orientation; never cache across native frames.
    const ctx=getContext(),w=ctx.walk;if(!w)return;const reduced=ctx.reducedMotion,amount=reduced?0:state.amount,amp=(.32+.18*state.run)*amount;
    yawQ.setFromAxisAngle(axisY,w.yaw);const floor=ctx.ground||0;
    if(state.mode==='authored'){
      // Inspected GLB: elbow->wrist is +localY. -90deg points forward;
      // near -180deg points down. Mount at native avatar elbow height1.17m,
      // beside its torso, and counter camera pitch instead of raising arms
      // merely to keep them in the first-person viewport.
      root.updateWorldMatrix(true,false);if(reduced)parentQ.setFromAxisAngle(axis,w.pitch).premultiply(yawQ).invert();else{root.matrixWorld.decompose(worldPosition,parentQ,worldScale);parentQ.invert();}worldInverse.copy(root.matrixWorld).invert();
      for(let i=0;i<2;i++){const side=i?1:-1,{arm,wrist,fingers}=activeCache.limbs[i],swing=Math.sin((state.phase+i*.5)*Math.PI*2);
        const upper=-swing*amp,bend=.18+.16*state.run*amount;
        targetPosition.set(side*.285,1.43-.26*Math.cos(upper),-.26*Math.sin(upper)).applyQuaternion(yawQ).add(offset.set(w.pos.x,floor,w.pos.y));targetPosition.applyMatrix4(worldInverse);arm.position.lerp(targetPosition,state.rest);
        worldQ.setFromEuler(e.set(-Math.PI+upper+bend,0,side*.035)).premultiply(yawQ);q.copy(parentQ).multiply(worldQ);arm.quaternion.slerp(q,state.rest);
        q.setFromEuler(e.set(.02,side*1.4,0));wrist.quaternion.slerp(q,state.rest);
        for(let finger=0;finger<4;finger++)for(let joint=0;joint<3;joint++){const bone=fingers[finger*3+joint];if(bone){q.setFromAxisAngle(axis,fingerBends[joint]);bone.quaternion.multiply(q.slerp(identity,1-state.rest));}}
      }
    }else{
      // Procedural fallback uses a different axis: sleeve extends +localZ
      // from the hand pivot toward the elbow. Rotate that axis upward.
      fallback.updateWorldMatrix(true,false);if(reduced)parentQ.setFromAxisAngle(axis,w.pitch).premultiply(yawQ).invert();else{fallback.matrixWorld.decompose(worldPosition,parentQ,worldScale);parentQ.invert();}worldInverse.copy(fallback.matrixWorld).invert();
      for(let i=0;i<fallback.children.length;i++){const h=fallback.children[i],side=i?1:-1,swing=Math.sin((state.phase+i*.5)*Math.PI*2),upper=-swing*amp,bend=.18+.16*state.run*amount,a=upper+bend;
        targetPosition.set(side*.285,1.43-.26*Math.cos(upper)-.23*Math.cos(a),-.26*Math.sin(upper)-.23*Math.sin(a)).applyQuaternion(yawQ).add(offset.set(w.pos.x,floor,w.pos.y));targetPosition.applyMatrix4(worldInverse);h.position.lerp(targetPosition,state.rest);
        worldQ.setFromEuler(e.set(-Math.PI/2+a,0,side*.035)).premultiply(yawQ);q.copy(parentQ).multiply(worldQ);h.quaternion.slerp(q,state.rest);if(h.userData.fingers){h.userData.fingers.parent.rotation.x=T.MathUtils.lerp(1.05,.35,state.rest);h.userData.fingers.rotation.x-=.10*state.rest;}
      }
    }
  }
  function update(dt,t){
    // Native hands evaluate absolute clips immediately before this overlay.
    // Repeated held-frame calls restore the same native pose, avoiding drift.
    if(disposed)return;const cache=sync(),sameTime=t===state.lastT;
    if(sameTime&&cache===activeCache&&state.mode===nextMode){restore();apply();return;}state.lastT=t;
    const ctx=getContext();state.mode=nextMode;state.action=ctx.punch?.authoredKind||ctx.punch?.kind||null;
    const w=ctx.walk,k=1-Math.exp(-Math.min(.1,Math.max(0,dt))*16),target=w?T.MathUtils.clamp((w.gspd||0)/2.6,0,1):0;
    if(!sameTime){state.amount+=(target-state.amount)*k;state.run+=((w?.grun||0)-state.run)*k;const restTarget=state.action?0:1;state.rest+=(restTarget-state.rest)*(1-Math.exp(-Math.min(.1,Math.max(0,dt))*28));if(Math.abs(state.rest-restTarget)<1e-6)state.rest=restTarget;}state.phase=w?.gait||0;
    if(!cache){clearActive();return;}if(state.mode==='fallback')for(const h of fallback.children)if(h.userData.fingers)h.userData.fingers.parent.rotation.x=1.05;
    activeCache=cache;base=cache.snapshots;for(const b of base){b.p.copy(b.n.position);b.q.copy(b.n.quaternion);}apply();
  }
  return{update,state,setEnabled(on){if(disposed)return;restore();state.enabled=!!on;apply();},restoreNative:restore,dispose(){if(disposed)return;restore();disposed=true;state.enabled=false;state.mode='hidden';clearActive();authCache=null;fallbackCache=null;root=null;rootIndex=-1;}};
}

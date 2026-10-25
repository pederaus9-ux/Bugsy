// Test-only A15 oracle. Use the installed bed dock and physical margin, not task labels alone.
(function(root){
  function createAnimalPenWakeOracle(beds,{deadlineFrames=15000,wakeFrames=1200,rateHz=30}={}){
    if(!Array.isArray(beds)||beds.length!==46)throw Error('Expected all 46 overnight beds');
    if(!Number.isFinite(rateHz)||rateHz<=0)throw Error('Invalid wake sample rate');
    const stuckFrames=Math.ceil(rateHz*2.5),minimumActualMotion=.01*2.5;
    const state=new Map();
    for(const bed of beds){
      if(!bed||typeof bed.key!=='string'||state.has(bed.key)||!Array.isArray(bed.dock)||!Number.isFinite(bed.radius)||bed.radius<=0)throw Error('Invalid or duplicate overnight bed identity: '+bed?.key);
      state.set(bed.key,{bed,firstFrame:null,completeFrame:null,coreAnchor:null,coreAnchorFrame:null});
    }
    let lastFrame=0;
    const outside=(s,pos)=>Array.isArray(pos)&&Number.isFinite(pos[0])&&Number.isFinite(pos[2])&&
      Math.hypot(pos[0]-s.bed.dock[0],pos[2]-s.bed.dock[2])>s.bed.radius;
    function observe(frame,samples){
      if(!Number.isInteger(frame)||frame!==lastFrame+1)throw Error('Wake trace skipped a simulated frame');
      if(!Array.isArray(samples)||samples.length!==state.size)throw Error('Wake trace lost an animal');
      const seen=new Set();
      for(const sample of samples){
        const key=sample?.key,s=state.get(key);
        if(!s||seen.has(key))throw Error('Wake trace has a missing, changed or duplicate identity');
        seen.add(key);
        const offBed=outside(s,sample.pos),bedTask=sample.taskKind==='bed';
        if(!Array.isArray(sample.pos)||!sample.pos.every(Number.isFinite)||typeof sample.act!=='string'||!Number.isFinite(sample.speed))throw Error('Wake trace has invalid physical state');
        const resting=sample.act==='sleeping'||sample.act==='resting';
        if(s.firstFrame===null){
          if(offBed&&!bedTask&&!resting)s.firstFrame=frame;
          else if(frame>=deadlineFrames)throw Error('Animal did not physically leave overnight bed by 500 seconds: '+key);
        }else if(s.completeFrame===null){
          if(bedTask||resting)throw Error('Animal resumed resting before 40 continuous awake seconds: '+key+' frame='+frame+' first='+s.firstFrame+' task='+sample.taskKind+' act='+sample.act);
          // Ordinary 3D cows do not publish lastSpd. Beast.update's 0.4 m
          // criterion is a route-replan heuristic, not proof of immobility.
          // Require actual motion at its .01 m/s moving threshold across the
          // same 2.5 s observation window; legitimate slow bed crossings pass.
          const awakeCare=sample.act==='eating'&&['feed','drink'].includes(sample.taskKind);
          if(offBed||awakeCare){s.coreAnchor=null;s.coreAnchorFrame=null;}
          else if(s.coreAnchor===null){s.coreAnchor=sample.pos.slice();s.coreAnchorFrame=frame;}
          else if(Math.hypot(sample.pos[0]-s.coreAnchor[0],sample.pos[2]-s.coreAnchor[2])>=minimumActualMotion){s.coreAnchor=sample.pos.slice();s.coreAnchorFrame=frame;}
          else if(frame-s.coreAnchorFrame>=stuckFrames)throw Error('Animal remained physically stuck in its old sleeping core before 40 continuous awake seconds: '+key+' frame='+frame+' first='+s.firstFrame+' act='+sample.act+' pos='+sample.pos.join(','));
          if(frame-s.firstFrame>=wakeFrames)s.completeFrame=frame;
        }
      }
      if(seen.size!==state.size)throw Error('Wake trace lost an identity');
      lastFrame=frame;
      return [...state.values()].every(s=>s.completeFrame!==null);
    }
    function snapshot(){return{frames:lastFrame,animals:state.size,firstReleased:[...state.values()].filter(s=>s.firstFrame!==null).length,fullWakes:[...state.values()].filter(s=>s.completeFrame!==null).length,maxFirstFrame:Math.max(...[...state.values()].map(s=>s.firstFrame??0)),minWakeFrames:Math.min(...[...state.values()].filter(s=>s.completeFrame!==null).map(s=>s.completeFrame-s.firstFrame)),first:Object.fromEntries([...state].map(([k,s])=>[k,s.firstFrame])),complete:Object.fromEntries([...state].map(([k,s])=>[k,s.completeFrame]))};}
    return{observe,snapshot};
  }
  root.createAnimalPenWakeOracle=createAnimalPenWakeOracle;
  if(typeof module==='object'&&module.exports)module.exports={createAnimalPenWakeOracle};
})(globalThis);

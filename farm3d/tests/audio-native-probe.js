// Test-only observation of real browser AudioContext/nodes. Native constructors,
// method arguments, graph-to-destination connections and resume promises remain.
// A parallel analyser observes the game's master output; it does not replace it.
(() => {
  const Native=window.AudioContext;
  const probe=window.__audioProbe={contexts:[],events:[],lifecycle:[],gestures:[]};
  let sequence=0;
  document.addEventListener('visibilitychange',e=>probe.lifecycle.push({event:'visibilitychange',trusted:e.isTrusted,hidden:document.hidden,state:document.visibilityState,time:performance.now()}));
  document.addEventListener('freeze',e=>probe.lifecycle.push({event:'freeze',trusted:e.isTrusted,hidden:document.hidden,time:performance.now()}));
  document.addEventListener('resume',e=>probe.lifecycle.push({event:'resume',trusted:e.isTrusted,hidden:document.hidden,time:performance.now()}));
  document.addEventListener('pointerdown',e=>probe.gestures.push({trusted:e.isTrusted,active:navigator.userActivation.isActive,time:performance.now()}),true);
  if(!Native){probe.unavailable='AudioContext missing';return;}
  window.AudioContext=new Proxy(Native,{construct(target,args){
    const context=Reflect.construct(target,args),record={context,nodes:[],edges:[],id:probe.contexts.length,analyser:null};probe.contexts.push(record);
    const ids=new WeakMap();ids.set(context.destination,'destination');
    context.addEventListener('statechange',()=>probe.events.push({event:'statechange',context:record.id,state:context.state,time:performance.now(),audioTime:context.currentTime}));
    const resume=context.resume.bind(context);context.resume=function(...args){probe.events.push({event:'resume-call',context:record.id,activation:navigator.userActivation.isActive,time:performance.now()});return resume(...args);};
    for(const [method,type]of [['createGain','gain'],['createOscillator','oscillator'],['createBufferSource','buffer'],['createStereoPanner','panner'],['createBiquadFilter','filter']]){
      if(!context[method])continue;const original=context[method].bind(context);
      context[method]=function(...args){
        const node=original(...args),id=type+'-'+(++sequence);ids.set(node,id);record.nodes.push({id,type,node});
        const connect=node.connect.bind(node);node.connect=function(destination,...rest){record.edges.push({from:id,to:ids.get(destination)||destination.constructor.name});return connect(destination,...rest);};
        if(node.start){const start=node.start.bind(node);node.start=function(...args){probe.events.push({event:'source-start',id,type,loop:!!node.loop,context:record.id,time:performance.now(),audioTime:context.currentTime,args});return start(...args);};}
        return node;
      };
    }
    return context;
  }});
  probe.tap=()=>{const r=probe.contexts[0];if(!r)throw Error('No native audio context');const master=r.nodes.filter(n=>n.type==='gain')[0];if(!master)throw Error('No game master gain');if(!r.analyser){r.analyser=r.context.createAnalyser();r.analyser.fftSize=2048;r.analyser.smoothingTimeConstant=0;master.node.connect(r.analyser);}return true;};
  probe.sample=()=>{
    const r=probe.contexts[0];if(!r?.analyser)return null;const data=new Float32Array(r.analyser.fftSize);r.analyser.getFloatTimeDomainData(data);let sum=0,max=0;
    for(const value of data){sum+=value*value;max=Math.max(max,Math.abs(value));}
    const gains=r.nodes.filter(n=>n.type==='gain');
    return {rms:Math.sqrt(sum/data.length),peak:max,state:r.context.state,audioTime:r.context.currentTime,sampleRate:r.context.sampleRate,masterGain:gains[0]?.node.gain.value,musicGain:gains[1]?.node.gain.value,hidden:document.hidden,visibility:document.visibilityState,activation:navigator.userActivation.hasBeenActive};
  };
  // sound-polish: three gains in creation order are master, music and farm-sounds buses
  probe.buses=()=>{const r=probe.contexts[0];if(!r)return null;const g=r.nodes.filter(n=>n.type==='gain');return {master:g[0]?.node.gain.value,music:g[1]?.node.gain.value,amb:g[2]?.node.gain.value};};
  probe.savedSound=()=>{const k=Object.keys(localStorage).find(k=>k.endsWith('-sound'));try{return k?JSON.parse(localStorage.getItem(k)):null;}catch(e){return null;}};
  probe.snapshot=()=>({contexts:probe.contexts.map(r=>({id:r.id,state:r.context.state,audioTime:r.context.currentTime,sampleRate:r.context.sampleRate,nodes:r.nodes.map(n=>({id:n.id,type:n.type,loop:!!n.node.loop,gain:n.type==='gain'?n.node.gain.value:undefined})),edges:r.edges})),events:probe.events,lifecycle:probe.lifecycle,gestures:probe.gestures,unavailable:probe.unavailable});
})();

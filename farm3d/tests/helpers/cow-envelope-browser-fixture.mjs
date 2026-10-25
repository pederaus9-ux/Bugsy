import * as T from '../../lib/three.module.min.js';
import {createCow3D,updateCow3D} from '../../cow3d.js';
import {createCowYard} from '../../cow-yard.js';
import {resolveAnimalPens} from '../../animal-pen-layout.js';
import {getAnimalCarePose} from '../../animal-care-poses.js';
import {copyCowRig} from './cow-pose-preview.mjs';
import {cacheCowCompound,cowSweptQuery} from './cow-hierarchical-sweep.mjs';

export async function installEnvelopeFixture(d,mode){
 const yard=createCowYard({layout:resolveAnimalPens().sites.cow}),v=yard.componentVolumes(),boxes=[...v.shelter.slice(2,15),...v.shelter.slice(20),...v.feedBunk.slice(0,3),...v.trough.slice(0,5),...v.robot],rootObstacles=v.shelter.slice(2,10).map(b=>[(b[0]+b[3])/2,(b[2]+b[5])/2,(b[3]-b[0])/2,(b[5]-b[2])/2]);
 const stations=['cow-feed-1','cow-feed-2','cow-drink','cow-robot'].map(id=>yard.stations.find(s=>s.id===id));stations.push({id:'free-cow',kind:'free',dock:[0,.08,-34.1],facing:-Math.PI});
 const records=stations.map((s,i)=>{const r=createCow3D(1.7,s.dock[0],s.dock[2],i);r.g.position.y=s.dock[1];r.model.rotation.y=s.facing+Math.PI;for(let j=0;j<60;j++)updateCow3D(r,0,0,1/30,j/30,'idle');const overlay=getAnimalCarePose('cow',r),isCare=['feed','drink'].includes(s.kind),obj=isCare?yard.targets.find(t=>t.kind===(s.kind==='feed'?'feed':'water')).object:null,center=obj&&new T.Box3().setFromObject(obj).getCenter(new T.Vector3()),target=isCare?[s.kind==='feed'?s.dock[0]:center.x,s.surface,s.kind==='feed'?center.z:s.dock[2]]:null;r.g.updateMatrixWorld(true);return{r,s,overlay,target,displayed:copyCowRig(r),rt:r.legs.map(l=>l.rt)};});
 let minimum=Infinity;for(let i=0;i<5;i++)for(let j=0;j<i;j++)minimum=Math.min(minimum,records[i].r.g.position.distanceTo(records[j].r.g.position));if(minimum<.85)throw Error('Overlapping cost fixture');
 const request=(c,frame)=>{const weight=n=>c.target?Math.min(1,Math.max(0,n)/33):0;return{dt:1/30,act:c.target?'eating':'idle',evaluatedRt:c.rt,...(c.target?{care:{mode:c.s.kind,weightFrom:weight(frame-1),weight:weight(frame),target:c.target}}:{})};};
 for(const a of d.animals.filter(a=>a.kind==='cow')){a.g.visible=false;a.update=()=>{};}
 for(const c of records)d.scene.add(c.r.g);
 const measure={mode,minimumSeparation:minimum,stationIds:stations.map(s=>s.id),solids:boxes.length,frames:[],warmup:[],hits:0,misses:0,builds:[],reasons:{},overlapWitnesses:{},errors:[],maxContact:0,cacheBuildMs:0};
 let cache=null,fast=null;if(mode!=='baseline'){const start=performance.now();cache=cacheCowCompound(records[0].r);measure.cacheBuildMs=performance.now()-start;if(mode==='candidate')fast=await import('./cow-envelope-fast-path.mjs');}
 let frame=0,start=0,last=null,gpu=null;const gl=d.renderer.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
 const ctx={layoutRevision:0,supportRevision:0,support:{kind:'plane',height:.08}};
 window.__envelopeProbe={done:false,measure,
  beginFrame(){start=performance.now();},
  step(){if(this.done)return;const qstart=performance.now();frame++;try{for(const c of records){d.scene.remove(c.r.g);c.overlay.reset();const q=request(c,frame);if(mode!=='baseline'){let result;if(fast){result=fast.envelopeQuery(c.r,cache,q,boxes,{rootObstacles,displayedStart:c.displayed,context:ctx,requests:Array.from({length:8},(_,i)=>request(c,frame+i))});if(result.firstOverlap&&!measure.overlapWitnesses[c.s.id])measure.overlapWitnesses[c.s.id]=result.firstOverlap;measure.reasons[result.fastReason]=(measure.reasons[result.fastReason]||0)+1;measure.hits+=result.fastHit?1:0;measure.misses+=result.fastHit?0:1;if(result.buildMs!==undefined)measure.builds.push(result.buildMs);}else result=cowSweptQuery(c.r,cache,q,boxes,{rootObstacles,displayedStart:c.displayed});if(!result.clear)throw Error(JSON.stringify({frame,station:c.s.id,result}));}const rt=c.r.legs.map(l=>l.rt);updateCow3D(c.r,0,0,q.dt,frame/30,q.act);c.rt=rt;if(q.care)c.overlay.apply({...q.care,target:new T.Vector3(...q.care.target)});c.r.g.updateMatrixWorld(true);if(q.care?.weight===1){const distance=c.r.jaw.localToWorld(new T.Vector3(0,-.05,-.33)).distanceTo(new T.Vector3(...c.target));measure.maxContact=Math.max(measure.maxContact,distance);if(distance>.08)throw Error('Mouth contact exceeded .08');}c.displayed.dispose();c.displayed=copyCowRig(c.r);d.scene.add(c.r.g);}}catch(e){measure.errors.push(String(e.stack||e));this.done=true;}this.queryMs=performance.now()-qstart;},
  gpuBegin(){if(!ext)return;if(gpu&&gl.getQueryParameter(gpu,gl.QUERY_RESULT_AVAILABLE)){if(!gl.getParameter(ext.GPU_DISJOINT_EXT))this.gpuMs=gl.getQueryParameter(gpu,gl.QUERY_RESULT)/1e6;gl.deleteQuery(gpu);gpu=null;}if(!gpu){gpu=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,gpu);this.gpuActive=true;}},
  gpuEnd(){if(this.gpuActive){gl.endQuery(ext.TIME_ELAPSED_EXT);this.gpuActive=false;}},
  endFrame(){if(this.done)return;const now=performance.now(),sample={frame,cpu:now-start,interval:last===null?null:now-last,query:this.queryMs,gpu:this.gpuMs??null,heap:performance.memory?.usedJSHeapSize??null};last=now;if(!this.allocationOnly)(frame<=30?measure.warmup:measure.frames).push(sample);if(frame>=(this.allocationOnly?180:150))this.done=true;},
  startAllocations(){this.allocationOnly=true;this.done=false;},
  dispose(){for(const c of records){d.scene.remove(c.r.g);c.displayed.dispose();c.r.dispose();}yard.dispose();}
 };
 return{mode,minimum,animals:d.animals.length,activeCowControllers:0,scriptedNativeCows:5,quality:window.__quality?.(),renderer:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL??gl.RENDERER)};
}

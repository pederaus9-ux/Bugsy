// Horse locomotion feasibility: actual skinned hoof soles and bone transforms
// against hoof-track targets, across the scenario matrix (idle, walk, trot,
// canter, acceleration, deceleration, hard stops, 90-degree turns, tight
// circles, 180-degree reversals, gait chains, teleport) at 30/60/120 Hz with
// four warm-up phases. Invariants:
//   I1 reach: actual foot within 2 mm of its target every frame, and every
//      swing's remaining path inside its forecast hip's reach at every frame
//      it will be drawn (the planner's postcondition count is zero)
//   I2 anchors: planted slip <= 2 mm
//   I3 support: walk/idle >= 2 stance hooves, idle recovery >= 3; while the
//      caller walks or idles at least one hoof is down whatever gait is drawn
//      (hooves airborne when a run ends excepted until they land); airborne
//      time judged frame by frame against the effective gait (trot 0.10 s,
//      canter 0.15 s; hooves airborne at a gait change keep the previous
//      gait's rule and land within 0.45 s); zero emergency lifts
//   I4 torso: drop within [0, 0.09], back to rest after a stop
//   I5 swings <= 0.45 s; the existing per-frame continuity sentinel holds
//   I6 soles: planted rendered sole within 2 mm; after the root stops (in any
//      caller mode) every step completes, soles settle within 2 mm and the
//      torso is back at rest height within 2.5 s
// plus fixed hip roots, heading completion within each turn window, and the
// 90-degree turn response probe.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {scenarios,measure,roaming} from './horse-contact-scenarios.mjs';
import {createHorse3D,updateHorse3D} from '../horse3d.js';

function violations(m,sc){
  const f=[];
  if(m.worstTargetMM>2)f.push('I1 foot-target '+m.worstTargetMM.toFixed(2)+'mm '+JSON.stringify(m.worstTargetAt));
  if(m.unverified)f.push('I1 swing paths failing the reach postcondition '+m.unverified);
  if(m.worstSlipMM>2)f.push('I2 slip '+m.worstSlipMM.toFixed(2)+'mm');
  if(m.minStanceWalkIdle<2)f.push('I3 walk/idle support '+m.minStanceWalkIdle);
  if(m.minStanceIdle<3)f.push('I3 idle recovery support '+m.minStanceIdle);
  if(m.minStanceCallerWalk<1)f.push('I3 no hoof down while the caller walks '+JSON.stringify(m.callerWalkAt));
  if(m.worstAirborneExcess>1e-9)f.push('I3 airborne '+(m.worstAirborneExcess*1000).toFixed(1)+'ms over its gait allowance');
  if(m.longestTransitionS>.45+1e-9)f.push('I3 hand-over '+m.longestTransitionS.toFixed(3)+'s');
  if(m.emergency)f.push('I3 emergency lifts '+m.emergency);
  if(m.maxDrop>.09+1e-9)f.push('I4 drop '+m.maxDrop);
  if(m.restDrop!==null&&m.restDrop>1e-4)f.push('I4 rest drop '+m.restDrop);
  if(m.longestSwingS>.45+1e-9)f.push('I5 swing '+m.longestSwingS.toFixed(3)+'s');
  if(m.worstContinuityExcess>0)f.push('I5 continuity +'+(m.worstContinuityExcess*1000).toFixed(2)+'mm');
  if(m.worstPlantedSoleMM>2)f.push('I6 planted sole '+m.worstPlantedSoleMM.toFixed(2)+'mm');
  if(m.settledFloatMM!==null&&m.settledFloatMM>2)f.push('I6 settled float '+m.settledFloatMM.toFixed(2)+'mm');
  if(m.finalSwings)f.push('I6 '+m.finalSwings+' hooves still stepping at the end');
  if(m.hipDrift>1e-6)f.push('hip root drift '+m.hipDrift);
  if(m.headingErrorDeg>1)f.push('heading '+m.headingErrorDeg.toFixed(2)+'deg');
  if(sc.segs.some(s=>s.stop)&&(m.settleTimeS===null||m.settleTimeS>2.5))f.push('settle '+m.settleTimeS);
  return f;
}
const report=[];
for(const height of [2.3,1.6]){
  const list=scenarios();
  test('horse contact and support invariants hold, h '+height+', '+list.length+' scenarios x 30/60/120 Hz',()=>{
    const failures=[];
    for(const sc of list)for(const hz of [30,60,120]){
      const m=measure(sc,hz,height),f=violations(m,sc);
      report.push({...m,violations:f});
      if(f.length)failures.push(sc.name+' @'+hz+'Hz: '+f.join('; '));
    }
    assert.deepEqual(failures,[]);
  });
}
// Game-like roaming (the farm's eased steering, walk 1.2 / run 5 m/s,
// fence stops and reversals, jittered frame times): every invariant above.
// The pinned cases reproduce failures found in review and while fixing them:
// [seed, Hz, frame-jitter seed]; roaming(33,20) at 120 Hz with jitter seed 40
// is the integration review's 2.858 mm foot-target reproduction.
const pinned=[[33,120,40],[44,120,83],[17,120,56],[20,60,59],[44,60,83],[5,30,44],[21,30,60],[10,30,49],[20,30,59],[4,60,43],[23,120,62]];
// The integration review's own sweep: seeds 1-45, Hz [30,60,120][(seed-1)%3],
// jitter seed = seed+7.
const sessions=[...pinned,...Array.from({length:45},(_,i)=>[i+1,[30,60,120][i%3],i+8])];
test('game-like roaming holds every invariant, '+sessions.length+' sessions (review reproductions pinned)',()=>{
  const failures=[];
  for(const [seed,hz,jitterSeed] of sessions){
    const sc=roaming(seed,20),m=measure(sc,hz,2.3,.3,jitterSeed),f=violations(m,sc);
    report.push({...m,violations:f});
    if(f.length)failures.push(sc.name+' @'+hz+'Hz/'+jitterSeed+': '+f.join('; '));
  }
  assert.deepEqual(failures,[]);
});
// Randomised sequences that failed during development (fuzz cases 99, 14, 15,
// 47, 84, 109, 136: coasting stops under eased steering, idle requests while
// coasting, an instant canter-to-walk direction change), replayed exactly.
const pinnedFuzz=[{"sc":{"name":"fuzz#99s","segs":[{"t":2.1780936067458243,"vx":0.29639264943470495,"vz":0.0044054436961853665,"mode":"walk"},{"t":2.2217596078757196,"speed":4.861297745071352,"yawRate":-0.5286716937087477,"a0":4.952026771906304,"mode":"run"},{"t":1.7748667126987132,"vx":-3.0225640353517247,"vz":2.723542483037066,"mode":"run"},{"t":1.7803037029691042,"speed":0.5893701438209973,"yawRate":-0.29468507191049864,"a0":1.967575732786934,"mode":"walk"},{"t":1.7476818361319604,"mode":"idle","stop":true},{"t":1.4913361756596715,"speed":4.734278909675777,"yawRate":1.2525226722471416,"a0":2.62869502767638,"mode":"run"},{"t":2.5,"mode":"idle","stop":true}],"smooth":4},"hz":30,"h":2.3116975486278535,"jitter":0.3,"seed":598197751},{"sc":{"name":"fuzz#14s","segs":[{"t":2.41097100879997,"vx":0.9514816168730655,"vz":0.06696971984013844,"mode":"walk"},{"t":0.7412363565526903,"vx":-3.725178149372283,"vz":-0.2167875021054754,"mode":"run"},{"t":1.7782032027840615,"vx":-1.4109145991188272,"vz":-0.006000818791610182,"mode":"run"},{"t":1.2508010731078685,"from":1.1954425310326884,"to":2.951128829922527,"dir":[-0.9784413009604385,0.20652510882419303],"mode":"run"},{"t":2.405616654129699,"vx":0.8985628139918682,"vz":3.2387924835905766,"mode":"run"},{"t":2.373120150854811,"speed":3.6769022893160583,"yawRate":-0.7391645397990942,"a0":4.029553667244489,"mode":"run"},{"t":0.3967604806181043,"speed":2.7167007807642225,"yawRate":-0.827362883090973,"a0":2.007478630102774,"mode":"run"},{"t":2.457628667494282,"speed":5.154220920428634,"yawRate":1.12816700078547,"a0":6.0208274089543306,"mode":"run"},{"t":2.5,"mode":"idle","stop":true}],"smooth":4},"hz":120,"h":2.065297228191048,"jitter":0.3,"seed":104822677},{"sc":{"name":"fuzz#15s","segs":[{"t":1.6931344322860242,"speed":4.820500869024545,"yawRate":0.3818597718607634,"a0":1.7817287997447722,"mode":"run"},{"t":0.7236532766371966,"vx":1.945610504933869,"vz":0.3635674667642432,"mode":"run"},{"t":1.5417454381473363,"vx":2.5179827014897476,"vz":2.6967835871520838,"mode":"run"},{"t":1.2147259606048466,"vx":0.6030752730123029,"vz":-5.062053082550771,"mode":"run"},{"t":1.7900738119147719,"mode":"idle","stop":true},{"t":1.885141442390159,"from":4.0245126226463634,"to":4.55748803857714,"dir":[0.9928334880286195,-0.11950592056013393],"mode":"run"},{"t":2.5,"mode":"idle","stop":true}],"smooth":4},"hz":60,"h":1.6711889027152211,"jitter":0.3,"seed":944360027},{"sc":{"name":"fuzz#47s","segs":[{"t":1.9036771316081287,"vx":1.3012679662652207,"vz":-5.028021926205246,"mode":"run"},{"t":0.825611122418195,"mode":"idle","stop":true},{"t":0.9135647172573955,"mode":"idle","stop":true},{"t":1.8895302606746556,"vx":-1.8173195507024218,"vz":2.0679332365892433,"mode":"run"},{"t":0.938058167602867,"vx":-2.0239671177753,"vz":-2.189347314308048,"mode":"run"},{"t":1.1405888177454473,"vx":-2.2387048565699272,"vz":-2.8732184744848595,"mode":"run"},{"t":2.5,"mode":"idle","stop":true}],"smooth":4},"hz":60,"h":1.7364964067470283,"jitter":0.3,"seed":917508571},{"sc":{"name":"fuzz#84","segs":[{"t":1.842326516332105,"speed":5.1278944740071895,"yawRate":-0.3349149373359978,"a0":3.9813202312025595,"mode":"run"},{"t":0.5566191432997585,"speed":1.1425809801206923,"yawRate":-0.4831430287566036,"a0":5.613417227439251,"mode":"walk"},{"t":2.4209836763795467,"speed":0.5019393116701394,"yawRate":-0.2509696558350697,"a0":4.940418929490217,"mode":"walk"},{"t":2.0479609244968744,"vx":2.7447057643337103,"vz":-0.23083388974435606,"mode":"run"},{"t":2.3505934043321757,"from":2.8542825122401694,"to":4.6113911105319865,"dir":[-0.8929706585666797,-0.45011487749128043],"mode":"run"},{"t":2.5,"mode":"idle","stop":true}]},"hz":60,"h":2.2201546352822334,"jitter":0.3,"seed":130361133},{"sc":{"name":"fuzz#109s","segs":[{"t":1.8456640698015692,"from":0.24990650793256713,"to":1.6102719937451186,"dir":[0.3213326479186238,-0.9469663823925355],"mode":"run"},{"t":0.5755886911880226,"vx":1.6280430025484194,"vz":-1.111173047682288,"mode":"run"},{"t":1.7277999405283482,"vx":4.659526330798529,"vz":1.2746064367297143,"mode":"run"},{"t":1.9248869450297208,"mode":"idle","stop":true},{"t":0.5464266941417009,"vx":0.3539232294822343,"vz":-0.22212621170319355,"mode":"walk"},{"t":1.321422110265121,"mode":"idle","stop":true},{"t":2.5,"mode":"idle","stop":true}],"smooth":4},"hz":60,"h":2.504230820713565,"jitter":0.3,"seed":42916220},{"sc":{"name":"fuzz#136s","segs":[{"t":0.3563900231383741,"from":0.08520249202564378,"to":0.2140936517040245,"dir":[0.9862206277597665,-0.1654354054642844],"mode":"walk"},{"t":1.1672666209284217,"vx":-0.4488354017480709,"vz":-1.3082487235449523,"mode":"run"},{"t":0.5567616173066199,"vx":-0.8888645161741668,"vz":-0.1862204706551726,"mode":"walk"},{"t":0.5351274152752012,"vx":0.3246530778150744,"vz":-0.12744668536168458,"mode":"walk"},{"t":0.7177170971874147,"vx":-3.1015316546953224,"vz":3.846411330061904,"mode":"run"},{"t":1.32998700956814,"mode":"idle","stop":true},{"t":2.5,"mode":"idle","stop":true}],"smooth":4},"hz":120,"h":2.3655180187430234,"jitter":0.3,"seed":116216204}];
test('pinned randomised sequences hold every invariant',()=>{
  const failures=[];
  for(const c of pinnedFuzz){
    const m=measure(c.sc,c.hz,c.h,c.jitter,c.seed),f=violations(m,c.sc);
    report.push({...m,violations:f});
    if(f.length)failures.push(c.sc.name+' @'+c.hz+'Hz h'+c.h.toFixed(2)+': '+f.join('; '));
  }
  assert.deepEqual(failures,[]);
});
// Turn response (the integration review's probe, at 1 and 1.25 m/s): walk
// for 1 s, turn the root's travel 90 degrees instantly, keep walking; within
// 1.5 s the model yaw error must be below 0.01 rad and stay there.
test('a 90-degree walking turn completes within 1.5 s at 1 and 1.25 m/s, 30/60/120 Hz',()=>{
  const failures=[],wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  for(const v of [1,1.25])for(const side of [1,-1])for(const hz of [30,60,120]){
    const r=createHorse3D(2.3),dt=1/hz,n1=hz,n2=4*hz;let last=0;
    try{
      for(let i=0;i<n1+n2;i++){
        const [vx,vz]=i<n1?[0,-v]:[side*v,0];
        r.g.position.x+=vx*dt;r.g.position.z+=vz*dt;updateHorse3D(r,vx*dt,vz*dt,dt,'walk');
        if(i>=n1&&Math.abs(wrap(Math.atan2(-vx,-vz)-r.model.rotation.y))>=.01)last=(i-n1+1)*dt;
      }
    }finally{r.dispose();}
    if(last>1.5)failures.push(v+' m/s '+(side>0?'right':'left')+' @'+hz+'Hz completes at '+last.toFixed(3)+'s');
  }
  assert.deepEqual(failures,[]);
});
// Integration review (R4) reproductions. Tight circles: the root on a circle
// of radius R at speed v, caller walking, both directions.
test('tight circles keep every hoof on its target and every invariant',()=>{
  const failures=[];
  for(const [R,v,h,hz] of [[.6,1.5,2.3,120],[.5,1.5,1.6,60],[.5,1.7,2.3,120],[.7,1.7,2.3,120]])for(const side of [1,-1]){
    const sc={name:'circle R'+R+' v'+v+(side>0?' cw':' ccw'),segs:[{t:8,speed:v,yawRate:side*v/R,a0:0,mode:'walk'}]};
    const m=measure(sc,hz,h),f=violations(m,sc);report.push({...m,violations:f});
    if(f.length)failures.push(sc.name+' h'+h+' @'+hz+'Hz: '+f.join('; '));
  }
  assert.deepEqual(failures,[]);
});
// Round-6 sweep reproductions (failed on round 5): circles tighter than the
// turn rate allows, where the body's yaw lagged half a turn and reversed
// (reach misses up to 96 mm, no hoof down, emergency lifts); slaloms whose
// heading reversals turned the body under a hoof that was waiting for
// support; a tight circle straightened out and stopped; jittered circles and
// figure-eights. Caller walking unless noted. [R, v, h, Hz, side],
// [v, amplitude rad, period s, h, Hz] and [figure-eight, R, v, h, Hz, side,
// frame-jitter seed] (jitter .3).
const circleCases=[[.3,.8,1.6,60,1],[.3,.8,1.6,60,-1],[.3,.8,1.6,120,1],[.3,.8,1.6,120,-1],[.5,1.4,1.6,120,-1],[.5,1.7,1.6,120,1],
  [.3,1.4,2.3,30,-1],[.3,1.4,2.3,60,-1],[.3,1.7,2.3,60,-1],[.7,1.4,2.3,120,-1]];
const slalomCases=[[.6,2.5,1,2.3,120],[.6,2.5,2,2.3,120],[.6,1.2,1,1.6,60],[.6,.5,2,2.3,30],
  // Round 7: failed while the walking caller's trot turn budget was raised.
  [1.2,.5,1,1.6,120],[1.6,1.2,1,2.3,120],[1.6,2.5,1,2.3,120],[.6,2.5,1,1.6,30],[1.2,2.5,1,1.6,60],[1.6,2.5,1,1.6,60]];
const jitterCases=[[0,.3,1.7,1.6,60,1,27],[1,.3,1.7,1.6,30,1,31],[1,.3,1.7,1.6,30,-1,32],[1,.5,1.7,1.6,60,-1,106],
  // Round 7, running (failed on intermediate candidates): figure-eights and a
  // circle at 2.5-5 m/s whose body lagged the heading (8-11 mm misses, swing
  // paths failing the reach postcondition).
  [1,.3,2.5,1.2,120,-1,48],[1,.5,5,2.3,120,1,143],[0,.3,5,2.3,120,1,65],
  // R7 exact-tree review (figure8-reproductions.mjs): swing paths failing the
  // reach postcondition while contact held; and two more found while fixing
  // them (a 45 mm miss and a postcondition count on intermediate candidates).
  [1,.3,2.5,1.6,120,-1,48],[1,.3,5,2.3,120,1,71],[1,.3,3.5,2.3,60,-1,58],[1,.3,5,2.3,120,-1,72]];
test('circles beyond the turn rate, slaloms and a straightened circle hold every invariant',()=>{
  const failures=[],cases=[];
  for(const [R,v,h,hz,side] of circleCases)cases.push([{name:'circle R'+R+' v'+v+(side>0?' cw':' ccw'),segs:[{t:8,speed:v,yawRate:side*v/R,a0:0,mode:'walk'}]},hz,h]);
  for(const [v,A,T,h,hz] of slalomCases)cases.push([{name:'slalom v'+v+' A'+A+' T'+T,segs:[{t:6,fn:t=>{const a=A*Math.sin(2*Math.PI*t/T);return [Math.sin(a)*v,-Math.cos(a)*v];},mode:'walk'}]},hz,h]);
  cases.push([{name:'circle R.4 v1.7 ccw, straight, stop',segs:[{t:3,speed:1.7,yawRate:-1.7/.4,a0:0,mode:'walk'},{t:2,vx:0,vz:-1.7,mode:'walk'},{t:3,mode:'idle',stop:true}]},120,2.3]);
  for(const [fig,R,v,h,hz,side,js] of jitterCases){
    const w=side*v/R,T=2*Math.PI/Math.abs(w),mode=v>1.7?'run':'walk';
    const seg=fig?{t:8,fn:t=>{const tm=t%(2*T),a=tm<T?w*tm:w*T-w*(tm-T);return [Math.sin(a)*v,-Math.cos(a)*v];},mode}:{t:8,speed:v,yawRate:w,a0:0,mode};
    cases.push([{name:(fig?'figure-eight':'circle')+' R'+R+' v'+v+(side>0?' cw':' ccw')+' jitter seed '+js,segs:[seg]},hz,h,.3,js]);
  }
  for(const [sc,hz,h,jitter=0,js=1] of cases){
    const m=measure(sc,hz,h,jitter,js),f=violations(m,sc);report.push({...m,violations:f});
    if(f.length)failures.push(sc.name+' h'+h+' @'+hz+'Hz: '+f.join('; '));
  }
  assert.deepEqual(failures,[]);
});
// R6 exact-tree review reproductions (known-reproductions.mjs), unchanged
// calls: straight walk 1.7 m/s for .25 or 1 s then a 0.7 m circle; the four
// audit circles after 1 s of straight walking; the disclosed unsmoothed
// extreme slaloms at h 1.6 (heading 2.5 rad at 1 Hz) and their eased (4/s)
// counterparts. Both directions where a side applies.
test('R6 review reproductions hold every invariant',()=>{
  const failures=[],cases=[];
  for(const warm of [.25,1])for(const side of [1,-1])cases.push([{name:'straight '+warm+' s then circle R.7 v1.7'+(side>0?' cw':' ccw'),segs:[{t:warm,vz:-1.7,mode:'walk'},{t:4,speed:1.7,yawRate:side*1.7/.7,a0:0,mode:'walk'}]},120,2.3]);
  for(const [radius,speed,height,hz] of [[.6,1.5,2.3,120],[.5,1.5,1.6,60],[.5,1.7,2.3,120],[.7,1.7,2.3,120]])for(const side of [1,-1])
    cases.push([{name:'audit circle R'+radius+' v'+speed+(side>0?' cw':' ccw'),segs:[{t:1,vz:-speed,mode:'walk'},{t:4,speed,yawRate:side*speed/radius,a0:0,mode:'walk'}]},hz,height]);
  for(const [speed,hz] of [[1.2,30],[1.2,120],[1.6,120]])for(const smooth of [0,4])
    cases.push([{name:'extreme slalom v'+speed+(smooth?' eased':''),segs:[{t:6,fn:t=>{const a=2.5*Math.sin(2*Math.PI*t);return [Math.sin(a)*speed,-Math.cos(a)*speed];},mode:'walk'}],...(smooth?{smooth}:{})},hz,1.6]);
  for(const [sc,hz,h] of cases){
    const m=measure(sc,hz,h),f=violations(m,sc);report.push({...m,violations:f});
    if(f.length)failures.push(sc.name+' h'+h+' @'+hz+'Hz: '+f.join('; '));
  }
  assert.deepEqual(failures,[]);
});
// A trot promoted for a turn ends with the turn; walking reversals never
// leave the caller's walk without a hoof down.
test('a turned walk returns to walk, and walking reversals keep a hoof down',()=>{
  const failures=[];
  for(const v of [1.2,1.5])for(const hz of [30,60,120]){
    const r=createHorse3D(2.3),dt=1/hz;
    try{for(let i=0;i<11*hz;i++){const [vx,vz]=i<hz?[0,-v]:[v,0];r.g.position.x+=vx*dt;r.g.position.z+=vz*dt;updateHorse3D(r,vx*dt,vz*dt,dt,'walk');}
      if(r.state.gait!=='walk')failures.push('turn at '+v+' m/s @'+hz+'Hz still '+r.state.gait+' 10 s later');}finally{r.dispose();}
  }
  for(const [v,warm] of [[.5,.3],[1,1.2],[1,.3]])for(const hz of [30,60,120]){
    const r=createHorse3D(2.3),dt=1/hz,n1=Math.round(warm*hz);let least=4;
    try{for(let i=0;i<n1+4*hz;i++){const vz=i<n1?-v:v;r.g.position.z+=vz*dt;updateHorse3D(r,0,vz*dt,dt,'walk');least=Math.min(least,r.legs.filter(l=>l.track.mode==='stance').length);}}finally{r.dispose();}
    if(least<1)failures.push('reversal at '+v+' m/s after '+warm+' s @'+hz+'Hz has no hoof down');
  }
  assert.deepEqual(failures,[]);
});
test.after(()=>{
  mkdirSync(new URL('./artifacts/',import.meta.url),{recursive:true});
  writeFileSync(new URL('./artifacts/horse-contact-feasibility.json',import.meta.url),JSON.stringify(report,null,1));
});

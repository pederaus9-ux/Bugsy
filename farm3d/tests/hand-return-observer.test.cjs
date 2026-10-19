const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {installHandObservation,instrumentSource}=require('./hand-return-observer.cjs');
function fixture(){
 let time=0;const listeners=new Map(),neutral=[0,0,0,1];
 const button={textContent:'Harvest',addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(type){listeners.delete(type);}};
 const root={visible:true,getObjectByName:()=>({quaternion:{toArray:()=>neutral.slice()}})};
 const context={performance:{now:()=>time},document:{hidden:false,visibilityState:'visible',getElementById:()=>button},
  __dbg:{camera:{getObjectByName:()=>root},clock:()=>time/1000,G:{S:{plots:[{crop:null}]}}},__authoredSamples:[]};
 context.window=context;vm.runInNewContext('('+installHandObservation.toString()+')({nativeNeutral:[0,0,0,1],neutral:[0,0,0,1],capacity:3})',context);
 return {c:context,step(dt=.1){time+=100;const o=context.__handReturnObserver;o.enter();o.begin(dt,time/1000,dt);o.native();o.composed(null,{rest:1,action:null});},click(trusted){listeners.get('click')({isTrusted:trusted,timeStamp:time});},tick(ms){time+=ms;}};
}
test('update counts remain exact when ring storage is exhausted before input',()=>{
 const f=fixture();for(let i=0;i<250;i++)f.step();f.click(true);for(let i=0;i<10;i++)f.step();
 const s=f.c.__handReturnObserver.snapshot();assert.equal(s.counts.updatesAfterTrustedClick,10);assert.equal(s.counts.totalUpdates,260);
 assert.equal(s.history.stored,3);assert.equal(s.history.dropped,257);assert.equal(s.history.firstRetainedId,258);
});
test('untrusted clicks do not establish the trusted input boundary',()=>{
 const f=fixture();f.click(false);f.step();assert.equal(f.c.__handReturnObserver.snapshot().counts.updatesAfterTrustedClick,null);
 f.click(true);f.step(0);const s=f.c.__handReturnObserver.snapshot();assert.equal(s.counts.updatesAfterTrustedClick,1);assert.equal(s.history.updates.at(-1).dt,0);
});
test('last poll is retained separately from later state and observer errors are explicit',()=>{
 const f=fixture();const o=f.c.__handReturnObserver;f.c.__authoredSamples=Array.from({length:6},()=>[0,0,0,1]);o.poll(false);const at=o.snapshot().lastPoll.at;
 f.tick(500);f.step();const s=o.snapshot();assert(s.observedAt>at);assert.equal(s.lastPoll.totalUpdates,0);assert.equal(s.counts.totalUpdates,1);
 f.c.__authoredSamples=null;o.poll(false);f.c.__authoredSamples=[];assert.equal(o.snapshot().errorCount,1);o.stop();assert.equal(f.c.__handReturnObserver,undefined);
});
test('served instrumentation retains actual dt calculation and original held-frame return',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),observed=instrumentSource(source);
 assert(observed.includes('const dt = Math.min(.1, t - (frame.lastT ?? t));'));
 assert(observed.includes('if(window.__handsCaptureHold){requestAnimationFrame(frame);return;}'));
 assert(observed.includes('composed(punch,playerMotion.state)'));assert.throws(()=>instrumentSource('different source'));
});
test('queued original collector callback remains safe after observer removal',()=>{
 const f=fixture(),queue=[];f.c.requestAnimationFrame=fn=>queue.push(fn);
 const source=fs.readFileSync(path.join(__dirname,'authored-hands-diagnostic.browser.cjs'),'utf8');
 const begin=source.indexOf('window.__authoredSamples=[];window.__authoredSampling=true;let frames=0;');
 const end=source.indexOf('},{nativeNeutral,neutral});',begin);assert(begin>=0&&end>begin);
 vm.runInNewContext(source.slice(begin,end),f.c);f.c.__handReturnObserver.stop();
 assert.doesNotThrow(()=>queue.shift()());assert.equal(f.c.__authoredSamples.length,1);
});

// Cow accounting only: no scene, DOM, inventory, network or global randomness.
export const COW_CARE=Object.freeze({version:1,maxCows:5,feedCapacity:30,waterSupply:43_200_000,interval:180_000,happyInterval:144_000,robotDuration:12_000,tankCapacity:50,xp:3});
const C=COW_CARE,finite=n=>typeof n==='number'&&Number.isFinite(n),uint=n=>Number.isSafeInteger(n)&&n>=0;
const batch=b=>b&&typeof b.id==='string'&&[1,2].includes(b.n)&&typeof b.gold==='boolean'&&b.xp===C.xp&&typeof b.credited==='boolean';
export function validateCowCare(c){
 if(c?.v!==C.version||!finite(c.lastAt)||c.lastAt<0||!uint(c.feed)||c.feed>C.feedCapacity||!finite(c.waterUntil)||c.waterUntil<0||!uint(c.nextId)||c.nextId<1||!uint(c.nextJob)||c.nextJob<1||!uint(c.revision)||!uint(c.rng)||c.rng>0xffffffff)return false;
 if(!Array.isArray(c.cows)||c.cows.length>C.maxCows||!Array.isArray(c.queue)||c.queue.length>C.maxCows||!Array.isArray(c.receipts)||c.receipts.length>C.maxCows)return false;
 const ids=new Set();for(const b of c.cows){const number=Number(b?.id?.match(/^cow-(\d+)$/)?.[1]);if(!uint(number)||number<1||number>=c.nextId||ids.has(b.id)||!uint(b.cycle)||!finite(b.lastAt)||b.lastAt<0||!finite(b.progress)||b.progress<0||![C.interval,C.happyInterval].includes(b.duration)||b.progress>b.duration||typeof b.feedCharged!=='boolean'||typeof b.happy!=='boolean'||!(b.legacyAt===null||finite(b.legacyAt)&&b.legacyAt>0)||!(b.ready===null||batch(b.ready)))return false;ids.add(b.id);}
 if(new Set(c.queue).size!==c.queue.length||c.queue.some(id=>!ids.has(id)||!c.cows.find(b=>b.id===id).ready||c.job?.cowId===id))return false;
 if(!c.tank||!uint(c.tank.normal)||!uint(c.tank.gold)||c.tank.normal+c.tank.gold>C.tankCapacity)return false;
 if(c.receipts.some(r=>!batch(r))||new Set(c.receipts.map(r=>r.id)).size!==c.receipts.length)return false;
 if(c.job!==null&&(!c.job||!uint(c.job.id)||c.job.id<1||c.job.id>=c.nextJob||!ids.has(c.job.cowId)||!['approaching','milking','exiting'].includes(c.job.stage)||!batch(c.job.batch)||typeof c.job.credited!=='boolean'||!(c.job.startedAt===null||finite(c.job.startedAt)&&c.job.startedAt>=0)))return false;
 for(const b of c.cows)if(b.ready&&(b.ready.id!==b.id+':'+b.cycle||b.ready.credited))return false;
 if(c.job){const j=c.job,b=c.cows.find(b=>b.id===j.cowId);
  if(j.stage==='approaching'?j.startedAt!==null:j.startedAt===null)return false;
  if(j.stage==='exiting'){if(!j.credited||!j.batch.credited||b.ready!==null)return false;}
  else if(j.credited||j.batch.credited||!b.ready||j.batch.id!==b.ready.id||j.batch.n!==b.ready.n||j.batch.gold!==b.ready.gold||c.tank.normal+c.tank.gold+j.batch.n>C.tankCapacity)return false;
 }
 return true;
}
function cow(id,legacyAt,atMs){return {id,cycle:0,lastAt:atMs,progress:0,duration:C.interval,feedCharged:false,happy:false,legacyAt,ready:null};}
export function ensureCowCare(pen,atMs){
 if(!pen?.owned||!Array.isArray(pen.list)||pen.list.length>C.maxCows||!finite(atMs)||atMs<0||!pen.list.every(t=>finite(t)&&t>=0))return null;
 let c=pen.care;
 if(c){if(!validateCowCare(c)||c.cows.length>pen.list.length||pen.list.some(t=>t!==0))return null;}
 else{
  c={v:C.version,lastAt:atMs,feed:0,waterUntil:0,nextId:1,nextJob:1,cows:[],queue:[],job:null,tank:{normal:0,gold:0},receipts:[],rng:0x7c43a19d,revision:0};
  for(const t of pen.list)c.cows.push(cow('cow-'+c.nextId++,t>0?t:null,atMs));
  pen.care=c;pen.list=pen.list.map(()=>0);
 }
 while(c.cows.length<pen.list.length){c.cows.push(cow('cow-'+c.nextId++,null,atMs));c.revision++;}
 return c;
}
const love=(m,t)=>Math.max(0,Math.min(100,(m?.love??50)-(t-(m?.loveAt??t))/8_640_000));
function random(c){let x=c.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;c.rng=x>>>0||1;return c.rng/4294967296;}
function readyBatch(c,b){const n=b.happy&&random(c)<.25?2:1,gold=b.happy&&random(c)<.3;b.ready={id:b.id+':'+b.cycle,n,gold:!!gold,xp:C.xp,credited:false};c.revision++;}
const room=c=>C.tankCapacity-c.tank.normal-c.tank.gold-(c.job&&!c.job.credited?c.job.batch.n:0);
function admit(c){
 if(c.job||!c.queue.length)return;
 const b=c.cows.find(b=>b.id===c.queue[0]);
 if(!b?.ready||room(c)<b.ready.n)return;
 c.queue.shift();c.job={id:c.nextJob++,cowId:b.id,stage:'approaching',batch:{...b.ready},startedAt:null,credited:false};c.revision++;
}
export function settleCowCare(pen,atMs){
 const c=ensureCowCare(pen,atMs);if(!c||atMs<c.lastAt)return c;
 for(let i=0;i<c.cows.length;i++){
  const b=c.cows[i],from=Math.max(c.lastAt,b.lastAt);b.lastAt=Math.max(b.lastAt,atMs);
  if(b.ready||c.job?.cowId===b.id)continue;
  if(b.legacyAt!==null){if(b.legacyAt<=atMs){b.happy=love(pen.meta?.[i],b.legacyAt)>=70;b.cycle++;b.progress=b.duration;b.feedCharged=true;b.legacyAt=null;readyBatch(c,b);}continue;}
  if(!b.feedCharged&&c.feed>0&&c.waterUntil>from){c.feed--;b.feedCharged=true;b.happy=love(pen.meta?.[i],from)>=70;b.duration=b.happy?C.happyInterval:C.interval;b.cycle++;c.revision++;}
  if(b.feedCharged){b.progress=Math.min(b.duration,b.progress+Math.max(0,Math.min(atMs,c.waterUntil)-from));if(b.progress===b.duration)readyBatch(c,b);}
 }
 if(c.job?.stage==='milking'&&atMs>=c.job.startedAt+C.robotDuration){
  const j=c.job,b=c.cows.find(b=>b.id===j.cowId);
  if(!j.credited){c.tank[j.batch.gold?'gold':'normal']+=j.batch.n;j.credited=true;j.batch.credited=true;c.receipts.push({...j.batch,credited:false});b.ready=null;b.progress=0;b.feedCharged=false;}
  j.stage='exiting';c.revision++;
 }
 c.lastAt=atMs;admit(c);return c;
}
export function stockCowFeed(pen,units,atMs){
 if(!uint(units))return 0;const c=settleCowCare(pen,atMs);if(!c||atMs<c.lastAt)return 0;
 const n=Math.min(units,C.feedCapacity-c.feed);c.feed+=n;if(n){c.revision++;settleCowCare(pen,atMs);}return n;
}
export function refillCowWater(pen,atMs){
 const c=settleCowCare(pen,atMs);if(!c||atMs<c.lastAt)return false;const until=atMs+C.waterSupply;if(c.waterUntil>=until)return false;c.waterUntil=until;c.revision++;settleCowCare(pen,atMs);return true;
}
export function requestCowMilking(pen,cowId,atMs){
 const c=settleCowCare(pen,atMs);if(!c||atMs<c.lastAt)return {ok:false,reason:'unavailable'};
 const b=c.cows.find(b=>b.id===cowId);if(!b?.ready)return {ok:false,reason:'notReady'};
 if(c.job?.cowId===cowId||c.queue.includes(cowId))return {ok:false,reason:'alreadyQueued'};
 if(room(c)<b.ready.n)return {ok:false,reason:'tankFull'};
 c.queue.push(cowId);c.revision++;admit(c);return {ok:true,reason:null};
}
export function dockCowMilking(pen,jobId,atMs){
 const c=settleCowCare(pen,atMs),j=c?.job;if(!c||atMs<c.lastAt||j?.id!==jobId||j.stage!=='approaching')return false;
 j.startedAt=atMs;j.stage='milking';c.revision++;return true;
}
export function finishCowRobotExit(pen,jobId,atMs){
 const c=settleCowCare(pen,atMs);if(!c||atMs<c.lastAt||c.job?.id!==jobId||c.job.stage!=='exiting')return false;
 c.job=null;c.revision++;settleCowCare(pen,atMs);return true;
}
export function takeCowMilk(pen,units,atMs){
 if(!uint(units))return {normal:0,gold:0};const c=settleCowCare(pen,atMs);if(!c||atMs<c.lastAt)return {normal:0,gold:0};
 const normal=Math.min(units,c.tank.normal),gold=Math.min(units-normal,c.tank.gold);c.tank.normal-=normal;c.tank.gold-=gold;if(normal+gold)c.revision++;admit(c);return {normal,gold};
}
export function acknowledgeCowReward(pen,receiptId){
 const c=pen?.care;if(!validateCowCare(c))return false;const i=c.receipts.findIndex(r=>r.id===receiptId);if(i<0)return false;c.receipts.splice(i,1);c.revision++;return true;
}

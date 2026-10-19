// Chicken-only accounting. No DOM, inventory, timers, network or global randomness.
export const CHICKEN_CARE = Object.freeze({version:1,capacity:240,interval:1_800_000,supply:43_200_000});
const C=CHICKEN_CARE;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const loveAt=(m,t)=>Math.max(0,Math.min(100,(m?.love??50)-(t-(m?.loveAt??t))/8_640_000));
function random(c){let x=c.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;c.rng=x>>>0||1;return c.rng/4294967296;}
const count=c=>c.batches.reduce((n,b)=>n+b.n,0);
function sync(c){c.normal=0;c.gold=0;for(const b of c.batches)c[b.gold?'gold':'normal']+=b.n;}
function valid(c){
  if(c?.v!==1||!finite(c.lastAt)||!finite(c.feedUntil)||!finite(c.waterUntil)||c.feedUntil<0||c.waterUntil<0)return false;
  if(!Array.isArray(c.birds)||c.birds.length>6||!Array.isArray(c.legacy)||c.legacy.length>12||!Array.isArray(c.batches)||c.batches.length>C.capacity)return false;
  if(!c.batches.every(b=>b&&Number.isInteger(b.n)&&b.n>0&&b.n<=2&&typeof b.gold==='boolean'&&(b.xp===0||b.xp===2)))return false;
  if(!c.birds.every(b=>b&&finite(b.progress)&&b.progress>=0&&b.progress<=b.duration&&[C.interval,C.interval*.8].includes(b.duration)&&typeof b.happy==='boolean'&&(b.startedAt===null||finite(b.startedAt))))return false;
  if(!c.legacy.every(l=>l&&Number.isInteger(l.i)&&l.i>=0&&l.i<c.birds.length&&finite(l.at)&&l.at>0)||new Set(c.legacy.map(l=>l.i+':'+l.at)).size!==c.legacy.length)return false;
  const normal=c.batches.filter(b=>!b.gold).reduce((n,b)=>n+b.n,0),gold=c.batches.filter(b=>b.gold).reduce((n,b)=>n+b.n,0);
  return normal+gold<=C.capacity&&normal===c.normal&&gold===c.gold&&Number.isSafeInteger(c.revision)&&c.revision>=0&&Number.isInteger(c.rng)&&c.rng>=0&&c.rng<=0xffffffff;
}
function bird(){return {progress:0,duration:C.interval,happy:false,startedAt:null};}
export function ensureChickenCare(pen,at){
  if(!pen?.owned||!Array.isArray(pen.list)||pen.list.length>6||!finite(at))return null;
  let c=pen.care;
  if(c&&!valid(c))return null; // Preserve unknown/corrupt envelopes, never reset valuable stock.
  if(!c){
    c=pen.care={v:1,lastAt:at,feedUntil:0,waterUntil:0,birds:[],legacy:[],batches:[],normal:0,gold:0,rng:0x4a17b39d,revision:0};
    pen.list.forEach((end,i)=>{if(finite(end)&&end>0)c.legacy.push({i,at:end});});
    pen.list=pen.list.map(()=>0);
  }
  if(c.birds.length>pen.list.length)return null;
  // A still-open v25 client can write another paid timer into list[] while
  // preserving this optional envelope. Import each distinct unpaid timer once;
  // do not lose it merely because the initial migration already happened.
  const incoming=pen.list.flatMap((end,i)=>finite(end)&&end>0&&!c.legacy.some(l=>l.i===i&&l.at===end)?[{i,at:end}]:[]);
  if(c.legacy.length+incoming.length>12)return null; // Preserve ambiguous overflow for recovery.
  while(c.birds.length<pen.list.length){c.birds.push(bird());c.revision++;}
  if(incoming.length){c.legacy.push(...incoming);c.revision++;}
  if(pen.list.some(end=>finite(end)&&end>0))pen.list=pen.list.map(end=>finite(end)&&end>0?0:end);
  return c;
}
function begin(c,pen,t){
  if(count(c)>=C.capacity||Math.min(c.feedUntil,c.waterUntil)<=t)return;
  c.birds.forEach((b,i)=>{if(b.startedAt===null&&!c.legacy.some(l=>l.i===i)){b.happy=loveAt(pen.meta?.[i],t)>=70;b.duration=C.interval*(b.happy?.8:1);b.startedAt=t;}});
}
function award(c,happy){
  const room=C.capacity-count(c);if(!room)return false;
  const n=Math.min(room,happy&&random(c)<.25?2:1),gold=happy&&random(c)<.3;
  c.batches.push({n,gold,xp:2});return true;
}
export function settleChickenCare(pen,at){
  const c=ensureChickenCare(pen,at);if(!c)return null;
  if(at<c.lastAt)return c;
  let t=c.lastAt,steps=0;
  while(steps++<1024){
    // Already-paid legacy outputs complete without new supplies, exactly once.
    for(const l of [...c.legacy].sort((a,b)=>a.at-b.at||a.i-b.i)){
      if(l.at<=t&&award(c,loveAt(pen.meta?.[l.i],Math.max(l.at,c.lastAt))>=70))c.legacy.splice(c.legacy.indexOf(l),1);
    }
    begin(c,pen,t);
    const active=count(c)<C.capacity&&Math.min(c.feedUntil,c.waterUntil)>t;
    const eligible=c.birds.map((b,i)=>({b,i})).filter(({i})=>!c.legacy.some(l=>l.i===i));
    if(active){for(const {b}of eligible)if(b.progress>=b.duration){if(!award(c,b.happy))break;b.progress=0;b.startedAt=null;}begin(c,pen,t);}
    if(t>=at)break;
    const running=count(c)<C.capacity&&Math.min(c.feedUntil,c.waterUntil)>t;
    const nextLegacy=Math.min(...c.legacy.filter(l=>l.at>t).map(l=>l.at));
    const nextEgg=running?Math.min(...eligible.map(({b})=>t+Math.max(0,b.duration-b.progress))):Infinity;
    const next=Math.min(at,nextLegacy,nextEgg,running?Math.min(c.feedUntil,c.waterUntil):Infinity);
    if(next<=t)break;
    if(running)for(const{b}of eligible)b.progress+=next-t;
    t=next;
    // Credit exact-boundary completions before supply exhaustion is tested again.
    if(running)for(const{b}of eligible){if(b.progress>=b.duration){if(!award(c,b.happy))break;b.progress=0;b.startedAt=null;}}
  }
  c.lastAt=at;sync(c);return c;
}
function resourceKey(resource){return resource==='feed'?'feedUntil':resource==='water'?'waterUntil':null;}
export function quoteChickenRefill(pen,resource,at){
  const copy=structuredClone(pen),c=settleChickenCare(copy,at),key=resourceKey(resource);
  if(!c||!key)return {cost:0,until:0,revision:-1,reason:'unavailable'};
  const t=Math.max(at,c.lastAt),missing=1-Math.min(C.supply,Math.max(0,c[key]-t))/C.supply;
  return {cost:resource==='feed'?Math.ceil(pen.list.length*missing):0,until:t+C.supply,revision:c.revision,full:missing===0};
}
export function refillChickenCare(pen,resource,at,expectedRevision){
  const c=ensureChickenCare(pen,at),key=resourceKey(resource);
  if(!c||!key)return {ok:false,cost:0,reason:'unavailable'};
  if(expectedRevision!==c.revision)return {ok:false,cost:0,reason:'changed'};
  settleChickenCare(pen,at);const q=quoteChickenRefill(pen,resource,at);
  if(q.full)return {ok:true,cost:0,reason:'full'};
  c[key]=q.until;c.revision++;begin(c,pen,Math.max(at,c.lastAt));return {ok:true,cost:q.cost,reason:null};
}
export function takeChickenEggs(pen,room,at){
  const none={normal:0,gold:0,xp:0};if(!finite(room)||room<1)return none;
  const c=settleChickenCare(pen,at);if(!c)return none;
  room=Math.floor(room);const result={...none};
  for(const quality of [true,false])for(const b of c.batches){if(b.gold!==quality||!room)continue;const n=Math.min(room,b.n);if(n){result[quality?'gold':'normal']+=n;result.xp+=b.xp;b.xp=0;b.n-=n;room-=n;}}
  c.batches=c.batches.filter(b=>b.n);sync(c);
  if(result.normal+result.gold){c.revision++;begin(c,pen,c.lastAt);}
  return result;
}
export function chickenCareStatus(pen,at){
  const copy=structuredClone(pen),c=settleChickenCare(copy,at);
  if(!c)return {total:0,normal:0,gold:0,feedMs:0,waterMs:0,reason:pen?.owned?'unavailable':'unowned'};
  const t=Math.max(at,c.lastAt),total=c.normal+c.gold,feedMs=Math.max(0,c.feedUntil-t),waterMs=Math.max(0,c.waterUntil-t);
  return {total,normal:c.normal,gold:c.gold,feedMs,waterMs,reason:total>=C.capacity?'full':!pen.list.length?'no-chickens':!feedMs&&!waterMs?'feed-water':!feedMs?'feed':!waterMs?'water':null};
}

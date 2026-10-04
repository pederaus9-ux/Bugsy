// Anonymous, bounded reports. The existing Firestore event shape stays exactly {e, d}.
// No account/device identifier, raw UA, screen dimensions, farm, URL, error text or stack is sent.
export const ANALYTICS_RELEASE = '36';
export const ANALYTICS_KEY = 'sa3d-metrics-v2';
export const MAX_QUEUE = 48, DAILY_LIMIT = 40;
const DAY = 864e5, KEEP_DAYS = 14;
const PLATFORMS = {a:'android',i:'ios',d:'desktop',o:'other'};
const SCREENS = {p:'phone',t:'tablet',d:'desktop',u:'unknown'};
const MODES = {g:'guest',a:'account',u:'unknown'};
const code = (map, value) => Object.keys(map).find(k => map[k] === value);
export const LEVELS = [2,3,5,8,10,15,20];
export const DURATIONS = ['Under 1 minute','1–4 minutes','5–14 minutes','15–29 minutes','30+ minutes'];
export const FPS_LABELS = {a:'60+ FPS',b:'45–59 FPS',c:'30–44 FPS',d:'Below 30 FPS',x:'Not enough frames'};
export const MILESTONES = [['open','Opened the game'],['harv','First harvest'],['ord','First order'],['tut','Tutorial finished'],
  ...LEVELS.map(n => ['lvl:'+n,'Level '+n]),['ret1','Returned on day 1'],['ret7','Returned on day 7']];
export const utcDay = ms => new Date(ms).toISOString().slice(0,10);
function validDay(d) { try { return /^\d{4}-\d{2}-\d{2}$/.test(d) && utcDay(Date.parse(d+'T00:00:00Z')) === d; } catch { return false; } }
export function platformClass(ua = '', platform = '', touch = 0) {
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua) || platform === 'MacIntel' && touch > 1) return 'ios';
  if (/Windows|Macintosh|X11|Linux/i.test(ua)) return 'desktop';
  return 'other';
}
export function screenClass(platform, width, height) {
  if (platform === 'desktop') return 'desktop';
  if (!(width > 0 && height > 0)) return 'unknown';
  return Math.min(width,height) < 600 ? 'phone' : 'tablet';
}
export function fpsBucket(fps) { return !Number.isFinite(fps) || fps <= 0 ? 'x' : fps >= 60 ? 'a' : fps >= 45 ? 'b' : fps >= 30 ? 'c' : 'd'; }
export function durationBucket(ms) { return ms < 60e3 ? 0 : ms < 300e3 ? 1 : ms < 900e3 ? 2 : ms < 1800e3 ? 3 : 4; }
function validValue(kind, value) {
  if (kind === 'lvl') return LEVELS.includes(Number(value)) && String(Number(value)) === value;
  if (kind === 'sess') return /^[0-4][01][abcdx]$/.test(value);
  return ['open','harv','ord','tut','ret1','ret7','boot'].includes(kind) && value === '0';
}
export function encodeReport(context, kind, value = '0') {
  value = String(value);
  const {version = ANALYTICS_RELEASE, platform, screen, mode} = context;
  const p = code(PLATFORMS,platform), s = code(SCREENS,screen), m = code(MODES,mode);
  if (!/^[1-9]\d{0,3}$/.test(version) || !p || !s || !m || !validValue(kind,value)) return null;
  const e = `a2_${version}_${p}${s}${m}_${kind}_${value}`;
  return e.length <= 24 ? e : null;
}
export function decodeReport(row) {
  if (!row || Object.keys(row).length !== 2 || !validDay(row.d) || typeof row.e !== 'string') return null;
  const m = /^a2_([1-9]\d{0,3})_([aido])([ptdu])([gau])_([a-z0-9]+)_([a-z0-9]+)$/.exec(row.e);
  if (!m || row.e.length > 24 || !validValue(m[5],m[6])) return null;
  return {version:m[1],platform:PLATFORMS[m[2]],screen:SCREENS[m[3]],mode:MODES[m[4]],kind:m[5],value:m[6],day:row.d};
}
export function summarizeReports(rows, {version='*',platform='*'} = {}) {
  const out = {reports:0,sessions:0,clean:0,bootErrors:0,milestones:{},fps:{},durations:[0,0,0,0,0],screens:{},modes:{}};
  for (const row of rows) {
    const r = decodeReport(row);
    if (!r || version !== '*' && r.version !== version || platform !== '*' && r.platform !== platform) continue;
    out.reports++;
    if (r.kind === 'sess') {
      out.sessions++; if (r.value[1] === '0') out.clean++;
      out.durations[Number(r.value[0])]++; out.fps[r.value[2]] = (out.fps[r.value[2]] || 0)+1;
      out.screens[r.screen] = (out.screens[r.screen] || 0)+1; out.modes[r.mode] = (out.modes[r.mode] || 0)+1;
    } else if (r.kind === 'boot') out.bootErrors++;
    else { const key = r.kind === 'lvl' ? 'lvl:'+r.value : r.kind; out.milestones[key] = (out.milestones[key] || 0)+1; }
  }
  return out;
}
const milestone = name => name === 'open' ? ['open','0'] : name === 'harvest' ? ['harv','0'] : name === 'order' ? ['ord','0'] :
  name === 'tut_done' ? ['tut','0'] : /^lvl_(2|3|5|8|10|15|20)$/.test(name) ? ['lvl',name.slice(4)] : null;

export function createAnalytics({storage,context,canPlay=()=>true,canSend=()=>true,write,now=()=>Date.now(),
  id=()=>globalThis.crypto.randomUUID().replaceAll('-',''),disabled=false}) {
  let state = {day:'',count:0,first:'',done:[],queue:[]};
  try {
    const raw = storage?.getItem(ANALYTICS_KEY);
    if (raw && raw.length <= 12000) {
      const s = JSON.parse(raw);
      if (s && typeof s === 'object') {
        state.day = validDay(s.day) ? s.day : ''; state.first = validDay(s.first) ? s.first : '';
        state.count = Number.isInteger(s.count) && s.count >= 0 && s.count <= DAILY_LIMIT ? s.count : 0;
        state.done = Array.isArray(s.done) ? s.done.filter(x => typeof x === 'string' && /^[1-9]\d{0,3}:(open|harv|ord|tut|ret1|ret7|lvl):[0-9]+$/.test(x)).slice(-128) : [];
        state.queue = Array.isArray(s.queue) ? s.queue.filter(x => x && /^[a-z0-9_-]{8,64}$/.test(x.id) && decodeReport(x.data)).slice(-MAX_QUEUE) : [];
      }
    }
  } catch {}
  const pending = new Set(); let segment = null, sending = false, retryAt = 0, hadError = false, bootSent = false;
  const persist = () => { try { storage?.setItem(ANALYTICS_KEY,JSON.stringify(state)); } catch {} };
  const prune = () => { const day = utcDay(now()); if (state.day !== day) { state.day=day; state.count=0; }
    state.queue = state.queue.filter(x => Math.abs(Date.parse(day)-Date.parse(x.data.d)) <= KEEP_DAYS*DAY); };
  const safeContext = () => { try { return context(); } catch { return null; } };
  function emit(kind,value,once=false,c=safeContext()) {
    if (disabled || !c) return false; prune();
    const e = encodeReport(c,kind,value), key = `${c.version || ANALYTICS_RELEASE}:${kind}:${value}`;
    if (!e || once && state.done.includes(key) || state.count >= DAILY_LIMIT || state.queue.length >= MAX_QUEUE) return false;
    let rowId; try { rowId = id(); } catch { return false; }
    if (!/^[a-z0-9_-]{8,64}$/.test(rowId)) return false;
    state.queue.push({id:rowId,data:{e,d:utcDay(now())}}); state.count++;
    if (once) { state.done.push(key); state.done=state.done.slice(-128); }
    persist(); void flush(); return true;
  }
  async function flush() {
    if (disabled || sending || !canSend() || now() < retryAt) return;
    prune(); sending=true;
    try {
      while (state.queue.length && canSend()) {
        const row=state.queue[0];
        try { await write(row.id,{...row.data}); }
        catch (err) {
          // A create-only retry may already exist; refusal is terminal, never read back anonymous docs.
          if (err?.code !== 'permission-denied' && err?.code !== 'invalid-argument') { retryAt=now()+60e3; break; }
        }
        state.queue=state.queue.filter(x => x.id !== row.id); persist();
      }
    } catch { retryAt=now()+60e3; } finally { sending=false; }
  }
  function ready() {
    if (disabled || segment || !canPlay()) return;
    const c=safeContext(); if (!c || c.mode === 'unknown') return;
    segment={context:c,last:null,elapsed:0,intervals:0,frameMs:0,error:hadError}; hadError=false;
    const day=utcDay(now()); if (!state.first) { state.first=day; persist(); }
    emit('open','0',true,c);
    const days=(Date.parse(day)-Date.parse(state.first))/DAY;
    if (days === 1) emit('ret1','0',true,c); if (days === 7) emit('ret7','0',true,c);
    for (const name of pending) { const m=milestone(name); if (m) emit(...m,true,c); } pending.clear();
  }
  return {
    milestone(name) { const m=milestone(name); if (disabled || !m) return;
      if (!segment) pending.add(name); else emit(...m,true,segment.context); },
    frame(t) {
      if (disabled) return;
      if (!canPlay()) { this.pause(); return; } ready(); if (!segment || !Number.isFinite(t)) return;
      if (segment.last !== null && t > segment.last) { const dt=t-segment.last; segment.elapsed+=dt; segment.frameMs+=dt; segment.intervals++; }
      segment.last=t;
    },
    pause() { if (segment) segment.last=null; },
    end(t) {
      if (!segment || disabled) return;
      if (segment.last !== null && Number.isFinite(t) && t > segment.last) segment.elapsed+=t-segment.last;
      const s=segment; segment=null;
      const fps=s.frameMs >= 5000 && s.intervals >= 2 ? s.intervals*1000/s.frameMs : null;
      emit('sess',`${durationBucket(s.elapsed)}${s.error ? 1 : 0}${fpsBucket(fps)}`,false,s.context);
    },
    error() { if (disabled) return; if (segment) segment.error=true;
      else { hadError=true; if (!bootSent) bootSent=emit('boot','0'); } },
    flush
  };
}

export function installAnalytics(w=window,doc=document) {
  const params=new URLSearchParams(w.location.search), disabled=params.has('testfarm') || params.has('shot');
  let storage; try { storage=w.localStorage; } catch {}
  const platform=platformClass(w.navigator.userAgent,w.navigator.platform,w.navigator.maxTouchPoints);
  const a=createAnalytics({storage,disabled,
    context:()=>({version:ANALYTICS_RELEASE,platform,screen:screenClass(platform,w.innerWidth,w.innerHeight),mode:w.saAuth?.user ? 'account' : w.saAuth?.guest ? 'guest' : 'unknown'}),
    canPlay:()=>!doc.hidden && !!w.__ready && !w.__saHold && !!doc.getElementById('authGate')?.hidden,
    canSend:()=>w.navigator.onLine !== false && !!w.saAuth?.fb,
    write:(id,data)=> { const {F,db}=w.saAuth.fb; return F.setDoc(F.doc(db,'events',id),data); }
  });
  doc.addEventListener('visibilitychange',()=> { if (doc.hidden) a.end(w.performance.now()); else { a.pause(); void a.flush(); } });
  w.addEventListener('pagehide',()=>a.end(w.performance.now()));
  w.addEventListener('online',()=>void a.flush());
  w.addEventListener('error',e=> { if (e.message && (!e.filename || e.filename.startsWith(w.location.origin) || e.filename.startsWith('https://www.gstatic.com/'))) a.error(); });
  w.addEventListener('unhandledrejection',()=>a.error());
  return a;
}

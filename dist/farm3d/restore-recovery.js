// A local write-ahead record for manual backup restore. No account or cloud access.
export const RESTORE_KEYS = Object.freeze({farm:'sunny-acres-3d-v1',restored:'sa3d-restored',dirty:'sa3d-dirty',weather:'sunny-acres-3d-v1-weather',owner:'sa3d-save-owner',pending:'sa3d-restore-pending-v1',archive:'sa3d-restore-backup-v1'});
const K=RESTORE_KEYS,keys=[K.restored,K.dirty,K.weather,K.farm]; // publish farm last
// Detect accidental journal damage; this is not an authentication/security digest.
function checksum(text){let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return (h>>>0).toString(16);}
const pack=data=>JSON.stringify({data,check:checksum(JSON.stringify(data))});
function unpack(raw){
 const j=JSON.parse(raw),d=j?.data;
 if(!d||j.check!==checksum(JSON.stringify(d))||d.v!==1||!['apply','rollback'].includes(d.phase)||typeof d.owner!=='string')throw Error('Invalid restore record');
 for(const side of ['before','after']){const s=d[side];if(!s||Object.keys(s).length!==keys.length||keys.some(k=>!(k in s)||(s[k]!==null&&typeof s[k]!=='string')))throw Error('Invalid restore snapshot');}
 const farm=JSON.parse(d.after[K.farm]);if(!farm||typeof farm!=='object'||!Array.isArray(farm.plots)||typeof farm.level!=='number'||!Number.isFinite(farm.level))throw Error('Invalid restored farm');
 if(d.after[K.restored]!=='1'||d.after[K.dirty]!=='1')throw Error('Invalid restore intent');
 return d;
}
export function createRestoreRecovery(storage){
 let active=false,unresolved=false,epoch;
 const read=k=>storage.getItem(k);
 const write=(k,v)=>{if(read(k)===v)return;if(v===null)storage.removeItem(k);else storage.setItem(k,v);if(read(k)!==v)throw Error('Restore write refused');};
 const snapshot=()=>Object.fromEntries(keys.map(k=>[k,read(k)]));
 const owned=d=>(read(K.owner)||'')===d.owner;
 const compatible=d=>owned(d)&&keys.every(k=>{const v=read(k);return v===d.before[k]||v===d.after[k];});
 function finish(d){
  if(!compatible(d))throw Error('Restore state changed');
  const desired=d.phase==='apply'?d.after:d.before;
  for(const k of keys)write(k,desired[k]);
  // Keep both complete snapshots after success or refusal; never delete the only copy.
  write(K.archive,pack(d));write(K.pending,null);epoch=read(K.archive);unresolved=false;
 }
 function recover(){
  try{const raw=read(K.pending);if(raw!==null){unresolved=true;finish(unpack(raw));}epoch=read(K.archive);}
  catch{unresolved=true;}
 }
 recover(); // synchronous, before either importing game/auth module takes its snapshot
 function blocked(){try{return active||unresolved||read(K.pending)!==null||read(K.archive)!==epoch;}catch{return true;}}
 return {
  blocked,
  stamp(){try{return read(K.archive);}catch{return undefined;}},
  begin(farm,weather){
   if(blocked())return {status:'pending'};
   let d;
   active=true;
   try{
    const before=snapshot();d={v:1,phase:'apply',owner:read(K.owner)||'',before,after:{...before,[K.farm]:farm,[K.restored]:'1',[K.dirty]:'1'}};
    if(weather!==undefined)d.after[K.weather]=weather;
    unpack(pack(d));write(K.pending,pack(d));
   }catch{active=false;return {status:blocked()?'pending':'refused'};}
   try{finish(d);active=false;return {status:'committed'};}
   catch{
    // Persist rollback intent before attempting it. If that fails, retain the apply
    // record and block; startup will complete that recorded intent, never guess.
    try{d.phase='rollback';write(K.pending,pack(d));finish(d);active=false;return {status:'refused'};}
    catch{unresolved=true;active=false;return {status:'pending'};}
   }
  }
 };
}
// Access itself may be denied by browser privacy/storage settings. Fail closed.
let storage;
try{storage=globalThis.localStorage;}catch{}
export const restoreRecovery=createRestoreRecovery(storage||{getItem(){throw Error('Storage unavailable');}});

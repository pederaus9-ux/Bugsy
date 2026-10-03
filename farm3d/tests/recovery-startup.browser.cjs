// Real game/auth startup ordering with a deterministic SDK boundary.
// The hosted emulator suite remains the authority for Firestore/auth integration.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {start, artifacts} = require('./browser-harness.cjs');
const SAVE = 'sunny-acres-3d-v1';
const broken = '{"startup cut';
const sdk = {
  'firebase-app.js': 'export function initializeApp(c) { return c; }',
  'firebase-auth.js': `const user = {uid:'startup-owner',email:'startup@example.com',metadata:{creationTime:'2026-01-01'}};
    const auth = {currentUser:user}; export function getAuth(){return auth;}
    let changed;
    export function onAuthStateChanged(a,cb){changed=cb;queueMicrotask(()=>cb(user));}
    export async function signOut(){auth.currentUser=null;await changed(null);}`,
  'firebase-firestore.js': `export function getFirestore(){return {};}
    export function doc(db,...p){return p.join('/');}
    export function collection(db,...p){return p.join('/');}
    export function serverTimestamp(){return Date.now();}
    export async function addDoc(){return {};}
    export async function setDoc(){return {};}
    export async function getDoc(){window.__startupReads=(window.__startupReads||0)+1;
      while(window.__startupHoldRead)await new Promise(r=>setTimeout(r,25));
      return {exists:()=>false};}
    export async function runTransaction(db,fn){return fn({get:async()=>({exists:()=>false}),set:(ref,value)=>{window.__startupWrites=(window.__startupWrites||[]);window.__startupWrites.push({ref,value});}});}`,
};
(async()=>{
  const h=await start(), results=[];let failed=true;
  try {
    for(const ordering of ['cloud-first','game-first','sign-out']) {
    const s=await h.setup({width:640,height:360},false,'recovery-startup-'+ordering),page=s.page;
    await page.addInitScript(([key,bad,order])=>{
      localStorage.setItem(key,bad);localStorage.setItem('sa3d-save-owner','startup-owner');
      localStorage.setItem('sa3d-account',JSON.stringify({uid:'startup-owner',email:'startup@example.com'}));
      window.__startupHoldRead=order==='game-first';
    },[SAVE,broken,ordering]);
    let releaseGame;const gameGate=new Promise(r=>releaseGame=r);
    await page.route('**/*',async route=>{
      const url=route.request().url();
      if(url.includes('gstatic.com/firebasejs/'))return route.fulfill({contentType:'text/javascript',body:sdk[url.split('/').pop()]||'export {};'});
      if(ordering!=='game-first'&&/\/cow3d\.js/.test(url)){await gameGate;return route.continue();}
      return route.fallback();
    });
    await page.goto(h.base+'farm3d/?debug',{waitUntil:'commit'});
    await page.waitForFunction(()=>window.__startupReads>0,null,{timeout:30000});
    const before=await page.evaluate(()=>({ready:!!window.__ready,recover:localStorage.getItem('sa3d-recover'),raw:localStorage.getItem('sunny-acres-3d-v1')}));
    if(ordering==='game-first'){
      await page.waitForFunction(()=>window.__ready,null,{timeout:90000});
      assert.equal(await page.evaluate(()=>localStorage.getItem('sa3d-recover')),'1','recovery remains pending before the cloud answers');
      await page.evaluate(()=>window.__startupHoldRead=false);
    }else{
      assert.equal(before.ready,false,'cloud answer deliberately arrives before game startup');
      assert.equal(before.raw,broken,'the game has not consumed the damaged save');
      if(ordering==='sign-out')await page.evaluate(()=>window.saAuth.signOut());
    }
    results.push({ordering,before});
    releaseGame();
    await page.waitForFunction(()=>window.__ready&&window.__dbg,null,{timeout:90000});
    if(ordering!=='sign-out')await page.waitForFunction(()=>window.saAuth.user,null,{timeout:10000});
    // Readiness can precede the auth continuation by one task; await that continuation.
    await page.waitForTimeout(250);
    const after=await page.evaluate(()=>({recover:localStorage.getItem('sa3d-recover'),copy:localStorage.getItem('sunny-acres-3d-v1-unreadable'),level:__dbg.G.S.level}));
    results.push({ordering,after});
    fs.writeFileSync(path.join(artifacts,'recovery-startup.json'),JSON.stringify(results,null,2));
    assert.equal(after.copy,broken,'unreadable copy is preserved byte for byte');
    assert.equal(after.level,1,'fresh farm starts');
    assert.equal(after.recover,ordering==='sign-out'?'1':null,'missing-cloud decision is settled only for the still-signed-in account');
    await page.evaluate(()=>{__dbg.G.S.coins+=1;__dbg.G.commit();});
    if(ordering==='sign-out'){
      // Leaving the page asks the real upload() to run immediately; signed-out recovery must never write.
      await page.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
      await page.waitForTimeout(250);
      assert.equal(await page.evaluate(()=>window.__startupWrites?.length||0),0);
      assert.equal(await page.evaluate(()=>window.saAuth.user),null);
    }else{
    await page.waitForFunction(()=>window.__startupWrites?.some(w=>w.ref==='farms/startup-owner'),null,{timeout:20000});
    const writes=await page.evaluate(()=>window.__startupWrites.filter(w=>w.ref==='farms/startup-owner'));
    assert.ok(writes.every(w=>w.value.rev===1&&JSON.parse(w.value.save).level===1));
    }
    assert.deepEqual(s.errors,[]);
    console.log('PASS missing-cloud startup ordering:',ordering,'copy kept, account-safe recovery and uploads');
    await s.finish();
    }
    failed=false;
  } finally {await h.close(failed);}
})().catch(e=>{console.error(e);process.exitCode=1;});

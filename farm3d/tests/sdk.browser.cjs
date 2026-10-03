// Load the actual pinned browser builds, rather than mocking their exports.
// Real authentication/Firestore transactions remain covered by the hosted emulators.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
const sdk=path.resolve(__dirname,'../firebase/node_modules/firebase-browser');
const version=JSON.parse(fs.readFileSync(path.join(sdk,'package.json'),'utf8')).version;
const CDN=`https://www.gstatic.com/firebasejs/${version}/`;
(async()=>{
 const h=await start(),results=[];let failed=true;
 try{
  for(const blocked of [false,true]){
   const s=await h.setup({width:844,height:390},false,'sdk-'+(blocked?'storage-blocked':'normal')),p=s.page;
   if(blocked)await p.addInitScript(()=>{
    for(const name of ['getItem','setItem','removeItem'])Storage.prototype[name]=()=>{throw new DOMException('Storage unavailable','SecurityError');};
    IDBFactory.prototype.open=()=>{throw new DOMException('Storage unavailable','SecurityError');};
   });
   await p.route('**/*',route=>{const url=route.request().url();if(url.startsWith(CDN)){
    const name=url.slice(CDN.length).split('?')[0];assert.match(name,/^firebase-[a-z-]+\.js$/);
    return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(sdk,name),'utf8')});
   }return route.fallback();});
   await p.goto(h.base+'farm3d/players.html');await p.waitForSelector('#signin:not([hidden])',{timeout:30000});
   const state=await p.evaluate(async CDN=>{
    const [app,A,F,FN]=await Promise.all(['app','auth','firestore','functions'].map(m=>import(CDN+'firebase-'+m+'.js')));
    const instance=app.getApp(),auth=A.getAuth(instance);await auth.authStateReady();
    const db=F.getFirestore(instance,'default'),functions=FN.getFunctions(instance);
    return {version:app.SDK_VERSION,user:auth.currentUser,shared:auth.app===instance&&db.app===instance&&functions.app===instance,
      APIs:[A.createUserWithEmailAndPassword,A.signInWithEmailAndPassword,F.runTransaction,F.onSnapshot,F.getCountFromServer,FN.httpsCallable].every(f=>typeof f==='function')};
   },CDN);
   assert.equal(state.version,version);assert.equal(state.user,null);assert.equal(state.shared,true);assert.equal(state.APIs,true);assert.deepEqual(s.errors,[]);
   results.push({blocked,state});console.log('PASS actual SDK modules and owner sign-in boot',version,'storage blocked:',blocked);await s.finish();
  }failed=false;
 }finally{fs.writeFileSync(path.join(artifacts,'sdk-browser.json'),JSON.stringify(results,null,2));await h.close(failed);}
})().catch(e=>{console.error(e);process.exitCode=1;});

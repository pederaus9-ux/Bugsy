// Read-only source counterexample. This is not a browser or installed-worker run.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../../../..'),file='farm3d/tests/decor-catalog.browser.cjs';
const page=fs.readFileSync(path.join(root,'farm3d/index.html'),'utf8'),current=fs.readFileSync(path.join(root,file),'utf8');
const original=execFileSync('git',['show','f122b8e02ed6554efba8559ee2eb69f20b5ead9e:'+file],{cwd:root,encoding:'utf8'});
const guard=page.split('\n').find(x=>x.includes('location.protocol === "https:"')&&x.includes('serviceWorker.register'));
assert(guard);
const outcomes=[];
for(const protocol of ['http:','https:']){
 let calls=0;
 vm.runInNewContext(guard,{location:{protocol},qs:{has:()=>false},navigator:{serviceWorker:{register(){calls++;return Promise.resolve();}}}});
 assert.equal(calls,protocol==='http:'?0:1);outcomes.push({protocol,automaticRegisterCalls:calls});
}
const before=original.match(/await p\.evaluate\((async\(\)=>\{const r=await navigator\.serviceWorker\.getRegistration\(\);await navigator\.serviceWorker\.ready;[^\n]*?\})\);await p\.reload/)[1];
const explicit=current.match(/await p\.evaluate\((\(\)=>\{window\.__decorRegistrationError=null;[^\n]*?\})\);/)[1];
const predicate=current.match(/await p\.waitForFunction\((\(\)=>\{if\(window\.__decorRegistrationError\)[^\n]*?\}),null,\{timeout:90000\}\);/)[1];
// Execute the installed Playwright polling condition, not an invented async wait.
const playwright=fs.readFileSync(path.join(root,'farm3d/tests/node_modules/playwright-core/lib/coreBundle.js'),'utf8');
const poll=playwright.match(/const success = predicate\(\);\s*if \(success\) \{\s*fulfill\(success\);\s*return;\s*\}/)[0];
let premature=0;const asyncFalse=Promise.resolve(false);
vm.runInNewContext('(function(){'+poll+'})()',{predicate:()=>asyncFalse,fulfill(){premature++;}});
assert.equal(premature,1,'the actual Playwright poll considers a Promise truthy');
(async()=>{
 let registerCalls=0,readyReads=0,registration,oldResolved=false;
 const never=new Promise(()=>{}),worker={state:'activated'};
 const serviceWorker={controller:null,async getRegistration(){return registration;},register(){registerCalls++;registration={active:null,installing:worker,waiting:null};return Promise.resolve(registration);},get ready(){readyReads++;return never;}};
 const context={window:{},navigator:{serviceWorker},Error};
 vm.runInNewContext('('+before+')()',context).then(()=>oldResolved=true);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(registerCalls,0);assert.equal(readyReads,1);assert.equal(oldResolved,false);
 const blocked={registerCalls,readyReads,promiseResolved:oldResolved};
 assert.equal(vm.runInNewContext('('+predicate+')()',context),false);
 vm.runInNewContext('('+explicit+')()',context);
 assert.equal(registerCalls,1);assert.equal(vm.runInNewContext('('+predicate+')()',context),false,'register Promise is not activation');
 await Promise.resolve();assert.equal(vm.runInNewContext('('+predicate+')()',context),false,'installation is not activation');
 registration.active=worker;registration.installing=null;serviceWorker.controller=worker;
 const success=vm.runInNewContext('('+predicate+')()',context);assert.equal(typeof success,'boolean');assert.equal(success,true);
 assert.equal(await asyncFalse,false);
 console.log(JSON.stringify({kind:'SOURCE_VM_COUNTEREXAMPLE_NOT_NATIVE_BROWSER',automaticRegistration:outcomes,originalLocalhostSetup:blocked,playwrightPromiseHazard:{prematurePollSuccessCalls:premature,actualAwaitedValue:false},correctedSetup:{explicitRegisterCalls:registerCalls,waitsThroughRegistrationAndInstallation:true,predicateReturnsBoolean:true,controlledPredecessorObserved:true,waitDeadlineMs:90000},unchangedProduction:true},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});

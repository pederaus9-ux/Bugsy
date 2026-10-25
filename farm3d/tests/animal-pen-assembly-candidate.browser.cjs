// Read-only draft validation of bounded individual assembly locations in a full owned farm.
const fs=require('node:fs'),path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
const file=path.join(artifacts,'results.json');if(fs.existsSync(file))throw Error('Preserve assembly probe evidence');
const report={status:'RUNNING',scope:'real full-ownership draft validation; no Apply',candidates:[]};
let h,s,p;
(async()=>{try{
 h=await start({deviceScaleFactor:.5});s=await h.setup({width:844,height:390},false,'assembly-candidates');p=s.page;
 await p.addInitScript(()=>{Date.now=()=>1792594800000;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
 await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');
 await p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
 report.candidates=await p.evaluate(async()=>{const d=__dbg,G=d.G,t=Date.now(),{defaultSiteRecord}=await import('./animal-pen-layout.js?v=1');G.close();G.S.tut=99;G.S.level=20;G.S.coins=9000;G.S.barnCap=1500;G.S.event=null;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;for(const[k,n]of[['chicken',30],['cow',5],['horse',4],['sheep',5]])G.S.pens[k]={...(G.S.pens[k]||{}),owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:k+' Probe '+i,love:50,loveAt:t}))};G.S.pets=[{kind:'dog',name:'Buddy',love:60,loveAt:t},{kind:'cat',name:'Whiskers',love:60,loveAt:t}];G.view.refresh('all');if(!G.save())throw Error('setup save refused');const e=d.penEditor,results=[];for(const to of [[3,-11],[2,-10],[1,-11]]){if(!e.begin('dog'))throw Error('dog editor refused');const before=structuredClone(e.snapshot().draft.sites.dog??defaultSiteRecord('dog')),dispatched=e.dispatch({type:'moveStructure',kind:'dog',id:'nook',to}),valid=dispatched&&await e.validateNow(),snapshot=e.snapshot();results.push({to,before:before.structures.nook,after:snapshot.draft.sites.dog.structures.nook,dispatched,valid,reason:snapshot.reason,issues:snapshot.validation?.issues?.slice(0,4),boundaryUnchanged:JSON.stringify(before.boundary)===JSON.stringify(snapshot.draft.sites.dog.boundary),animals:d.animals.length});e.cancel();}return results;});
 report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error.stack||error);report.errors=s?.errors;}finally{fs.writeFileSync(file,JSON.stringify(report,null,2));if(s)await s.finish(report.status!=='PASS');if(h)await h.close();console.log(JSON.stringify({status:report.status,file,candidates:report.candidates}));process.exitCode=report.status==='PASS'?0:1;}})();

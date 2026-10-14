// Focused reproduction of the hidden ambient loop, not a repeated full suite.
// No synthetic visibility getters/events: actual browser target activation only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {start,wait}=require('./qualification-cdp.cjs');
const source='d8aed9ebb78b6a4acb215be89e28435f32319f4f',out=path.resolve(process.env.TEST_ARTIFACTS||path.join(__dirname,'artifacts','qualification-audio-background'));
let h;const receipt={source,startedAtUtc:new Date().toISOString(),status:'BLOCKED',phases:{},limits:'Actual browser tab visibility; native audio graph/PCM, headless Chrome; not phone speaker or audible quality evidence.'};
async function measure(count,ms){const data=[];for(let i=0;i<count;i++){data.push(await h.cdp.evaluate('__audioProbe.sample()'));await wait(ms);}return data;}
const max=data=>Math.max(...data.map(s=>s.rms));
async function clickSound(){await h.cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:16,y:17});await h.cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:16,y:17});}
(async()=>{try{
 h=await start(out,source);await h.cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:fs.readFileSync(path.join(__dirname,'audio-native-probe.js'),'utf8')});
 await h.cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`if(!sessionStorage.getItem('__backgroundSeed')){localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');localStorage.setItem('sunny-acres-3d-v1-sound',JSON.stringify({on:true,music:false,amb:true,buzz:false}));sessionStorage.setItem('__backgroundSeed','1');}`});
 await h.boot();await h.cdp.evaluate(`__dbg.G.S.tut=99;__dbg.G.S.nextEventAt=9e15;__dbg.G.S.nextRushAt=9e15;__dbg.G.S.nextVisitorAt=9e15;__dbg.G.close();__dbg.setPreset('rain');`);
 // Canvas gesture creates native AudioContext without changing sound preferences.
 await h.cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:600,y:350});await h.cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:600,y:350});await h.cdp.until(`__audioProbe.contexts[0]?.context.state==='running'`);await h.cdp.evaluate(`__audioProbe.tap()`);await wait(3000);
 receipt.phases.visible=await measure(6,100);assert(max(receipt.phases.visible)>1e-4,'rain/wind output positive control');
 const {targetId}=await h.cdp.send('Target.createTarget',{url:'about:blank',background:false});await h.cdp.send('Target.activateTarget',{targetId});await h.cdp.until('document.hidden');
 await wait(2000);receipt.phases.hidden=await measure(20,500);receipt.hiddenGraph=await h.cdp.evaluate('__audioProbe.snapshot()');
 assert(receipt.phases.hidden.every(s=>s.hidden&&s.state==='running'),'real hidden context remains running');assert(receipt.phases.hidden.at(-1).audioTime-receipt.phases.hidden[0].audioTime>8,'native audio clock advances during background');
 assert(receipt.hiddenGraph.lifecycle.some(e=>e.trusted&&e.hidden),'trusted native visibility evidence');
 await h.cdp.send('Page.bringToFront');await h.cdp.until('!document.hidden');await wait(1000);receipt.phases.returned=await measure(5,100);assert(max(receipt.phases.returned)>1e-4,'output on actual foreground return');
 // Separate measured zero-output control using the game's persisted master mute.
 await h.cdp.evaluate('__dbg.G.close()');await wait(500);
 const position=await h.cdp.evaluate(`(()=>{const el=document.querySelector('#soundBtn'),r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);if(hit?.closest('#soundBtn')!==el)throw Error('Mute control obstructed by '+hit?.outerHTML.slice(0,150));return{x,y};})()`);
 await h.cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...position});await h.cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...position});assert.equal(await h.cdp.evaluate('__dbg.G.snd.on'),false);
 await h.cdp.send('Target.activateTarget',{targetId});await h.cdp.until('document.hidden');await wait(1000);receipt.phases.hiddenMuted=await measure(5,100);assert(max(receipt.phases.hiddenMuted)<1e-6,'muted hidden positive silence control');
 receipt.lifecycle=await h.cdp.evaluate('__audioProbe.snapshot().lifecycle');receipt.backgroundRange={min:Math.min(...receipt.phases.hidden.map(s=>s.rms)),max:max(receipt.phases.hidden)};
 receipt.confirmedDefect=receipt.phases.hidden.every(s=>s.rms>1e-4);assert(receipt.confirmedDefect,'sustained hidden output reproduced');receipt.status='FAIL_CONFIRMED_BACKGROUND_OUTPUT';await h.cdp.send('Page.bringToFront');await h.cdp.send('Target.closeTarget',{targetId});await h.cdp.screenshot(path.join(out,'reproduced-after-mute.png'));console.log(JSON.stringify({status:receipt.status,range:receipt.backgroundRange,hiddenSamples:receipt.phases.hidden.length,mutedMax:max(receipt.phases.hiddenMuted),trustedTransitions:receipt.lifecycle}));process.exitCode=1;
}catch(e){receipt.error=e.stack;console.error(e.stack);process.exitCode=1;}
finally{if(h)await h.close();receipt.finishedAtUtc=new Date().toISOString();receipt.helperSha256=crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(receipt,null,2));}})();

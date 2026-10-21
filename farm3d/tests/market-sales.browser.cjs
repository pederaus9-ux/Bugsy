// Disposable farms only; no external services or owner browser profiles.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {start,artifacts,root}=require('./browser-harness.cjs');
const {updateWorker}=require('./worker-transition.cjs');
const BASE='2bf6f16a0d0b965df1eda089a3ea6a0f140f6f69',WINDOW=21600000,NOW=1792454400000;
const out=path.join(artifacts,'market-sales');fs.mkdirSync(out,{recursive:true});
const receipt={status:'RUNNING',base:BASE,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),drawingScale:1,physicalDevice:false,results:[],captures:[]};
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(receipt,null,2));
const pass=(name,details)=>{receipt.results.push({name,details});save();console.log('PASS',name);};
const press=(p,selector,touch)=>touch?p.locator(selector).tap():p.locator(selector).click();
const state=p=>p.evaluate(()=>{const G=__dbg.G;return {coins:G.S.coins,earned:G.S.stats.earned,egg:G.have('egg'),milk:G.have('milk'),goldEgg:G.goldOf('egg'),goldMilk:G.goldOf('milk')};});
async function photo(p,name){await p.screenshot({path:path.join(out,name+'.png')});receipt.captures.push(name+'.png');save();}
async function ready(p){await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});if(await p.locator('#authGuest').isVisible())await p.locator('#authGuest').click();await p.evaluate(()=>{const G=__dbg.G;G.close();G.opts.quiet=true;G.S.tut=99;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;G.S.event=null;});}
async function boot(p,base,sandbox){await p.addInitScript(now=>{window.__marketNow=now;Date.now=()=>window.__marketNow;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');},NOW);await p.goto(base+'farm3d/?debug&portrait&preset=noon'+(sandbox?'&testfarm':''));await ready(p);}
async function open(p,touch){await press(p,'.dock [data-p="barn"]',touch);await press(p,'.panel [data-p="marketSales"]',touch);await p.waitForFunction(()=>__dbg.G.panel?.type==='marketSales');}
let h,failed=true,stage='launch';save();
(async()=>{try{
 h=await start({serviceWorkers:'allow',deviceScaleFactor:1});
 // Counterexample for the first observer: the existing close button intentionally
 // projects outside .panel. Its scrollWidth is not the scrollable content width.
 // Use the unchanged production CSS to prove that distinction before game tests.
 {
  const s=await h.setup({width:390,height:844},true,'market-sales-fit-counterexample'),p=s.page;
  const css=fs.readFileSync(path.join(root,'farm3d/index.html'),'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
  await p.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><div class="scrim"><div class="panel"><button class="xbtn">×</button><div class="pbody">Existing dialog</div></div></div>');
  await p.waitForFunction(()=>[...document.querySelector('.panel').getAnimations()].every(a=>a.playState==='finished'));
  const fit=await p.evaluate(()=>{const panel=document.querySelector('.panel'),body=document.querySelector('.pbody'),close=document.querySelector('.xbtn'),r=panel.getBoundingClientRect(),b=close.getBoundingClientRect();return {rootScroll:panel.scrollWidth,rootClient:panel.clientWidth,bodyScroll:body.scrollWidth,bodyClient:body.clientWidth,panelRight:r.right,closeRight:b.right};});
  assert(fit.rootScroll>fit.rootClient+1,'original observer counts the intentional close-button overhang');
  assert.equal(fit.bodyScroll,fit.bodyClient);assert(fit.closeRight<=390&&fit.closeRight>fit.panelRight);
  pass('unchanged production CSS proves root scrollWidth misclassifies the intentional close-button overhang',fit);await s.finish();
 }
 for(const [width,height,touch]of [[390,844,true],[844,390,true],[1280,720,false]]){
  stage='native sales '+width;const s=await h.setup({width,height},touch,'market-sales-'+width),p=s.page;await boot(p,h.base,true);
  // Use an explicitly completed season track to isolate exact sale proceeds.
  // market-sales.test.mjs separately proves the existing first60-coin prize.
  await p.evaluate(()=>{const G=__dbg.G;G.S.barn={egg:29,milk:7,wheat:3};G.S.gold={egg:5,milk:2};G.S.coins=1000;G.S.stats.earned=0;G.S.perks.sell=0;Object.assign(G.seasonNow(),{pts:1400,won:10});});
  await open(p,touch);const q=await p.evaluate(()=>__dbg.G.marketSalesQuote('egg',1));
  await press(p,'[aria-label="More dozens"]',touch);const two=await p.evaluate(()=>__dbg.G.marketSalesQuote('egg',2));
  assert((await p.locator('[data-market-total="egg"]').textContent()).includes(String(two.total)));
  await p.waitForFunction(()=>[...document.querySelector('.panel').getAnimations()].every(a=>a.playState==='finished'),null,{timeout:30000});
  const bounds=await p.locator('.panel').evaluate(el=>{const r=el.getBoundingClientRect(),body=el.querySelector('.pbody'),close=el.querySelector('.xbtn').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,overflow:body.scrollWidth>body.clientWidth+1,bodyScroll:body.scrollWidth,bodyClient:body.clientWidth,rootScroll:el.scrollWidth,rootClient:el.clientWidth,closeRight:close.right};});
  receipt.layout=bounds;save();
  assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.w<=width+1&&bounds.y+bounds.h<=height+1&&!bounds.overflow);
  const targets=await p.locator('[data-act="marketQty"],[data-act="marketSell"]').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};}));assert(targets.every(r=>r.width>=44&&r.height>=44));
  await photo(p,'market-sales-'+width);pass(width+' responsive native controls and exact gold-inclusive quote',{bounds,targets,quote:two});
  await press(p,'[data-act="marketSell"][data-id="egg"][data-n="2"].gold',touch);
  const afterEgg=await state(p);assert.deepEqual(afterEgg,{coins:1000+two.total,earned:two.total,egg:5,milk:7,goldEgg:0,goldMilk:2});
  const replay=await p.evaluate(q=>__dbg.G.sellMarketGoods(q.id,q.lots,q.revision),two);assert.equal(replay,false);assert.deepEqual(await state(p),afterEgg);
  assert.equal(await p.locator('[data-act="marketSell"][data-id="egg"].gold').isDisabled(),true);
  pass(width+' actual egg sale keeps five leftovers and rejects duplicate confirmation',afterEgg);
  const milk=await p.evaluate(()=>__dbg.G.marketSalesQuote('milk',7));await press(p,'[data-act="marketSell"][data-id="milk"].plain',touch);
  const afterMilk=await state(p);assert.equal(afterMilk.coins,afterEgg.coins+milk.total);assert.equal(afterMilk.milk,0);assert.equal(afterMilk.goldMilk,0);assert.equal(afterMilk.egg,5);
  await press(p,'.panel .xbtn',touch);await open(p,touch);assert.equal((await p.evaluate(()=>__dbg.G.marketSalesQuote('egg',1))).rate,q.rate);
  pass(width+' milk Sell All and same-window reopen preserve prices',afterMilk);
  const expired=await p.evaluate(windowMs=>{const G=__dbg.G;G.S.barn.milk=3;const old=G.marketSalesQuote('milk',1),before=G.S.coins;window.__marketNow+=windowMs;const rejected=!G.sellMarketGoods('milk',1,old.revision);G.tick();return {rejected,before,after:G.S.coins,old,newQuote:G.marketSalesQuote('milk',1)};},WINDOW);
  assert(expired.rejected);assert.equal(expired.after,expired.before);assert.equal(expired.newQuote.windowId,expired.old.windowId+1);pass(width+' price boundary rejects stale payout and refreshes visible quote',expired);
  assert.equal(await p.evaluate(()=>localStorage.getItem(__dbg.G.SAVE_KEY)),null);assert.deepEqual(s.errors,[]);await s.finish();
 }
 stage='old installed farm';h.serveRef(BASE);const s=await h.setup({width:844,height:390},true,'market-sales-installed'),p=s.page;await boot(p,h.base,false);
 await p.evaluate(()=>{const G=__dbg.G;G.S.barn={egg:29,milk:7,wheat:3,chicken_feed:30};G.S.gold={egg:5,milk:2};G.S.coins=777;Object.assign(G.seasonNow(),{pts:1400,won:10});G.S.pens.chicken={owned:true,list:Array(30).fill(0),meta:Array.from({length:30},(_,i)=>({name:'Hen '+i,love:50,loveAt:Date.now()}))};G.save();});
 const old=await p.evaluate(()=>{const G=__dbg.G;return {barn:{...G.S.barn},gold:{...G.S.gold},pens:G.S.pens,decor:G.S.decor,plots:G.S.plots,buildings:G.S.buildings,coins:G.S.coins};});
 await p.evaluate(async()=>{await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 assert.equal(await p.evaluate(async()=>(await caches.keys()).includes('sa3d-v49')),true);h.serveRef(null);
 stage='candidate worker';const transition=await updateWorker(p);assert(transition.requestedWorkerControls);const hashes=await p.evaluate(async()=>{const c=await caches.open('sa3d-v60'),out={};for(const f of ['market-sales.js?v=1','game.js?v=30']){const r=await c.match(new URL(f,location.href));if(!r)throw Error('missing cached '+f);out[f]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');}return out;});for(const [file,hash]of Object.entries(hashes))assert.equal(hash,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'farm3d',file.split('?')[0]))).digest('hex'));
 await p.reload();await ready(p);assert.equal(await p.evaluate(()=>window.__gameVer),30);
 const current=await p.evaluate(()=>{const G=__dbg.G;return {barn:{...G.S.barn},gold:{...G.S.gold},pens:G.S.pens,decor:G.S.decor,plots:G.S.plots,buildings:G.S.buildings,coins:G.S.coins};});assert.deepEqual(current,old);pass('installed49→52 update preserves old inventory, gold,30 birds and farm exactly',{transition,hashes});
 await open(p,true);const q=await p.evaluate(()=>__dbg.G.marketSalesQuote('egg',1));await press(p,'[data-act="marketSell"][data-id="egg"].gold',true);const paid=await state(p);assert.equal(paid.coins,777+q.total);assert.equal(paid.egg,17);
 const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem(__dbg.G.SAVE_KEY)));assert.equal(saved.v,1);assert.equal(saved.pens.chicken.list.length,30);assert.equal(saved.marketSales,undefined);assert.equal(saved.market,undefined);assert.deepEqual(saved.pens,old.pens);assert.deepEqual(saved.decor,old.decor);
 stage='offline reopen and sale';await s.context.setOffline(true);await p.reload();await ready(p);assert.deepEqual(await state(p),paid);await open(p,true);const offlineQuote=await p.evaluate(()=>__dbg.G.marketSalesQuote('milk',1));await press(p,'[data-act="marketSell"][data-id="milk"].gold',true);const offlinePaid=await state(p);assert.equal(offlinePaid.coins,paid.coins+offlineQuote.total);assert.equal(offlinePaid.milk,6);await photo(p,'market-sales-offline');
 await p.reload();await ready(p);assert.deepEqual(await state(p),offlinePaid);assert.equal(await p.evaluate(()=>__dbg.G.marketSalesQuote('milk',1).rate),offlineQuote.rate);pass('normal guest sale, full offline reboot, offline sale and second reload keep exact stock and coins',{paid,offlinePaid});assert.deepEqual(s.errors,[]);await s.finish();
 failed=false;receipt.status='PASS';save();
}catch(error){receipt.status='FAIL';receipt.stage=stage;receipt.error=String(error.stack||error);save();throw error;}finally{if(h)await h.close(failed);}})().catch(error=>{console.error(error);process.exitCode=1;});

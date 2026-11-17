'use strict';
// Supplemental current A52 journey. Run only inside the reviewed, verified
// no-egress CI boundary. The opt-in flag itself grants no permission.
// Current A52 only: fresh synthetic testfarm, no historical ref, account, import,
// download, permissions, save qualification or claim that a dialog pauses the world.
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
function observeOriginalControls(){
  // Deferred modules may run before DOMContentLoaded. Mutation records retain
  // the original host even if their removed button is already in a dialog.
  const probe=window.__a52Journey={nodes:[],hosts:[],duplicate:false,events:[],keys:[]};
  window.addEventListener('keydown',e=>probe.keys.push(['down',e.code]));
  window.addEventListener('keyup',e=>probe.keys.push(['up',e.code]));
  const expected=new Map([
    ...['walkBtn','editBtn','questBtn','photoBtn','soundBtn','friendsBtn','verifiedBtn','settings'].map(k=>[k,'.side']),
    ...['orders','barn','decor','shop'].map(k=>[k,'.dock'])
  ]),captured=new Map();
  function remember(host,b){
    if(!host.matches?.('.side,.dock')||b.nodeType!==1||!b.matches('button'))return;
    const key=b.id||b.dataset.p,origin=host.classList.contains('side')?'.side':'.dock';
    if(expected.get(key)!==origin)return;
    if(captured.has(key)){if(captured.get(key).node!==b)probe.duplicate=true;return;}
    captured.set(key,{node:b,origin});
    b.addEventListener('click',e=>probe.events.push({key,open:!!b.closest('dialog')?.open,trusted:e.isTrusted}));
  }
  function scan(node){
    if(node.matches?.('.side,.dock'))for(const b of node.children)remember(node,b);
    for(const host of node.querySelectorAll?.('.side,.dock')||[])for(const b of host.children)remember(host,b);
  }
  function publish(){
    probe.nodes=[...captured.values()].map(v=>v.node);probe.hosts=[...captured.values()].map(v=>v.origin);
    if(captured.size===expected.size)observer.disconnect();
  }
  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of [...record.addedNodes,...record.removedNodes])remember(record.target,node);
      for(const node of record.addedNodes)scan(node);
    }
    publish();
  });
  observer.observe(document,{childList:true,subtree:true});scan(document);publish();
}
function keyboardObservation(id){
  const dialog=document.getElementById(id),active=document.activeElement;
  return {inMenu:active?.closest('dialog')?.id===id,documentFocused:document.hasFocus(),
    bodyActive:active===document.body,rootActive:active===document.documentElement,
    launcherActive:active===document.getElementById(id.replace('-menu','-launch')),
    dialogOpen:!!dialog?.open,focusableCount:[...dialog.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length).length};
}
function finiteKeyboard(side,phase,direction=0,iteration=0,observation=null){
  const phases=['reveal','fit','expanded','tab-input','tab-check','key-read','key-down','key-up','key-check','complete','escape-input','escape-check','escape-focus','close-reveal','close-input','close-check','close-focus','capture-reveal','capture-escape-input','capture-escape-check','backdrop-reveal','backdrop-input','backdrop-check','backdrop-focus','dismiss-complete','nav-input','nav-route','nav-count-host','nav-count-launcher','nav-count-dialog','nav-count-target','nav-ready','nav-controls','nav-parent','nav-open-read','nav-key-focus','nav-key-press','nav-click','nav-tap','nav-open-check','nav-expanded','nav-dialog-visible','nav-target-visible','nav-complete'];
  if(![1,2].includes(side)||!phases.includes(phase)||![0,1,2].includes(direction)||!Number.isInteger(iteration)||iteration<0||iteration>14)throw Error('Invalid finite keyboard observation');
  const out={schema:1,side,phase,direction,iteration,observed:observation!==null};
  for(const key of ['inMenu','documentFocused','bodyActive','rootActive','launcherActive','dialogOpen']){
    if(observation!==null&&typeof observation[key]!=='boolean')throw Error('Invalid finite keyboard boolean');
    out[key]=observation===null?false:observation[key];
  }
  out.focusableCount=observation===null?0:observation.focusableCount;
  if(!Number.isInteger(out.focusableCount)||out.focusableCount<0||out.focusableCount>32)throw Error('Invalid finite keyboard count');
  for(const key of ['keyDownCount','keyUpCount']){out[key]=observation?.[key]??0;if(!Number.isInteger(out[key])||out[key]<0||out[key]>32)throw Error('Invalid finite key count');}
  return out;
}
async function main(){
  // This explicit opt-in is an accident guard, NOT an authorization mechanism.
  assert.equal(process.env.A52_CURRENT_BROWSER_APPROVED,'1','Obtain applicable execution approval first; then explicitly opt in');
  const {start,artifacts}=require('./browser-harness.cjs');
  const {revealCornerAction,observeCornerNavigation}=require('./helpers/a52-browser-navigation.cjs');
  const progress={schema:1,status:'running',stage:'harness',viewport:0,completedViewports:0};
  const mark=stage=>{progress.stage=stage;fs.writeFileSync(path.join(artifacts,'a52-native-progress.json'),JSON.stringify(progress)+'\n');};
  mark('harness');let h,failed=true;
  try {
    h=await start({serviceWorkers:'block',deviceScaleFactor:1});
    for(const [width,height,touch] of [[1280,720,false],[320,568,true],[390,844,true],[844,390,true]]){
      progress.viewport++;mark('boot');
      const s=await h.setup({width,height},touch,'a52-corner-menus-'+width+'x'+height);
      const p=s.page;p.setDefaultTimeout(15000);p.setDefaultNavigationTimeout(45000);
      let sessionFailed=true;
      try {
        // Passive original-node observation only. Never replace listeners, invoke
        // synthetic actions, change game state or wrap game functions.
        await p.addInitScript(observeOriginalControls);
        await p.goto(h.base+'farm3d/?testfarm&debug&portrait&preset=noon');
        await p.waitForFunction(()=>window.__ready&&window.__dbg&&document.querySelectorAll('[data-menu-ready="true"]').length===2,null,{timeout:90000});
        await p.locator('#loading').waitFor({state:'hidden',timeout:45000});
        const intro=p.locator('#intro');if(await intro.isVisible())await intro[touch?'tap':'click']();
        mark('original-controls');
        assert.equal(await p.evaluate(()=>new URLSearchParams(location.search).has('testfarm')),true);
        assert.equal(await p.locator('#feedbackBtn').count(),0);
        assert.deepEqual(await p.evaluate(()=>({
          count:__a52Journey.nodes.length,
          same:!__a52Journey.duplicate&&__a52Journey.nodes.every((b,i)=>b.isConnected&&b.closest('dialog.preview-menu')&&
            (b.id?document.getElementById(b.id)===b:document.querySelector(__a52Journey.hosts[i]+' [data-p="'+b.dataset.p+'"]')===b)),
          hidden:document.getElementById('verifiedBtn').hidden
        })),{count:12,same:true,hidden:true});
        const native=async selector=>p.locator(selector)[touch?'tap':'click']();
        const closed=async()=>assert.equal(await p.locator('dialog.preview-menu[open]').count(),0);
        await require('./helpers/a52-native-event-setup.cjs').settleSandboxEvent(p,touch?'tap':'click');
        await closed();
        assert.equal(await p.locator('.side button:visible,.dock button:visible').count(),2);
        async function fit(id){
          const result=await p.locator('#'+id).evaluate(d=>{
            const rect=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
            return {box:rect(d.getBoundingClientRect()),vw:innerWidth,vh:innerHeight,
              overflow:d.scrollWidth>d.clientWidth+1,
              buttons:[...d.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>rect(b.getBoundingClientRect()))};
          });
          const r=result.box;assert(r.x>=-1&&r.y>=-1&&r.x+r.width<=result.vw+1&&r.y+r.height<=result.vh+1,'Dialog fits viewport');
          assert.equal(result.overflow,false,'No horizontal dialog overflow');
          for(const b of result.buttons)assert(b.width>=44&&b.height>=44,'At least 44px action targets');
          // Scrolled content may start outside the visible scrollport. Each action
          // must become visible through native Playwright scrolling before use.
        }
        for(const [side,target]of [['tools','#walkBtn'],['barn','[data-p="shop"]']]){
          const id='preview-'+side+'-menu',launch='#preview-'+side+'-launch';mark(side+'-keyboard');
          const record=(phase,direction=0,iteration=0,observation=null)=>fs.writeFileSync(path.join(artifacts,'a52-native-keyboard.json'),JSON.stringify(finiteKeyboard(side==='tools'?1:2,phase,direction,iteration,observation))+'\n');
          const stopNavigationObservation=observeCornerNavigation(p,phase=>record(phase),hit=>fs.writeFileSync(path.join(artifacts,'a52-native-hit.json'),JSON.stringify({schema:1,side:side==='tools'?1:2,...hit})+'\n'));
          record('reveal');await revealCornerAction(p,target,'keyboard');record('fit');await fit(id);
          record('expanded');
          assert.equal(await p.locator(launch).getAttribute('aria-expanded'),'true');
          for(const key of ['Tab','Shift+Tab'])for(let i=0;i<14;i++){
            record('tab-input',key==='Tab'?1:2,i+1);await p.keyboard.press(key);
            record('tab-check',key==='Tab'?1:2,i+1,await p.evaluate(keyboardObservation,id));
            assert.equal(await p.evaluate(id=>document.activeElement?.closest('dialog')?.id===id,id),true,'Native tab focus stays in menu');
          }
          record('key-read');const keyStart=await p.evaluate(()=>__a52Journey.keys.length);
          record('key-down');await p.keyboard.down('w');record('key-up');await p.keyboard.up('w');
          record('key-check',0,0,{...await p.evaluate(keyboardObservation,id),...await p.evaluate(n=>({keyDownCount:__a52Journey.keys.slice(n).filter(x=>x[1]==='KeyW'&&x[0]==='down').length,keyUpCount:__a52Journey.keys.slice(n).filter(x=>x[1]==='KeyW'&&x[0]==='up').length}),keyStart)});
          assert.deepEqual(await p.evaluate(n=>__a52Journey.keys.slice(n).filter(x=>x[1]==='KeyW'),keyStart),[['up','KeyW']],
            'Menu blocks command keydown but permits native key-release cleanup; not a simulation-pause assertion');
          record('complete');mark(side+'-dismiss');
          record('escape-input');await p.keyboard.press('Escape');
          record('escape-check',0,0,await p.evaluate(keyboardObservation,id));await closed();
          record('escape-focus',0,0,await p.evaluate(keyboardObservation,id));
          assert.equal(await p.locator(launch).evaluate(e=>e===document.activeElement),true,'Escape returns launcher focus');
          record('close-reveal');await revealCornerAction(p,target,touch?'tap':'click');
          record('close-input');await native('#'+id+' .preview-menu-close');
          record('close-check',0,0,await p.evaluate(keyboardObservation,id));await closed();
          record('close-focus',0,0,await p.evaluate(keyboardObservation,id));
          assert.equal(await p.locator(launch).evaluate(e=>e===document.activeElement),true,'Close button returns launcher focus');
          record('capture-reveal');await revealCornerAction(p,target,touch?'tap':'click');
          mark(side+'-capture');await p.screenshot({path:path.join(artifacts,'a52-'+side+'-'+width+'x'+height+'.png')});
          record('capture-escape-input');await p.keyboard.press('Escape');
          record('capture-escape-check',0,0,await p.evaluate(keyboardObservation,id));await closed();
          record('backdrop-reveal');await revealCornerAction(p,target,touch?'tap':'click');
          // Dialog CSS leaves a >=12px viewport gutter, so (1,1) is backdrop.
          record('backdrop-input');if(touch)await p.touchscreen.tap(1,1);else await p.mouse.click(1,1);
          record('backdrop-check',0,0,await p.evaluate(keyboardObservation,id));await closed();
          record('backdrop-focus',0,0,await p.evaluate(keyboardObservation,id));
          assert.equal(await p.locator(launch).evaluate(e=>e===document.activeElement),true,'Backdrop dismissal returns launcher focus');
          record('dismiss-complete');stopNavigationObservation();
        }
        async function select(selector,key){
          await revealCornerAction(p,selector,touch?'tap':'click');
          const count=await p.evaluate(()=>__a52Journey.events.length);
          await native(selector);await closed();
          assert.deepEqual(await p.evaluate(n=>__a52Journey.events.slice(n),count),[{key,open:false,trusted:true}],
            'One trusted original-node event, after capture-phase dialog close');
        }
        // Bounded real handlers: no buying, restore, account, share, photo capture,
        // sound permissions or simulated gameplay mutations.
        for(const [selector,key,panel]of [
          ['[data-p="settings"]','settings','settings'],['#questBtn','questBtn','quests'],
          ['.dock [data-p="orders"]','orders','orders'],['.dock [data-p="barn"]','barn','barn'],
          ['.dock [data-p="decor"]','decor','decor'],['.dock [data-p="shop"]','shop','shop']]){
          mark('panel-'+panel);await select(selector,key);
          await p.waitForFunction(type=>window.__dbg.G.panel?.type===type,panel);
          await p.locator('#panelRoot .panel').waitFor({state:'visible'});
          await native('#panelRoot .xbtn');await p.waitForFunction(()=>!window.__dbg.G.panel);
        }
        for(const [selector,key,mode,exit]of [
          ['#walkBtn','walkBtn','walking','#walkBar [data-mode="walk"]'],
          ['#editBtn','editBtn','editing','#editBar [data-mode="edit"]'],
          ['#photoBtn','photoBtn','photo','#photoBar [data-p="close"]']]){
          mark('mode-'+mode);mark('mode-'+mode+'-select');await select(selector,key);mark('mode-'+mode+'-enter-wait');await p.waitForFunction(name=>document.body.classList.contains(name),mode);
          mark('mode-'+mode+'-exit-action');fs.writeFileSync(path.join(artifacts,'a52-mode-hit.json'),JSON.stringify({schema:1,mode,snapshot:await require('./helpers/a52-native-hit.cjs').observeLauncherHit(p.locator(exit))})+'\n');await native(exit);mark('mode-'+mode+'-exit-wait');await p.waitForFunction(name=>!document.body.classList.contains(name),mode);
        }
        await closed();assert.equal(await p.locator('.side button:visible,.dock button:visible').count(),2);
        assert.deepEqual(s.errors,[],'No native page/resource errors');
        sessionFailed=false;progress.completedViewports++;mark('viewport-complete');
      } finally {await s.finish(sessionFailed);}
    }
    failed=false;
  } finally {
    try{if(h)await h.close(failed);}catch(error){failed=true;throw error;}
    finally{progress.status=failed?'failed':'passed';mark(progress.stage);}
  }
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});

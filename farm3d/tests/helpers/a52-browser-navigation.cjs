'use strict';
// Current A52 journeys only. Historical phases must keep their explicit old path.
// This helper neither launches a browser nor grants permission to run one.
const assert=require('node:assert/strict');
const routes=new Map();
// Optional passive finite-step observer used only by diagnostic journeys.
const observers=new WeakMap();
const hitObservers=new WeakMap();
const {observeLauncherHit}=require('./a52-native-hit.cjs');
function observeCornerNavigation(page,onStep,onHit){
 if(typeof onStep!=='function')throw new TypeError('Navigation observer must be a function');
 if(onHit!==undefined&&typeof onHit!=='function')throw new TypeError('Hit observer must be a function');
 observers.set(page,onStep);if(onHit)hitObservers.set(page,onHit);return ()=>{observers.delete(page);hitObservers.delete(page);};
}
for(const selector of ['#walkBtn','#editBtn','#questBtn','#photoBtn','#soundBtn','#friendsBtn','#verifiedBtn'])routes.set(selector,'tools');
for(const name of ['settings','orders','barn','decor','shop']){
 const side=name==='settings'?'tools':'barn';
 routes.set('[data-p="'+name+'"]',side);
 routes.set('[data-act="open"][data-p="'+name+'"]',side);
 if(side==='barn')routes.set('.dock [data-p="'+name+'"]',side);
}
async function revealCornerAction(page,selector,input='click'){
 const step=observers.get(page)||(()=>{});step('nav-input');
 assert(['click','tap','keyboard'].includes(input),'Unsupported A52 launcher input');
 step('nav-route');const side=routes.get(selector);assert(side,'Not an A52 corner action: '+selector);
 const dialogId='preview-'+side+'-menu';
 const host=page.locator(side==='tools'?'.side':'.dock'),launcher=page.locator('#preview-'+side+'-launch');
 const dialog=page.locator('#'+dialogId),target=page.locator(selector);
 for(const [name,locator]of [['host',host],['launcher',launcher],['dialog',dialog],['target',target]]){step('nav-count-'+name);assert.equal(await locator.count(),1,'Exactly one A52 '+name);}
 step('nav-ready');assert.equal(await host.getAttribute('data-menu-ready'),'true','Current source must install A52 menus');
 step('nav-controls');assert.equal(await launcher.getAttribute('aria-controls'),dialogId,'Launcher controls correct menu');
 step('nav-parent');assert.equal(await target.evaluate(el=>el.closest('dialog')?.id),dialogId,'Original target belongs to expected menu');
 step('nav-open-read');if(await dialog.getAttribute('open')===null){
  if(input==='keyboard'){step('nav-key-focus');await launcher.focus();step('nav-key-press');await page.keyboard.press('Enter');}
  else {step(input==='click'?'nav-click':'nav-tap');
   const onHit=hitObservers.get(page);let before=null;
   if(onHit&&input==='click'){before=await observeLauncherHit(launcher);onHit({before,rejected:null});}
   try {await launcher[input]();}catch(error){
    if(onHit&&input==='click'){try{onHit({before,rejected:await observeLauncherHit(launcher)});}catch{ /* Preserve original native failure. */ }}
    throw error;
   }
  }
 }
 step('nav-open-check');assert.notEqual(await dialog.getAttribute('open'),null,'Native activation opened the menu');
 step('nav-expanded');assert.equal(await launcher.getAttribute('aria-expanded'),'true','Launcher reflects open menu');
 step('nav-dialog-visible');await dialog.waitFor({state:'visible'});
 step('nav-target-visible');await target.waitFor({state:'visible'});
 step('nav-complete');
 // Caller retains the original native action, options, assertions and timeouts.
}
module.exports={revealCornerAction,observeCornerNavigation};

'use strict';
// Current A52 journeys only. Historical phases must keep their explicit old path.
// This helper neither launches a browser nor grants permission to run one.
const assert=require('node:assert/strict');
const routes=new Map();
for(const selector of ['#walkBtn','#editBtn','#questBtn','#photoBtn','#soundBtn','#friendsBtn','#verifiedBtn'])routes.set(selector,'tools');
for(const name of ['settings','orders','barn','decor','shop']){
 const side=name==='settings'?'tools':'barn';
 routes.set('[data-p="'+name+'"]',side);
 routes.set('[data-act="open"][data-p="'+name+'"]',side);
 if(side==='barn')routes.set('.dock [data-p="'+name+'"]',side);
}
async function revealCornerAction(page,selector,input='click'){
 assert(['click','tap','keyboard'].includes(input),'Unsupported A52 launcher input');
 const side=routes.get(selector);assert(side,'Not an A52 corner action: '+selector);
 const dialogId='preview-'+side+'-menu';
 const host=page.locator(side==='tools'?'.side':'.dock'),launcher=page.locator('#preview-'+side+'-launch');
 const dialog=page.locator('#'+dialogId),target=page.locator(selector);
 for(const [name,locator]of [['host',host],['launcher',launcher],['dialog',dialog],['target',target]])assert.equal(await locator.count(),1,'Exactly one A52 '+name);
 assert.equal(await host.getAttribute('data-menu-ready'),'true','Current source must install A52 menus');
 assert.equal(await launcher.getAttribute('aria-controls'),dialogId,'Launcher controls correct menu');
 assert.equal(await target.evaluate(el=>el.closest('dialog')?.id),dialogId,'Original target belongs to expected menu');
 if(await dialog.getAttribute('open')===null){
  if(input==='keyboard'){await launcher.focus();await page.keyboard.press('Enter');}
  else await launcher[input]();
 }
 assert.notEqual(await dialog.getAttribute('open'),null,'Native activation opened the menu');
 assert.equal(await launcher.getAttribute('aria-expanded'),'true','Launcher reflects open menu');
 await dialog.waitFor({state:'visible'});
 await target.waitFor({state:'visible'});
 // Caller retains the original native action, options, assertions and timeouts.
}
module.exports={revealCornerAction};

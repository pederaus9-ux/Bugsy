'use strict';
// Real sandbox event, real input only. No quiet/shot mode, state mutation or synthetic events.
const assert=require('node:assert/strict');
const {revealCornerAction}=require('./a52-browser-navigation.cjs');
async function settleSandboxEvent(page,input){
 assert(['click','tap'].includes(input),'Native event dismissal input');
 await page.waitForFunction(()=>window.__dbg?.G?.panel?.type==='event',null,{timeout:45000});
 assert.equal(await page.evaluate(()=>window.__dbg.G.panel.type),'event','Only the expected sandbox event may be dismissed');
 assert.equal(await page.locator('#panelRoot > .scrim').count(),1);
 // Explicit coexistence coverage: the real event remains underneath the native menu.
 await revealCornerAction(page,'#walkBtn','keyboard');
 assert.equal(await page.evaluate(()=>window.__dbg.G.panel.type),'event');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('dialog.preview-menu[open]').count(),0);
 assert.equal(await page.locator('#preview-tools-launch').evaluate(el=>el===document.activeElement),true);
 assert.equal(await page.evaluate(()=>window.__dbg.G.panel.type),'event','Corner Escape must not dismiss the underlying event');
 await page.locator('#panelRoot .xbtn')[input]();
 await page.waitForFunction(()=>!window.__dbg.G.panel,null,{timeout:15000});
 assert.equal(await page.locator('#panelRoot > .scrim').count(),0);
 assert.equal(await page.locator('#panelRoot .panel').count(),0);
}
module.exports={settleSandboxEvent};

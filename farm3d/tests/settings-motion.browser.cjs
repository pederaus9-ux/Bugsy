const assert=require('node:assert/strict');
const {start}=require('./browser-harness.cjs');
(async()=>{const h=await start();let failed=true;
try{
  for(const deviceMotion of ['no-preference','reduce']){
    const s=await h.setup({width:780,height:360},true,'settings-motion-'+deviceMotion),p=s.page;
    await p.emulateMedia({reducedMotion:deviceMotion});
    await p.goto(h.base+'farm3d/?testfarm&debug&portrait&shot&sim=0');
    await p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
    await p.evaluate(()=>{__dbg.G.opts.quiet=true;__dbg.G.openPanel('settings');});
    await p.waitForFunction(()=>document.querySelector('.panel').getAnimations().every(a=>a.playState==='finished'));
    for(const selection of ['full','system','reduce','full','reduce','system','full']){
      const button=p.locator('[data-act="motion"][data-k="'+selection+'"]');
      await button.scrollIntoViewIfNeeded();
      await p.evaluate(()=>{window.motionBefore={dialog:document.querySelector('.panel'),scrim:document.querySelector('.scrim'),body:document.querySelector('.pbody'),scroll:document.querySelector('.pbody').scrollTop};});
      await button.click();
      const state=await p.evaluate(()=>{
        const before=motionBefore,dialog=document.querySelector('.panel');
        return {sameDialog:dialog===before.dialog,sameScrim:document.querySelector('.scrim')===before.scrim,sameBody:document.querySelector('.pbody')===before.body,scroll:document.querySelector('.pbody').scrollTop,beforeScroll:before.scroll,
          animation:getComputedStyle(dialog).animationName,setting:__dbg.G.PREFS.motion,css:document.documentElement.dataset.motion,
          stored:JSON.parse(localStorage.getItem('sunny-acres-3d-v1-prefs')).motion,focus:document.activeElement.dataset.k,
          buttons:[...dialog.querySelectorAll('[data-act="motion"]')].map(b=>({key:b.dataset.k,pressed:b.getAttribute('aria-pressed'),plain:b.classList.contains('plain')}))};
      });
      assert.ok(state.sameDialog&&state.sameScrim&&state.sameBody,'motion selection preserves the existing overlay');
      assert.equal(state.scroll,state.beforeScroll,'scroll is preserved');
      assert.equal(state.animation,'none','open panel does not replay its entrance');
      assert.equal(state.setting,selection);assert.equal(state.stored,selection);assert.equal(state.focus,selection);
      assert.equal(state.css,selection==='reduce'||selection==='system'&&deviceMotion==='reduce'?'reduce':'full');
      for(const b of state.buttons){assert.equal(b.pressed,String(b.key===selection));assert.equal(b.plain,b.key!==selection);}
    }
    assert.deepEqual(s.errors,[]);await s.finish();
    console.log('PASS motion selections retain overlay, scroll, focus, preference and accessibility',deviceMotion);
  }
  failed=false;
}finally{await h.close(failed);}})().catch(e=>{console.error(e);process.exitCode=1;});

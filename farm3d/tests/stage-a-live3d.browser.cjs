// Stage A: deterministic Live3D smoke. Uses ?testfarm (never saved) plus the existing wear()/save() path.
// Does not change product, save schema, auth, rules, or economy.
const assert = require('assert/strict');
const {start} = require('./browser-harness.cjs');

function inspect(kind) {
  return `(function () {
    const d = window.__dbg;
    const list = d.animals.filter(a => a.kind === ${JSON.stringify(kind)});
    if (!list.length) return {kind:${JSON.stringify(kind)}, missing:true};
    return list.map(a => {
      const parts = [];
      a.g.traverse(o => { if (o.isMesh || o.isSprite) parts.push({type:o.type, skinned:!!o.isSkinnedMesh, geo:o.geometry && o.geometry.type, map:!!(o.material && o.material.map)}); });
      const finite = [a.g.position.x, a.g.position.y, a.g.position.z].every(Number.isFinite);
      return {kind:a.kind, rig:!!a.rig3d, skinned:parts.filter(p => p.skinned).length, planes:parts.filter(p => p.geo === 'PlaneGeometry').length, picture:parts.filter(p => p.geo === 'PlaneGeometry' && p.map).length, finite, proxy:a.card === a.rig3d.card && !!(a.card && a.card.isSkinnedMesh)};
    });
  })()`;
}

(async () => {
  const h = await start();
  let failed = true;
  try {
    const desktop = {width:1280, height:720};
    const phone = {width:844, height:390};
    for (const viewport of [desktop, phone]) {
      const s = await h.setup(viewport, viewport.width < 1000, 'stage-a-' + viewport.width, viewport.width < 1000);
      const {page, errors} = s;
      await page.goto(h.base + 'farm3d/?testfarm&debug&portrait&shot&sim=0');
      await page.waitForFunction(() => window.__done && window.__dbg && !document.getElementById('loading'), null, {timeout:90000});
      const shell = await page.evaluate(async () => {
        const sw = await (await fetch('sw.js')).text();
        const live = await (await fetch('live3d.js?v=1')).text();
        return {cache: /sa3d-v33/.test(sw), live: live.includes('createLiveAnimal'), modules: ['sheep3d.js','horse3d.js','dog3d.js','cat3d.js','chicken3d.js','farmer3d.js'].every(name => sw.includes(name))};
      });
      assert.equal(shell.cache, true, 'sa3d-v33');
      assert.equal(shell.live, true);
      assert.equal(shell.modules, true);
      const animals = {};
      for (const kind of ['cow','sheep','horse','dog','cat','chicken']) {
        animals[kind] = await page.evaluate(inspect(kind));
        assert.ok(animals[kind].length, kind + ' exists');
        for (const row of animals[kind]) {
          assert.equal(row.rig, true, kind + ' rig');
          assert.equal(row.skinned, 1, kind + ' one visual');
          assert.equal(row.planes, 1, kind + ' contact decal only, no picture card');
          assert.equal(row.proxy, true, kind + ' hit proxy');
          assert.equal(row.finite, true, kind + ' finite');
        }
      }
      const picked = await page.evaluate(() => {
        const d = window.__dbg, a = d.animals.find(x => x.kind === 'cow');
        a.g.position.set(40, 0, 40);
        d.camera.position.set(42, 1.6, 37);
        d.camera.lookAt(40, .9, 40);
        d.camera.updateMatrixWorld(true);
        d.scene.updateMatrixWorld(true);
        const hit = d.hitAt(innerWidth / 2, innerHeight / 2);
        return {type: hit && hit.type, kind: hit && hit.an && hit.an.kind};
      });
      assert.equal(picked.type, 'animal');
      assert.equal(picked.kind, 'cow');
      const farmer = await page.evaluate(async () => {
        const d = window.__dbg;
        const {updateLiveFarmer} = await import('./live3d.js?v=1');
        let node = null;
        d.scene.traverse(o => { if (o.userData && o.userData.hit && o.userData.hit.type === 'farmer') node = o; });
        if (!node || !node.userData.live) return {ok:false};
        const Live = node.userData.live;
        updateLiveFarmer(Live, 0, 0, 1/60, 'idle');
        const skinned = [];
        node.traverse(o => { if (o.isSkinnedMesh) skinned.push(1); });
        return {ok:true, visible:node.visible, skinned:skinned.length, finite:Number.isFinite(Live.arms[0].rotation.x), disposed:Live.disposed === true};
      });
      assert.equal(farmer.ok, true);
      assert.equal(farmer.visible, true);
      assert.equal(farmer.skinned, 1);
      assert.equal(farmer.finite, true);
      assert.equal(farmer.disposed, false);
      const villager = await page.evaluate(() => {
        const d = window.__dbg;
        d.G.S.visitor = {id:'rosa', items:{egg:1}, coins:10, xp:3, end:Date.now() + 60000, say:'hi'};
        d.G.S.level = Math.max(d.G.S.level, 3);
        return d.G.VILLAGERS.rosa.n;
      });
      assert.equal(villager, 'Granny Rosa');
      await page.waitForTimeout(1200);
      const visitor = await page.evaluate(() => {
        const d = window.__dbg;
        let node = null;
        d.scene.traverse(o => { if (o.userData && o.userData.hit && o.userData.hit.type === 'visitor') node = o; });
        if (!node) return {ok:false};
        const skinned = [];
        node.traverse(o => { if (o.isSkinnedMesh) skinned.push(1); });
        const planes = [];
        node.traverse(o => { if (o.visible && o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && o.material && o.material.map) planes.push(1); });
        return {ok:true, visible:node.visible, live:!!node.userData.live, skinned:skinned.length, picture:planes.length};
      });
      assert.equal(visitor.ok, true);
      assert.equal(visitor.visible, true);
      assert.equal(visitor.live, true);
      assert.equal(visitor.skinned, 1);
      assert.equal(visitor.picture, 0);
      const replaced = await page.evaluate(async () => {
        const d = window.__dbg;
        const {replaceRig, createLiveVillager} = await import('./live3d.js?v=1');
        let node = null;
        d.scene.traverse(o => { if (o.userData && o.userData.hit && o.userData.hit.type === 'visitor') node = o; });
        const previous = node.userData.live;
        const next = replaceRig(node, previous, createLiveVillager(0x448866));
        node.userData.live = next;
        return {disposed:previous.disposed === true, same:next !== previous, children:node.children.filter(c => c === next.g).length};
      });
      assert.equal(replaced.disposed, true);
      assert.equal(replaced.same, true);
      assert.equal(replaced.children, 1);
      const unexpected = errors.filter(e => !e.includes('farm/icon-192.png') && !e.includes('Failed to load resource: the server responded with a status of 404'));
      assert.deepEqual(unexpected, [], viewport.width + ' errors ' + unexpected.join(' | '));
      console.log('PASS stage A viewport', viewport.width, Object.keys(animals).join(','));
    }
    const w = await h.setup(desktop, false, 'stage-a-wardrobe', false);
    await w.page.goto(h.base + 'farm3d/?debug&portrait&shot&sim=0');
    await w.page.waitForFunction(() => window.__done && window.__dbg && !document.getElementById('loading'), null, {timeout:90000});
    const worn = await w.page.evaluate(() => window.__dbg.G.wear('hair', 5));
    assert.equal(worn, true);
    await w.page.reload();
    await w.page.waitForFunction(() => window.__done && window.__dbg && !document.getElementById('loading'), null, {timeout:90000});
    const look = await w.page.evaluate(() => {
      const d = window.__dbg;
      let node = null;
      d.scene.traverse(o => { if (o.userData && o.userData.hit && o.userData.hit.type === 'farmer') node = o; });
      return {hair:d.G.lookOf().hair, style:node && node.userData.live && node.userData.live.hair, saved:localStorage.getItem('sunny-acres-3d-v1').includes('"hair":5')};
    });
    assert.equal(look.hair, 5);
    assert.equal(look.style, 'buzz');
    assert.equal(look.saved, true);
    const unexpectedWardrobe = w.errors.filter(e => !e.includes('farm/icon-192.png') && !e.includes('Failed to load resource: the server responded with a status of 404'));
    assert.deepEqual(unexpectedWardrobe, []);
    console.log('PASS wardrobe reload', look);
    failed = false;
  } finally {
    await h.close(failed);
  }
  if (failed) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });

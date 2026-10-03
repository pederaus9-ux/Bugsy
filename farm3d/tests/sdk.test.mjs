import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dir=new URL('../',import.meta.url),read=f=>readFileSync(new URL(f,dir),'utf8');
test('production, locked browser package and emulator use one exact modular SDK',()=>{
  const version='12.19.0',url=`https://www.gstatic.com/firebasejs/${version}/`;
  for(const file of ['auth.js','players.html'])assert.ok(read(file).includes(`const SDK = "${url}";`),file);
  assert.ok(read('firebase/tests/emu-harness.cjs').includes(`const CDN = '${url}';`));
  const pkg=JSON.parse(read('firebase/package.json')),lock=JSON.parse(read('firebase/package-lock.json'));
  assert.equal(pkg.devDependencies['firebase-browser'],'npm:firebase@'+version);
  assert.equal(lock.packages['node_modules/firebase-browser'].version,version);
  assert.equal(lock.packages[''].devDependencies['firebase-browser'],pkg.devDependencies['firebase-browser']);
  assert.ok(!pkg.devDependencies.firebase9);assert.ok(!lock.packages['node_modules/firebase9']);
  assert.match(read('firebase/tests/emu-harness.cjs'),/Production\/emulator SDK mismatch/);
});

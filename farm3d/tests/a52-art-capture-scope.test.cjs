'use strict';
// Inert source tests only: never import either capture tool or start a server/browser.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=read('farm3d/tests/fixtures/a52-art-capture-accounting.json'),receipt=JSON.parse(raw);
const expected=['farm3d/tools/capture-hands-game.cjs','farm3d/tools/capture-barn-scene.cjs'];
function inverse(file,text){
 const e=receipt.files[file];assert(e,'Known capture tool');assert.equal(sha(text),e.afterSha256,'Exact adapted capture');
 for(const h of [...e.hunks].reverse()){assert.equal(text.split(h.after).length-1,h.count,'Unique inverse hunk');text=text.split(h.after).join(h.before);}
 assert.equal(sha(text),e.beforeSha256,'Exact pinned original capture');return text;
}
test('receipt is fixed and limited to two current capture tools',()=>{
 assert.equal(sha(raw),'cbbcd6d23f602085bf7428ed1d1d34bcce1978c155b72df306fd51a957489c5c');
 assert.deepEqual(Object.keys(receipt.files),expected);assert.equal(receipt.browserExecution,'NOT_RUN_RETAINED_HOLDS');
});
for(const file of expected){
 test(file+' adds native menu reveal and CSS MIME',()=>{
  const s=read(file);assert(s.includes("require('../tests/helpers/a52-browser-navigation.cjs')"));
  assert(s.includes("{'.html':'text/html','.css':'text/css','.js':"));
  assert.equal(s.split("await revealCornerAction(page,'#walkBtn');await page.locator('#walkBtn').click();").length,2);
 });
 test(file+' exact inverse retains every original capture byte',()=>{
  const s=read(file),old=inverse(file,s);new vm.Script(s);new vm.Script(old);
  for(const re of [/\bassert(?:\.[a-zA-Z]+)?\(/g,/timeout\s*:\s*\d+/g,/waitForTimeout\([^)]*\)/g,/await page\.locator\([^\n]*?\.click\([^)]*\)/g])assert.deepEqual(s.match(re),old.match(re));
  // Test the actual MIME object expression without evaluating the capture program.
  const expression=s.match(/\(\{'.html':'text\/html'[^\n]*?\}\)\[path.extname\(file\)\]/)[0];
  assert.equal(vm.runInNewContext(expression,{path:{extname:()=>'.css'},file:'safe.css'}),'text/css');
 });
 test(file+' rejects missing reveal, altered MIME, assertions and unrelated edits',()=>{
  const s=read(file);
  for(const bad of [s+'\n/* unrelated */',s.replace("await revealCornerAction(page,'#walkBtn');",''),s.replace("'.css':'text/css',",''),s.replace('assert.equal','assert.notEqual')])assert.throws(()=>inverse(file,bad));
 });
}

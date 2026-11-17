'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {assertEditBarFits}=require('./helpers/a52-editbar-layout.cjs');
test('native layout assertion rejects inaccessible and missing edit actions',async()=>{
 for(const v of [{count:3,allFit:false},{count:2,allFit:true}])await assert.rejects(()=>assertEditBarFits({evaluate:async()=>v}));
 await assertEditBarFits({evaluate:async()=>({count:3,allFit:true})});
});
test('read-only bounds observation catches offscreen Done without exporting boxes',()=>{
 const m={exports:{}},boxes=[{width:44,height:44,left:0,top:0,right:44,bottom:44},{width:44,height:44,left:44,top:0,right:88,bottom:44},{width:70,height:44,left:310,top:0,right:380,bottom:44}];
 vm.runInNewContext(fs.readFileSync(require.resolve('./helpers/a52-editbar-layout.cjs'),'utf8'),{module:m,require,innerWidth:320,innerHeight:568,document:{querySelectorAll:()=>boxes.map(r=>({getBoundingClientRect:()=>r}))}});
 assert.equal(m.exports.editBarFits().allFit,false);boxes[2].left=0;boxes[2].right=70;assert.equal(m.exports.editBarFits().allFit,true);
});
test('CSS correction exact inverse and original native journey preserved',()=>{
 const {sha,scope}=require('./helpers/a52-native-keyboard-scope.cjs'),css=fs.readFileSync(require.resolve('../compact-ui.css'),'utf8'),r=JSON.parse(fs.readFileSync(require.resolve('./fixtures/a52-editbar-layout-scope.json')));
 assert.equal(sha(fs.readFileSync(require.resolve('./fixtures/a52-editbar-layout-scope.json'))),'65c372af4e67f1d2341c13528e78dd1f35211edc07afa1ea53975cfbee8ea580');assert.equal(sha(css),r.afterSha256);assert.equal(sha(r.before),r.beforeSha256);assert.equal(css,r.before+r.addition);
 assert(r.addition.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'));assert(r.addition.includes('grid-column: 1 / -1'));assert(!/display:\s*none|pointer-events:\s*none/.test(r.addition));
 const s=fs.readFileSync(require.resolve('./a52-corner-menus.browser.cjs'),'utf8'),e=scope.editBarExtension;assert.equal(sha(s),scope.afterSha256);assert.equal(sha(e.before),e.previousAfterSha256);assert.equal(s.replace(e.addition,''),e.before);
});

test('exact edit CSS accounting rejects unknown bytes without normalizing',()=>{
 const {normalizeA52EditBar,scope}=require('./helpers/a52-editbar-layout-scope.cjs');
 const source=fs.readFileSync(require.resolve('../compact-ui.css'));
 assert.equal(normalizeA52EditBar('compact-ui.css',source).toString(),scope.before);
 const altered=Buffer.concat([source,Buffer.from('/* changed */')]);
 assert.equal(normalizeA52EditBar('compact-ui.css',altered),altered);
 const {verifyA52Asset}=require('./helpers/a52-scope.cjs');
 verifyA52Asset('compact-ui.css',source);assert.throws(()=>verifyA52Asset('compact-ui.css',altered));
});

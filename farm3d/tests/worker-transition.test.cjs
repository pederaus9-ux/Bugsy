const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const file=require('node:path').join(__dirname,'worker-transition.cjs');
const helper=fs.existsSync(file)?require(file):{};
function ready(expected,active,controller,installing=null){
 assert.equal(typeof helper.transitionHasControl,'function','identity-based transition check must exist');
 const r={active,installing,waiting:null};return vm.runInNewContext('('+helper.transitionHasControl.toString()+')()',{window:{__workerTransition:{registration:r,expected}},navigator:{serviceWorker:{controller}}});
}
test('an already activated predecessor cannot satisfy a requested update',()=>{
 const old={state:'activated'},next={state:'installing'};
 assert.equal(ready(null,old,old),false);
 assert.equal(ready(next,old,old),false);
 next.state='activated';assert.equal(ready(next,old,old),false);
 assert.equal(ready(next,next,old),false);
 assert.equal(ready(next,next,next),true);
});
test('activation is insufficient while another install is pending or requested worker is redundant',()=>{
 const next={state:'activated'},pending={state:'installing'};
 assert.equal(ready(next,next,next,pending),false);
 next.state='redundant';assert.equal(ready(next,next,next),false);
});

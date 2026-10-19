// Test-only: an update promise is not evidence that its new worker controls a page.
async function beginWorkerUpdate(){
 const registration=await navigator.serviceWorker.getRegistration();
 if(!registration?.active)throw Error('No installed predecessor');
 if(registration.installing||registration.waiting)throw Error('Previous transition not settled');
 const state=window.__workerTransition={registration,before:registration.active,expected:null};
 registration.addEventListener('updatefound',function found(){
  registration.removeEventListener('updatefound',found);
  state.expected=registration.installing;
 },{once:true});
 await registration.update();
 if(!state.expected&&registration.installing)state.expected=registration.installing;
}
function transitionHasControl(){
 const state=window.__workerTransition;
 if(!state?.expected||state.expected===state.before)return false;
 const r=state.registration,w=state.expected;
 if(w.state==='redundant')return false;
 return w.state==='activated'&&r.active===w&&navigator.serviceWorker.controller===w&&!r.installing&&!r.waiting;
}
async function updateWorker(page){
 await page.evaluate(beginWorkerUpdate);
 await page.waitForFunction(transitionHasControl,null,{timeout:90000});
 return page.evaluate(()=>({requestedWorkerControls:window.__workerTransition.expected===navigator.serviceWorker.controller,predecessorReplaced:window.__workerTransition.before!==navigator.serviceWorker.controller,state:navigator.serviceWorker.controller.state}));
}
module.exports={beginWorkerUpdate,transitionHasControl,updateWorker};

// Read-only sampler for a synthetic isolated herd. Call at a fixed cadence immediately
// after each simulation step. No saves, names, IDs, logs or traces leave the sampler.
exports.makeObserver = function makeObserver({polygon, projectX, nearest=2.5}) {
 const xs=polygon.map(p=>p[0]), zs=polygon.map(p=>p[1]);
 const mx=(Math.min(...xs)+Math.max(...xs))/2, mz=(Math.min(...zs)+Math.max(...zs))/2;
 const sx=projectX(mx,mz);
 const tally={}, prior=new WeakMap();
 return {tally,sample(cows,dt,night){
 const bump=(key,val)=>{tally[key]=(tally[key]||0)+val};
 for(const a of cows){
 const {x,z}=a.g.position;
 const side=x>=mx?'x+':'x-', depth=z>=mz?'z+':'z-', screen=projectX(x,z)>=sx?'right':'left';
 const region=[night?'night':'day',side,depth,screen].join('/');
 const task=a.cowTask?.kind;
 const care=!task?'ordinary':['robot','drink','bed','feed'].includes(task)?task:'otherCare';
 bump(region+'/'+care+'/cowSeconds',dt);
 const hanging=a.label?.startsWith('Hanging out with ')&&a.friend!=null;
 const prev=prior.get(a);
 if(hanging&&prev&&!prev.hanging){
 const b=a.friend, gap=Math.hypot(x-b.g.position.x,z-b.g.position.z);
 const approached = prev.seeking===b && cows.includes(b) && !task;
 bump(region+'/'+(approached && gap<=nearest?'cowEncounter':'unverifiedSocialArrival'),1);
 if(approached) bump(region+'/'+(gap<=1.5?'gap0to1_5':gap<=2.5?'gap1_5to2_5':gap<=4?'gap2_5to4':'gapOver4'),1);
 }
 prior.set(a,{hanging:!!hanging,seeking:a.doing==='social'&&!task?a.friend:null});
 }
 }};
};

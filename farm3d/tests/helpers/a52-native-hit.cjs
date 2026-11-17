'use strict';
// Passive finite actionability evidence. No coordinates, identifiers or error text leave the page.
function launcherHit(el){
 const doc=el.ownerDocument,w=doc.defaultView,r=el.getBoundingClientRect(),s=w.getComputedStyle(el);
 const x=r.left+r.width/2,y=r.top+r.height/2,inside=x>=0&&y>=0&&x<w.innerWidth&&y<w.innerHeight;
 const hit=inside?doc.elementFromPoint(x,y):null;
 const owns=!!hit&&(hit===el||el.contains(hit));
 let blocker=owns?'launcher':!hit?'none':'other';
 if(hit&&!owns){for(const [selector,label]of [['#intro','intro'],['#authGate','auth'],['#rotate','rotate'],['#loading','loading'],['.panel','panel'],['dialog','dialog'],['canvas','canvas']])if(hit.closest(selector)){blocker=label;break;}}
 return {observed:true,connected:!!el.isConnected,enabled:!el.disabled&&!el.matches(':disabled'),visible:r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.visibility!=='collapse'&&s.display!=='none',inViewport:inside,centerOwned:owns,pointerEvents:s.pointerEvents!=='none',openModals:Math.min(32,doc.querySelectorAll('dialog:modal').length),blocker};
}
const keys=['connected','enabled','visible','inViewport','centerOwned','pointerEvents'];
function finiteHit(value){
 if(!value||value.observed!==true)throw Error('Invalid finite hit observation');
 const out={observed:true};for(const key of keys){if(typeof value[key]!=='boolean')throw Error('Invalid hit boolean');out[key]=value[key];}
 if(!Number.isInteger(value.openModals)||value.openModals<0||value.openModals>32)throw Error('Invalid modal count');
 if(!['launcher','intro','auth','rotate','loading','panel','dialog','canvas','other','none'].includes(value.blocker))throw Error('Invalid blocker');
 return {...out,openModals:value.openModals,blocker:value.blocker};
}
async function observeLauncherHit(launcher){try{return finiteHit(await launcher.evaluate(launcherHit));}catch{return {observed:false};}}
module.exports={launcherHit,finiteHit,observeLauncherHit};

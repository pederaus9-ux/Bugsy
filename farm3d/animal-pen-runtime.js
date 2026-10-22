import {createChickenYard} from './chicken-yard.js?v=5';
import {createCowYard} from './cow-yard.js?v=4';
import {createRemainingCareYards} from './remaining-care-yard.js?v=3';
// Preparation owns only new resources. Nothing is attached to the live scene.
export function preparePenYards(layout){
 const yards={};let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;for(const yard of Object.values(yards))yard.dispose();};
 try{yards.chicken=createChickenYard({layout:layout.sites.chicken.custom?layout.sites.chicken:null});yards.cow=createCowYard({north:25,layout:layout.sites.cow.custom?layout.sites.cow:null});Object.assign(yards,createRemainingCareYards({layouts:Object.fromEntries(Object.entries(layout.sites).filter(([k,s])=>!['chicken','cow'].includes(k)&&s.custom))}));return{yards,dispose};}catch(e){dispose();throw e;}
}

// A prepared revision owns resources until publication starts. Once registries
// may reference them, a failure requires controlled reload by the save caller;
// disposing or rolling back here could corrupt the newly persisted revision.
// Optional live.prepareRegistries returns {publish,dispose,retire}: it is
// prepared before care, published before care and retired after care. Without
// it the legacy publishRegistries/disposePrevious callbacks are used.
export function prepareAnimalPenRevision(layout,validation,live){
 if(!validation?.ok||validation.revision!==layout.revision)throw new Error('Invalid or stale animal pen validation');
 const prepared=preparePenYards(layout);let registries=null,care=[],state='prepared';
 try{
  if(live.prepareRegistries)registries=live.prepareRegistries(layout,prepared.yards,validation);
  care=live.prepareCare(layout,validation);
 }catch(error){try{registries?.dispose();}finally{prepared.dispose();}throw error;}
 return {
  revision:layout.revision,
  publish(){
   if(state==='published')return;
   if(state!=='prepared')throw new Error('Animal pen revision '+state);
   state='publishing';
   try{
    if(registries)registries.publish();else live.publishRegistries(layout,prepared.yards,validation);
    for(const item of care)item.publish();
    if(registries)registries.retire();else live.disposePrevious();
    state='published';
   }catch(error){state='failed';throw error;}
  },
  dispose(){
   if(state!=='prepared')return;
   state='disposed';
   try{for(const item of care)item.dispose();}finally{try{registries?.dispose();}finally{prepared.dispose();}}
  }
 };
}

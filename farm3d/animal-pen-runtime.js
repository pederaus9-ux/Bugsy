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
export function prepareAnimalPenRevision(layout,validation,live){
 if(!validation?.ok||validation.revision!==layout.revision)throw new Error('Invalid or stale animal pen validation');
 const prepared=preparePenYards(layout);let care=[],state='prepared';
 try{care=live.prepareCare(layout,validation);}catch(error){prepared.dispose();throw error;}
 return {
  revision:layout.revision,
  publish(){
   if(state==='published')return;
   if(state!=='prepared')throw new Error('Animal pen revision '+state);
   state='publishing';
   try{
    live.publishRegistries(layout,prepared.yards,validation);
    for(const item of care)item.publish();
    live.disposePrevious();state='published';
   }catch(error){state='failed';throw error;}
  },
  dispose(){
   if(state!=='prepared')return;
   state='disposed';
   try{for(const item of care)item.dispose();}finally{prepared.dispose();}
  }
 };
}

import {createChickenYard} from './chicken-yard.js?v=5';
import {createCowYard} from './cow-yard.js?v=4';
import {createRemainingCareYards} from './remaining-care-yard.js?v=3';
// Preparation owns only new resources. Nothing is attached to the live scene.
export function preparePenYards(layout){
 const yards={};let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;for(const yard of Object.values(yards))yard.dispose();};
 try{yards.chicken=createChickenYard({layout:layout.sites.chicken.custom?layout.sites.chicken:null});yards.cow=createCowYard({north:25,layout:layout.sites.cow.custom?layout.sites.cow:null});Object.assign(yards,createRemainingCareYards({layouts:Object.fromEntries(Object.entries(layout.sites).filter(([k,s])=>!['chicken','cow'].includes(k)&&s.custom))}));return{yards,dispose};}catch(e){dispose();throw e;}
}

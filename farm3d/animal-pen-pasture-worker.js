// A42: runs the whole pasture growth search (each candidate needs a full ~1 s pen validation) off the main
// thread, so the once-per-session pasture check never freezes the game. The main thread commits the result.
import {growPasture} from './animal-pen-pasture.js?v=2';
import {decodeAnimalPens,resolveAnimalPens} from './animal-pen-layout.js?v=1';
import {validateAnimalPens} from './animal-pen-validation.js?v=4';
import {farmGroundY} from './farm-land.js?v=5';
self.onmessage=({data})=>{
 if(data?.type!=='grow')return;let result=null,error=null;
 try{const world={...data.world,groundY:farmGroundY};
  const isValid=c=>{if(decodeAnimalPens(c).status!=='ok')return false;const l=resolveAnimalPens(c);return !Object.values(l.sites).some(s=>s.issues.length)&&validateAnimalPens(l,world).ok;};
  const grown=growPasture(data.start,data.kind,{isValid,walls:data.walls}),value=grown?.value??(data.reset?{...data.start,revision:(data.start.revision|0)+1}:null);
  // The final layout's validation is sent back too, so committing it does not repeat the ~1 s check on the main thread.
  result={grown,value,validation:value?validateAnimalPens(resolveAnimalPens(value),world):null};}catch(e){error=String(e?.message??e);}
 self.postMessage({id:data.id,result,error});
};

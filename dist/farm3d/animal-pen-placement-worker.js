import {evaluatePenPlacement} from './animal-pen-placement.js?v=4';
import {farmGroundY} from './farm-land.js?v=5';
let context=null;
self.onmessage=({data})=>{
 if(data.type==='context'){context={...data,world:{...data.world,groundY:farmGroundY}};return;}
 if(data.type!=='check'||data.generation!==context?.generation)return;
 let result;try{result=evaluatePenPlacement(context.state,data.at,context.world);}catch{result={status:'unknown',reason:'This position could not be checked.'};}
 self.postMessage({generation:data.generation,key:data.key,result});
};

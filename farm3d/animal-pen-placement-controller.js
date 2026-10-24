import {placementCandidates} from './animal-pen-placement.js?v=2';
// A single worker owns serial, bounded checks. The main thread never runs a
// preview route search. A context change destroys in-flight/stale work.
export function createPenPlacementController({onUpdate,workerFactory=()=>new Worker(new URL('./animal-pen-placement-worker.js?v=2',import.meta.url),{type:'module'}),schedule=(fn,ms)=>setTimeout(fn,ms),unschedule=clearTimeout}){
 let worker=null,timer=null,busy=false,disposed=false,failed=false,generation=0,contextKey='',cellKey='',context=null,cells=[];const cache=new Map();
 const key=at=>JSON.stringify(at);
 function publish(){const out=cells.map(c=>({...c,...(cache.get(key(c.at))??{status:'unknown',reason:'Not checked yet.'})}));onUpdate({cells:out,reason:failed?'Placement checks are unavailable. Apply will check the layout again.':out[0]?.reason??(context?.state.selection.type==='gate'?'Point nearer the selected gate on its attached fence.':'Select a position on the ground.'),checking:!failed&&cells.some(c=>!cache.has(key(c.at)))});}
 function stop(){if(timer!==null)unschedule(timer);timer=null;worker?.terminate();worker=null;busy=false;}
 function fail(event){event?.preventDefault?.();stop();failed=true;cache.clear();publish();}
 function queue(){if(disposed||failed||busy||timer!==null||!cells.some(c=>!cache.has(key(c.at))))return;timer=schedule(()=>{timer=null;run();},150);}
 function run(){if(disposed||failed||busy)return;const cell=cells.find(c=>!cache.has(key(c.at)));if(!cell)return;
  try{if(!worker){worker=workerFactory();const current=worker,gen=generation;worker.onerror=event=>{if(current===worker&&gen===generation)fail(event);};worker.onmessage=({data})=>{if(disposed||current!==worker||gen!==generation||data.generation!==generation)return;busy=false;const r=data.result;if(!r||!['valid','blocked','unknown'].includes(r.status)){fail();return;}cache.set(data.key,{status:r.status,reason:String(r.reason)});while(cache.size>128)cache.delete(cache.keys().next().value);publish();queue();};worker.postMessage({type:'context',generation,...context});}
   busy=true;worker.postMessage({type:'check',generation,key:key(cell.at),at:cell.at});
  }catch{fail();}
 }
 function update(state,world,focus){if(disposed)return;const {groundY,...serialWorld}=world,serialState={draft:state.draft,selection:state.selection},next=JSON.stringify([serialState,serialWorld]);
  if(next!==contextKey){stop();generation++;contextKey=next;cellKey='';failed=false;cache.clear();context={state:structuredClone(serialState),world:structuredClone(serialWorld)};}
  const nextCells=placementCandidates(state,focus),nextKey=JSON.stringify(nextCells);if(nextKey!==cellKey){cellKey=nextKey;cells=nextCells;publish();}queue();
 }
 return{update,dispose(){if(disposed)return;disposed=true;stop();cache.clear();cells=[];}};
}

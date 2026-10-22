// Physical revision adapter only: no production, reward, clock, save or credit API.
// The caller supplies the already-settled current job at preparation time.
export function createCowPenCareAdapter({actors,idOf,scheduler,stations,job}){
 let revision=0;
 function snapshotLayout(){return {revision,tokens:scheduler.snapshot(),robot:structuredClone(job()),tasks:actors().map(a=>{const t=a.cowTask;return {animalId:idOf(a),stationId:t?.station.id,kind:t?.kind,stage:t?.stage,held:t?.held,weight:t?.weight,until:t?.until,jobId:t?.jobId,mealCycle:a.cowMealCycle,drinkAt:a.cowDrinkAt};})};}
 function prepareLayoutRebind({site,now,placements}){
  if(site.kind!=='cow'||!Number.isFinite(now))throw new Error('Invalid cow care revision');
  const next=new Map(site.stations.map(s=>[s.id,s])),currentJob=job(),updates=[];
  for(const a of actors()){
   const id=idOf(a),position=placements[id],task=a.cowTask,station=task?next.get(task.station.id):null;
   if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite))throw new Error('Missing validated cow placement '+id);
   if(task&&!station)throw new Error('Missing reserved cow station');
   let stage=task?.stage,waypoints=[];
   if(task?.kind==='robot'&&currentJob?.id===task.jobId&&currentJob.cowId===id){
    if(currentJob.stage==='exiting'){stage='exit';waypoints=[site.robot.exit,site.robot.turn,site.robot.clear];}
    else if(currentJob.stage==='milking'&&['align','hold'].includes(stage)){waypoints=[];}
    else{stage='approach';waypoints=[site.robot.entry,site.robot.dock];}
   }else if(task&&stage==='approach')waypoints=[station.approach,station.dock];
   updates.push({a,task,station,stage,waypoints,position:[...position]});
  }
  let state='prepared';
  return{revision:site.revision,publish(){
   if(state==='published')return;if(state!=='prepared')throw new Error('Cow revision '+state);
   if(updates.some(u=>u.a.cowTask!==u.task))throw new Error('Stale cow care revision');
   stations.clear();for(const [id,s]of next)stations.set(id,s);
   for(const {a,task,station,stage,waypoints,position}of updates){a.g.position.fromArray(position);a.path=null;a.target=null;a.vel.set(0,0);a.cowTickAt=now;if(task){task.station=station;task.stage=stage;task.waypoints=waypoints;task.path=null;task.avoidSide=undefined;}}
   revision=site.revision;state='published';
  },dispose(){if(state==='prepared')state='disposed';}};
 }
 return{snapshotLayout,prepareLayoutRebind};
}

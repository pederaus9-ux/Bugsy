// Physical occupancy only. Reservations never spend supplies or award goods.
export function createStationScheduler(stations){
 const definitions=new Map(stations.map(s=>[s.id,s]));
 if(definitions.size!==stations.length)throw Error('Duplicate animal station');
 let next=1;const occupied=new Map();
 const matches=t=>t&&occupied.get(t.stationId)?.animalId===t.animalId&&occupied.get(t.stationId)?.generation===t.generation;
 return {
  request(animalId,kind){
   if(typeof animalId!=='string'||!animalId)return null;
   const old=[...occupied.values()].find(t=>t.animalId===animalId);if(old)return definitions.get(old.stationId).kind===kind?{...old}:null;
   const station=stations.find(s=>s.kind===kind&&!occupied.has(s.id));if(!station)return null;
   const token={stationId:station.id,animalId,generation:next++,arrived:false};occupied.set(station.id,token);return {...token};
  },
  arrive(token){if(!matches(token))return false;occupied.get(token.stationId).arrived=true;return true;},
  release(token){if(!matches(token))return false;occupied.delete(token.stationId);return true;},
  snapshot(){return [...occupied.values()].map(t=>({...t}));},
  restore(snapshot){
   if(!Array.isArray(snapshot)||snapshot.length>stations.length)return false;
   const ids=new Set(),owners=new Set();let generation=next;
   for(const t of snapshot){if(!t||!definitions.has(t.stationId)||ids.has(t.stationId)||typeof t.animalId!=='string'||!t.animalId||owners.has(t.animalId)||!Number.isSafeInteger(t.generation)||t.generation<1||typeof t.arrived!=='boolean')return false;ids.add(t.stationId);owners.add(t.animalId);generation=Math.max(generation,t.generation+1);}
   occupied.clear();for(const t of snapshot)occupied.set(t.stationId,{...t});next=generation;return true;
  },
 };
}

'use strict';
const fs=require('node:fs'),path=require('node:path');
const PHASES=Object.freeze(["launch", "fit-counterexample", "native-boot", "native-open", "native-quantity", "native-layout", "native-egg-sale", "native-milk-sale", "native-price-expiry", "old-installed", "candidate-worker", "candidate-cache", "online-reload", "installed-sale", "offline-reload", "offline-second-reload", "predecessor-save", "predecessor-cache", "worker-activation", "current-cache", "saved-field-check", "complete"]);
function createDiagnostic(job,{runnerTemp=process.env.RUNNER_TEMP,write=fs.writeFileSync,mkdir=fs.mkdirSync}={}){
 if(!['market-sales','rollback'].includes(job))throw Error('Invalid diagnostic job');
 const state={schemaVersion:1,job,phase:'launch',viewport:0,status:'running',cache:{observed:false,current:false,historical:false,foreign:false}};
 const target=runnerTemp?path.join(runnerTemp,'a52-ci-safe',job,'diagnostic.json'):null;
 const save=()=>{if(target){mkdir(path.dirname(target),{recursive:true});write(target,JSON.stringify(state)+'\n');}};
 const phase=(value,viewport=state.viewport)=>{if(!PHASES.includes(value)||![0,390,844,1280].includes(viewport))throw Error('Invalid diagnostic phase');state.phase=value;state.viewport=viewport;save();};
 const cache=value=>{if(!value||Object.keys(value).sort().join(',')!=='current,foreign,historical'||Object.values(value).some(x=>typeof x!=='boolean'))throw Error('Invalid diagnostic cache');state.cache={observed:true,...value};save();};
 const status=value=>{if(!['pass','fail'].includes(value))throw Error('Invalid diagnostic status');state.status=value;save();};
 save();return {phase,cache,status};
}
module.exports={PHASES,createDiagnostic};

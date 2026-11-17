'use strict';
// Test-only finite lifecycle. Failures never replace or swallow the original exception.
const fs=require('node:fs'),path=require('node:path'),boundary=require('./a53-browser-boundary-observer.cjs');
const SCRIPTS=['animal-visual','sheep-baseline','dog-baseline','cat-baseline','chicken-baseline'];
function create({script=path.basename(process.argv[1]||'').replace(/\.browser\.cjs$/,''),root=process.env.RUNNER_TEMP,io=fs}={}){
 const state={schema:1,script:SCRIPTS.includes(script)?script:'other',status:'started',errorClass:null,reason:null};
 const file=root&&SCRIPTS.includes(script)?path.join(root,'a53-animal-lifecycle',script+'.json'):null;
 function save(){try{if(file){io.mkdirSync(path.dirname(file),{recursive:true});io.writeFileSync(file,JSON.stringify(state)+'\n',{mode:0o600});}}catch{}}
 save();return {pass(){try{state.status='passed';state.errorClass=null;state.reason=null;save();}catch{}},fail(error){try{if(state.status==='failed')return;state.status='failed';let name='other';try{if(boundary.CLASSES.includes(error?.name))name=error.name;}catch{}state.errorClass=name;state.reason=boundary.reason(error);save();}catch{}},snapshot:()=>JSON.parse(JSON.stringify(state))};
}
module.exports={create,SCRIPTS};

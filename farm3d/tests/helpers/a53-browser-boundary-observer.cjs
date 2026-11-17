'use strict';
// Passive test-only finite observation. Never persist error text, arguments or causes.
const fs=require('node:fs'),path=require('node:path');
const SCRIPTS=["animal-visual","sheep-baseline","dog-baseline","cat-baseline","chicken-baseline"];
const STEPS=['none','server-listen','proxy-listen','launch','context','page','routes','ready','session-finish','context-close','browser-close','servers-close','closed'];
const TYPES=['Browser','BrowserContext','Page','Frame','Locator','FrameLocator','JSHandle','ElementHandle','Worker','CDPSession','Keyboard','Mouse','Touchscreen','Request','Response','Route','ConsoleMessage','Tracing'];
const OPS=['launch','listen','newContext','newPage','route','addInitScript','goto','waitForFunction','evaluate','close','screenshot','on','text','url','status','failure','location','request','continue','fulfill','abort','fallback'];
const CLASSES=['Error','TypeError','RangeError','ReferenceError','SyntaxError','AssertionError','TimeoutError','TargetClosedError'];
const REASONS=['browser-target-closed','missing-executable','resource-exhausted','timeout','other'];
function reason(error){try{const m=error?.message;if(typeof m!=='string'||m.length>65536)return 'other';if(/Target page, context or browser has been closed|Browser has been closed|Connection closed|Target closed/i.test(m))return 'browser-target-closed';if(/Executable doesn.t exist|Failed to launch.*executable.*not found/i.test(m))return 'missing-executable';if(/Resource temporarily unavailable|Cannot allocate memory|Too many open files|No space left on device/i.test(m))return 'resource-exhausted';if(error?.name==='TimeoutError')return 'timeout';}catch{}return 'other';}
function create({script=path.basename(process.argv[1]||'').replace(/\.browser\.cjs$/,''),root=process.env.RUNNER_TEMP,io=fs}={}){
 const state={schema:1,script:SCRIPTS.includes(script)?script:'other',step:'none',firstOperation:null,firstCleanup:null};
 const file=root&&SCRIPTS.includes(script)?path.join(root,'a53-browser-boundary',script+'.json'):null;
 const save=()=>{try{if(file){io.mkdirSync(path.dirname(file),{recursive:true});io.writeFileSync(file,JSON.stringify(state)+'\n',{mode:0o600});}}catch{}};
 function step(value){try{if(STEPS.includes(value)){state.step=value;save();}}catch{}}
 function record(type,operation,error,cleanup=false){try{const key=cleanup||['session-finish','context-close','browser-close','servers-close','closed'].includes(state.step)?'firstCleanup':'firstOperation';if(state[key])return;let name='other';try{if(CLASSES.includes(error?.name))name=error.name;}catch{}state[key]={step:state.step,type:TYPES.includes(type)?type:'other',operation:OPS.includes(operation)?operation:'other',errorClass:name,reason:reason(error)};save();}catch{}}
 return {step,record,snapshot:()=>JSON.parse(JSON.stringify(state))};
}
const observer=create();module.exports={...observer,create,SCRIPTS,STEPS,TYPES,OPS,CLASSES,REASONS,reason};

'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const PHASES={"authored-hands": ["harness", "cleanup", "complete", "viewport", "setup", "source", "source-sentinel", "route", "navigate", "game-ready", "hands-ready", "fixture", "walk-open", "hands-visible", "wardrobe", "wardrobe-cycles", "walk-capture", "harvest-fixture", "harvest-target", "reduced-motion", "neutral", "neutral-wait", "sampling", "harvest-action", "harvest-wait", "harvest-assertions", "poses", "ownership", "ownership-assertions", "errors-finish"], "analytics": ["harness", "cleanup", "complete", "viewport", "dashboard-setup", "dashboard-fixture", "dashboard-navigate-ready", "dashboard-pagination", "dashboard-ios", "dashboard-all", "dashboard-period30", "dashboard-period-all", "dashboard-android", "dashboard-fit", "dashboard-capture", "dashboard-race", "dashboard-cap", "dashboard-signout", "dashboard-errors-finish", "scenario-setup", "scenario-fixture", "scenario-navigate", "scenario-behavior", "scenario-errors-finish", "game-setup", "game-navigate-ready", "game-metrics", "failed-harvest", "game-fixture", "game-deliver", "game-report-assertions", "game-errors-finish"]};
function category(error){return error instanceof assert.AssertionError?'assertion':error?.name==='TimeoutError'?'timeout':error?.name==='TargetClosedError'?'browser-operation':'other';}
function valid(v){return !!v&&Object.keys(v).sort().join('|')==='category|phase|schema|status|test|viewport'&&v.schema===1&&PHASES[v.test]?.includes(v.phase)&&Number.isInteger(v.viewport)&&v.viewport>=0&&v.viewport<=(v.test==='analytics'?8:2)&&['running','failed'].includes(v.status)&&['none','assertion','timeout','browser-operation','other'].includes(v.category);}
function createProgress(test){
 if(!Object.hasOwn(PHASES,test))throw Error('Invalid progress test');
 if(!process.env.RUNNER_TEMP)throw Error('Missing isolated receipt root');
 const dir=path.join(process.env.RUNNER_TEMP,'a52-ci-safe',test);
 const state={schema:1,test,phase:'harness',viewport:0,status:'running',category:'none'};
 function write(){if(!valid(state))throw Error('Invalid finite progress');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'diagnostic.json'),JSON.stringify(state)+'\n');}
 return {mark(phase,viewport=state.viewport){state.phase=phase;state.viewport=viewport;write();},fail(error){state.status='failed';state.category=category(error);try{write();}catch{ /* Retain original test error. */ }}};
}
module.exports={PHASES,category,valid,createProgress};

'use strict';
// Validate the finite projection before calling the unchanged scorecard renderer.
const fs=require('node:fs'),path=require('node:path');
const {projectReport,manifest,readJson}=require('./a52-quality-projection.cjs');
function publicContext(env){
 if(env.GITHUB_SERVER_URL!=='https://github.com'||env.GITHUB_REPOSITORY!=='pederaus9-ux/Bugsy'||!/^[1-9][0-9]{0,19}$/.test(env.GITHUB_RUN_ID||'')||!/^[a-f0-9]{40}$/.test(env.A52_EXPECTED_HEAD||''))throw Error('Public summary rejected');
 return {GITHUB_SERVER_URL:env.GITHUB_SERVER_URL,GITHUB_REPOSITORY:env.GITHUB_REPOSITORY,GITHUB_RUN_ID:env.GITHUB_RUN_ID};
}
async function summary(source,env){
 const context=publicContext(env),latest=readJson(source,['latest.json']);
 if(!latest||Object.keys(latest).join('|')!=='id'||typeof latest.id!=='string'||!/^\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d-\d{3}Z-[a-f0-9]{8}-[1-3]$/.test(latest.id))throw Error('Public summary rejected');
 const raw=readJson(source,[latest.id,'report.json']),report=projectReport(raw);
 // Reject unprojected input, including discarded fields, rather than silently accepting it.
 if(JSON.stringify(report)!==JSON.stringify(raw)||report.id!==latest.id||report.head!==env.A52_EXPECTED_HEAD)throw Error('Public summary rejected');
 const {renderScorecard}=await import('../quality-loop-scorecard.mjs');
 return renderScorecard(report,{manifest:manifest(),env:context});
}
async function main(args,env=process.env){try{
 if(args.length!==2||args[0]!=='--source'||!env.GITHUB_STEP_SUMMARY)throw Error('Public summary rejected');
 const text=await summary(args[1],env);fs.appendFileSync(env.GITHUB_STEP_SUMMARY,text,'utf8');return 0;
}catch{process.stderr.write('Public summary rejected\n');return 1;}}
module.exports={summary,publicContext,main};
if(require.main===module)main(process.argv.slice(2)).then(n=>{process.exitCode=n;});

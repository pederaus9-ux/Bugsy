import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const HORSE_CONTACT_FILE='horse-contact-feasibility.test.mjs';
const artifactName='horse-contact-feasibility.json';
const sourceNames=[HORSE_CONTACT_FILE,'horse-contact-scenarios.mjs'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const exactPattern=name=>'^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$';
export function expandFileSteps(manifest,file){
  if(file===HORSE_CONTACT_FILE)return (manifest.horseContactCases||[]).map(c=>({file,pattern:exactPattern(c.name),caseName:c.name,expectedMeasurements:c.measurements}));
  if(file==='animal-visual.test.mjs')return (manifest.visualPatterns||[]).map(pattern=>({file,pattern}));
  return [{file}];
}
export function validateHorseCases(manifest,testRoot){
  const cases=manifest.horseContactCases;
  if(!Array.isArray(cases)||cases.length!==9||new Set(cases.map(c=>c?.name)).size!==9)throw Error('Exactly nine unique horse contact cases required');
  if(cases.some(c=>typeof c.name!=='string'||!c.name||c.name.length>300||/[\r\n]/.test(c.name)||!Number.isInteger(c.measurements)||c.measurements<0))throw Error('Invalid horse contact case');
  // These pins make new/renamed cases and changed matrices fail closed until
  // their complete partition is reviewed. No original test is modified.
  if(!manifest.horseContactSources||Object.keys(manifest.horseContactSources).sort().join('\n')!==[...sourceNames].sort().join('\n'))throw Error('Missing horse contact source coverage pins');
  for(const file of sourceNames){
    const expected=manifest.horseContactSources[file];
    if(!/^[a-f0-9]{64}$/.test(expected)||hash(fs.readFileSync(path.join(testRoot,file)))!==expected)throw Error('Horse contact source changed; review complete case coverage: '+file);
  }
}
export function inspectCaseTap(log,name){
  const successful=[...log.matchAll(/^ok \d+ - (.+)$/gm)].map(m=>m[1]);
  const expected={tests:1,suites:0,pass:1,fail:0,cancelled:0,skipped:0,todo:0};
  for(const [key,value] of Object.entries(expected)){
    const counts=[...log.matchAll(new RegExp('^# '+key+' (\\d+)$','gm'))];
    if(counts.length!==1||Number(counts[0][1])!==value)throw Error('Invalid matched test receipt: '+key);
  }
  if(successful.length!==1||successful[0]!==name||/^not ok /m.test(log))throw Error('Expected exactly one matched original test: '+name);
  return 1;
}
export function prepareCaseArtifacts(testRoot,destination){
  const generatedDir=path.join(testRoot,'artifacts');
  const generated=path.join(generatedDir,artifactName);
  const backup=path.join(destination,'pre-existing-'+artifactName);
  const retained=path.join(destination,artifactName);
  if(fs.existsSync(generatedDir)&&(!fs.lstatSync(generatedDir).isDirectory()||fs.lstatSync(generatedDir).isSymbolicLink()))throw Error('Unsafe generated artifact directory');
  const exists=file=>{try{return fs.lstatSync(file);}catch(error){if(error.code==='ENOENT')return null;throw error;}};
  if(exists(backup)||exists(retained))throw Error('Refusing to overwrite case evidence');
  const previous=exists(generated);
  if(previous&&(!previous.isFile()||previous.isSymbolicLink()))throw Error('Unsafe existing horse contact artifact');
  if(previous)fs.renameSync(generated,backup);
  let finished=false;
  return ()=>{
    if(finished)return null;
    finished=true;
    let evidence,error;
    try{
      const stat=exists(generated);
      if(!stat)throw Error('Missing fresh horse contact artifact');
      if(!stat.isFile()||stat.isSymbolicLink()||stat.size>8*1024*1024)throw Error('Invalid fresh horse contact artifact');
      // Move the hook's exact bytes out before another case can overwrite them.
      fs.renameSync(generated,retained);
      const bytes=fs.readFileSync(retained);
      const rows=JSON.parse(bytes);
      if(!Array.isArray(rows))throw Error('Horse contact artifact is not an array');
      evidence={evidenceFile:artifactName,evidenceSha256:hash(bytes),measurements:rows.length,rows};
    }catch(cause){error=cause;}
    finally{
      // Restore any unrelated pre-existing generated file byte-for-byte. Do not
      // silently replace it with just the final selected case's partial output.
      if(previous){
        if(exists(generated))throw Error('Cannot restore prior artifact over unexpected output; preserved at '+backup);
        fs.renameSync(backup,generated);
      }
    }
    if(error)throw error;
    return evidence;
  };
}
export function validateCaseEvidence(log,definition,evidence){
  const matchedTests=inspectCaseTap(log,definition.name);
  if(evidence.measurements!==definition.measurements)throw Error('Incomplete horse contact measurements: expected '+definition.measurements+', received '+evidence.measurements);
  if(evidence.rows.some(row=>!row||!Array.isArray(row.violations)||row.violations.length))throw Error('Horse contact artifact contains invalid or failing measurements');
  const {rows,...receipt}=evidence;
  return {...receipt,matchedTests};
}

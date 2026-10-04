const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const validator=require(process.env.VALIDATOR_MODULE || 'gltf-validator');
(async()=>{
 assert.equal(validator.version(),'2.0.0-dev.3.10');
 const asset=path.resolve(__dirname,'../assets/barn/barn-candidate.glb');
 const report=await validator.validateBytes(new Uint8Array(fs.readFileSync(asset)),{uri:'barn-candidate.glb',format:'glb',writeTimestamp:false,maxIssues:0});
 const out=process.env.TEST_ARTIFACTS || path.join(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'barn-validator.json'),JSON.stringify(report,null,2));
 assert.equal(report.issues.numErrors,0);assert.equal(report.issues.numWarnings,0);
 // UVs are used by the canvas material study; the standalone GLB is untextured.
 // Preserve and review all findings rather than suppressing these four infos.
 assert.equal(report.issues.numInfos,4);assert.equal(report.issues.numHints,0);
 assert.ok(report.issues.messages.every(m=>m.code==='UNUSED_OBJECT'&&/^\/meshes\/\d\/primitives\/0\/attributes\/TEXCOORD_0$/.test(m.pointer)));
 console.log('Khronos barn validation: zero errors/warnings; four reviewed UV infos');
})().catch(e=>{console.error(e);process.exitCode=1;});

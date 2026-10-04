const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const validator=require(process.env.VALIDATOR_MODULE || 'gltf-validator');
(async()=>{
 assert.equal(validator.version(),'2.0.0-dev.3.10');
 const asset=path.resolve(__dirname,'../assets/hands/hands-candidate.glb');
 const bytes=fs.readFileSync(asset);
 const report=await validator.validateBytes(new Uint8Array(bytes),{
   uri:'hands-candidate.glb',format:'glb',writeTimestamp:false,maxIssues:0});
 const out=path.join(process.env.TEST_ARTIFACTS || path.join(__dirname,'artifacts'),'hands-study');
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'validator.json'),JSON.stringify(report,null,2));
 assert.equal(report.issues.numErrors,0);assert.equal(report.issues.numWarnings,0);
 assert.equal(report.issues.numInfos,0);assert.equal(report.issues.numHints,0);
 const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 const sceneRoots=new Set(doc.scenes[doc.scene || 0].nodes);
 for(const [i,node] of doc.nodes.entries())if(node.skin!==undefined){
   assert(sceneRoots.has(i),'skinned surfaces must be scene roots');
   const skin=doc.skins[node.skin];assert.equal(skin.joints.length,32);
   for(const primitive of doc.meshes[node.mesh].primitives)
     assert(primitive.attributes.JOINTS_0!==undefined&&primitive.attributes.WEIGHTS_0!==undefined);
 }
 const joints=new Set(doc.skins.flatMap(s=>s.joints));
 for(const clip of doc.animations){
   assert(clip.channels.length>0,'required clip must contain real animation');
   assert(clip.channels.every(c=>joints.has(c.target.node)&&['rotation','translation'].includes(c.target.path)),
     'clips may only animate the actual skeleton');
 }
 console.log('Khronos hands validation: zero findings, bound skin surfaces and real bone clips');
})().catch(e=>{console.error(e);process.exitCode=1;});

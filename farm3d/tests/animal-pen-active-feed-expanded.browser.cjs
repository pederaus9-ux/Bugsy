// New combined native journey. The original single-bunk RED and assertions stay frozen.
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('node:assert/strict');
const canonical=path.join(__dirname,'animal-pen-feed-bunk.browser.cjs'),out=path.resolve(process.env.TEST_ARTIFACTS);let source=fs.readFileSync(canonical,'utf8');
const replace=(a,b)=>{assert.equal(source.split(a).length,2,a);source=source.replace(a,b);};
replace(" stage='native feed-bunk draft';",` stage='native combined south expansion and wider existing gate';
 for(const id of ['v2','v3']){await choose('Selected pen item','vertex|'+id);await p.getByRole('button',{name:'Move down 1 metre',exact:true}).click({delay:50});}
 await choose('Selected pen item','gate|gate0');await p.locator('[data-action="widen"]').click({delay:50});
 await choose('Selected pen item','structure|feedBunk');
 stage='native feed-bunk draft';`);
replace("expected.structures.feedBunk=[-8,-34];",`expected.structures.feedBunk=[-8,-34];for(const v of expected.boundary)if(['v2','v3'].includes(v.id)){v.x=Math.round(v.x);v.z=Math.round(v.z+1);}expected.gates[0].width+=1;`);
// Retain inputs even when a later physical assertion fails.
replace("report.metrics=await p.evaluate(()=>window.__feedMetrics??null);","report.metrics=await p.evaluate(()=>window.__feedMetrics??null);report.inputEvents=await p.evaluate(()=>__feedInput);report.contactAtFailure=await p.evaluate(()=>{const a=__dbg.animals.find(a=>a.kind==='cow'&&a.cowTask?.kind==='feed'&&a.cowTask.weight===1);return a?__feedContact(a.ref.i):null;});");
if(process.env.CAMERA_SIDE==='1')replace('d.cam.dist=10;d.cam.yaw=0;d.cam.pitch=.3;','d.cam.dist=10;d.cam.yaw=Math.PI/2;d.cam.pitch=.12;');
fs.mkdirSync(out,{recursive:true});assert(!fs.existsSync(path.join(out,'executed-source.cjs')));fs.writeFileSync(path.join(out,'executed-source.cjs'),source);const run=new Module(canonical,module);run.filename=canonical;run.paths=Module._nodeModulePaths(__dirname);run._compile(source,canonical);

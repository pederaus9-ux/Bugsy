// Independent native Apply/immediate reload case. Does not run or qualify care.
// The failing paid-feed continuation remains in its separate unchanged probe.
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('node:assert/strict');
const root=path.join(__dirname,'evidence/pen-editing-implementation/task7-codex-occupied-shelter-20261023'),canonical=path.join(__dirname,'animal-pen-feed-bunk.browser.cjs'),out=path.resolve(process.env.TEST_ARTIFACTS);
let source=fs.readFileSync(path.join(root,'feed-paid-install-60/executed-source.cjs'),'utf8');
const a=source.indexOf(" stage='all five actual feed visits after installed bunk';"),b=source.indexOf(" stage='feed-bunk save reload';",a);assert(a>=0&&b>a);
source=source.slice(0,a)+` record('trusted native installation input',await p.evaluate(()=>__feedInput));assert(report.steps.at(-1).value.every(e=>e.trusted));await p.evaluate(()=>{const d=__dbg;d.cam.target.set(-8,.7,-35);d.cam.dist=7;d.cam.yaw=.8;d.cam.pitch=.1;d.placeCamera(1);d.renderScene();});await p.screenshot({path:path.join(artifacts,'installed-bunk-with-bed-occupants.png')});\n`+source.slice(b);
source=source.replace("case:'bed-occupied feed-bunk installation, followed by all-five actual feeding; active-feed Apply remains unqualified'","case:'independent occupied-bed Apply and immediate reload only; no continuation or active-feed qualification'");
fs.mkdirSync(out,{recursive:true});assert(!fs.existsSync(path.join(out,'executed-source.cjs')));fs.writeFileSync(path.join(out,'executed-source.cjs'),source);const run=new Module(canonical,module);run.filename=canonical;run.paths=Module._nodeModulePaths(__dirname);run._compile(source,canonical);

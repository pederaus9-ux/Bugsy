// Separate default-farm control, no editor or installed-layout qualification.
// Actual five-bed setup, stock actions and full care assertions remain exact.
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('node:assert/strict');
const canonical=path.join(__dirname,'animal-pen-feed-bunk.browser.cjs'),out=path.resolve(process.env.TEST_ARTIFACTS);
let source=fs.readFileSync(path.join(__dirname,'evidence/pen-editing-implementation/task7-codex-occupied-shelter-20261023/feed-paid-install-60/executed-source.cjs'),'utf8');
const a=source.indexOf(' await p.evaluate(()=>__dbg.G.save());const held='),b=source.indexOf(" stage='all five actual feed visits after installed bunk';",a);assert(a>=0&&b>a);source=source.slice(0,a)+" record('default occupied starting state',await state());\n"+source.slice(b);
const c=source.indexOf(" stage='feed-bunk save reload';"),d=source.indexOf("assert.deepEqual(s.errors,[]);report.status='PASS';",c);assert(c>=0&&d>c);source=source.slice(0,c)+source.slice(d);
source=source.replace("case:'bed-occupied feed-bunk installation, followed by all-five actual feeding; active-feed Apply remains unqualified'","case:'default layout, no editor Apply, same five-bed setup and paid feeding physical assertions'").replace("input:'Native mouse/keyboard editor; API stock fixture, manually stepped five actual cows, non-cows static'","input:'No editor input; API stock fixture, manually stepped five actual cows, non-cows static'");
fs.mkdirSync(out,{recursive:true});assert(!fs.existsSync(path.join(out,'executed-source.cjs')));fs.writeFileSync(path.join(out,'executed-source.cjs'),source);const run=new Module(canonical,module);run.filename=canonical;run.paths=Module._nodeModulePaths(__dirname);run._compile(source,canonical);

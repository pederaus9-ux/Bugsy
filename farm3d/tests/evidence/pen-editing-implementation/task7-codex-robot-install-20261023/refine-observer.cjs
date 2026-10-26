const fs=require('fs'),assert=require('node:assert/strict'),path=require('path'),f=path.resolve(__dirname,'../../../animal-pen-robot-install.browser.cjs');
let s=fs.readFileSync(f,'utf8');
const old=" await p.evaluate(()=>__dbg.G.save());await p.locator('#editBtn')";
assert.equal(s.split(old).length,2);s=s.replace(old," record('pre-edit contact observation',await contactSnapshot());await p.evaluate(()=>__dbg.G.save());await p.locator('#editBtn')");
const before="report.draft=await p.evaluate(()=>__dbg.penEditor.snapshot());";
assert.equal(s.split(before).length,2);s=s.replace(before,before+"await p.evaluate(()=>{const d=__dbg,a=d.animals.find(a=>a.kind==='cow'&&a.ref.i===4);d.cam.target.set(a.g.position.x,.7,a.g.position.z);d.cam.dist=10;d.cam.yaw=-1;d.cam.pitch=.3;d.placeCamera(1);d.renderScene();});await p.screenshot({path:path.join(artifacts,'robot-failure-pose.png')});");
fs.writeFileSync(f,s);

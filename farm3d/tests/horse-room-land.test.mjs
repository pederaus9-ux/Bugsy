// Amendment A1 (horse room): a 10 m strip west of the north clearing becomes level
// pen land; every other ground height and hill tree keeps its approved place.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {farmGroundY,WEST_CLEARING} from '../farm-land.js';
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
// The approved terrain before the amendment, kept here as the reference.
function approvedGroundY(x,z){
 const d=Math.hypot(x,z),old=d<16?0:(Math.sin(x*.09)*Math.cos(z*.07)*1.3+Math.sin(x*.23+z*.17)*.4)*Math.min(1,(d-16)/20);
 const clearing=smooth(-21,-25,z)*(1-smooth(-46,-50,z))*(1-smooth(24,28,Math.abs(x-1)));
 return clearing===1?0:old*(1-clearing);
}
const inStrip=(x,z)=>x>-37&&x<-23&&z>-50&&z<-21;
test('only the west strip changes, it only flattens, and the horse ground is level',()=>{
 let changed=0;
 for(let x=-110;x<=110;x+=.25)for(let z=-110;z<=110;z+=.25){
  const now=farmGroundY(x,z),before=approvedGroundY(x,z);
  if(!inStrip(x,z)){assert.equal(now,before,`ground moved outside the strip at ${x},${z}`);continue;}
  assert(Math.abs(now)<=Math.abs(before)+1e-12,`strip raised at ${x},${z}`);if(now!==before)changed++;
  if(x>=-33&&z>=-46&&z<=-25)assert.equal(now,0,`not level at ${x},${z}`);
 }
 assert(changed>0,'the strip was not levelled');
});
test('no hill tree stands in the levelled strip and only trees inside the widened band move',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),line=s=>html.slice(html.indexOf(s),html.indexOf('\n',html.indexOf(s)));
 const block=html.slice(html.indexOf('const hills = [];'),html.indexOf('bootStep("planting the woods");'));
 const tree=()=>({position:{x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z});}},scale:{setScalar(){}},rotation:{},userData:{}});
 const c={WEST_CLEARING,makeTree:tree,groundY:farmGroundY,scene:{add(){}},mergeStatic(){},keepCanopy:()=>()=>false};vm.createContext(c);
 vm.runInContext(line('function rng(seed)')+'\n'+block+';globalThis.out=hills.map(t=>[t.position.x,t.position.z]);',c);
 // Reference: the approved placement rule with the same seeded sequence.
 const R=vm.runInNewContext(line('function rng(seed)')+';rng(31)'),ref=[];
 for(let i=0;i<14;i++){const a=R()*Math.PI*2,r=36+R()*30;let x=Math.cos(a)*r;const z=Math.sin(a)*r;if(z< -21&&z> -50&&Math.abs(x-1)<28)x=1+(x<1?-31:31);R();R();ref.push([x,z]);}
 assert.equal(c.out.length,14);let moved=0;
 c.out.forEach(([x,z],i)=>{
  assert(!(x>=-37&&x<=-19&&z>-50&&z<-21),`hill tree ${i} stands in the levelled strip at ${x},${z}`);
  const [rx,rz]=ref[i];assert.equal(z,rz);
  if(rz< -21&&rz> -50&&rx<1&&rx> -37){assert.equal(x,-40);moved++;}else assert.equal(x,rx,`hill tree ${i} moved`);
 });
 assert.equal(moved,1,'exactly one approved hill tree is in the widened band');
});

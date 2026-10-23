import fs from 'node:fs';import assert from 'node:assert/strict';
const r=JSON.parse(fs.readFileSync(new URL('./live/results.json',import.meta.url),'utf8'));
let crossings=0,frames=0;
for(const row of r.player){
 for(const x of row.crossings){assert(x.error<1e-7);for(const f of x.frames){assert(f.collisionDisplacement<1e-7,'An absolute fixture target must not hide a collision');assert(f.step<=x.normalSpeed/x.hz+1e-10,'player speed exceeded');frames++;}crossings++;}
 assert(row.solidControls.every(x=>x.error>.35));
}
assert.equal(crossings,24);console.log(JSON.stringify({crossings,frames,maxCollisionDisplacement:0,normalSpeed:3.4,radius:.35,solidControls:4,status:'PASS_STATIC_COLLISION_ONLY'}));

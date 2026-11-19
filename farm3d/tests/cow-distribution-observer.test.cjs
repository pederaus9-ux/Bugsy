const test=require('node:test'),assert=require('node:assert/strict'),{makeObserver}=require('./helpers/cow-distribution-observer.cjs');
test('occupancy is time; a completed approach must have the same current nearby cow partner',()=>{
 const t=makeObserver({polygon:[[0,0],[10,0],[10,10],[0,10]],projectX:x=>-x});
 const a={g:{position:{x:2,z:2}}},b={g:{position:{x:3,z:2}}};a.friend=b;
 const sample=(night=false)=>t.sample([a,b],1,night);
 const seek=()=>{a.label='Visiting pal';a.doing='social';sample()};
 const arrive=(n=false)=>{a.label='Hanging out with pal';a.doing=null;sample(n)};
 arrive(); assert.equal(t.tally['day/x-/z-/right/cowEncounter'],undefined); // left-censored label
 seek();arrive();sample();assert.equal(t.tally['day/x-/z-/right/cowEncounter'],1);
 assert.equal(t.tally['day/x-/z-/right/gap0to1_5'],1);assert.equal(t.tally['day/x-/z-/right/ordinary/cowSeconds'],8);
 seek();b.g.position.x=9;arrive(true);assert.equal(t.tally['night/x-/z-/right/unverifiedSocialArrival'],1);
 assert.equal(t.tally['night/x-/z-/right/gapOver4'],1);
 a.label='Waiting';sample();b.g.position.x=3;arrive();
 assert.equal(t.tally['day/x-/z-/right/cowEncounter'],1);assert.equal(t.tally['day/x-/z-/right/unverifiedSocialArrival'],1);
});

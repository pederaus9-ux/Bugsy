const assert=require('node:assert/strict');

// A fresh level-one farm has exactly these eligible daily quest targets.
// The game's draw is random, so require three distinct valid choices rather
// than treating one observed ordering as a save invariant.
const FRESH_QUESTS=Object.freeze({harvest:12,orders:2,water:7,market:40});

function assertNewFarmReload(beforeRaw,afterRaw,{day,reloadStart,reloadEnd}){
 const before=JSON.parse(beforeRaw),after=JSON.parse(afterRaw);
 assert.equal(before.quests,null,'new farm starts before daily quests are initialized');
 assert(after.quests&&typeof after.quests==='object','reload initializes daily quests');
 assert.deepEqual(Object.keys(after.quests).sort(),['bonus','day','list']);
 assert.equal(after.quests.day,day,'daily quests use the reload day');
 assert.equal(after.quests.bonus,0,'fresh farm cannot claim a daily bonus');
 assert(Array.isArray(after.quests.list));assert.equal(after.quests.list.length,3);
 const seen=new Set();
 for(const quest of after.quests.list){
  assert.equal(typeof quest?.m,'string');
  assert(Object.hasOwn(FRESH_QUESTS,quest.m),'unknown fresh-farm quest');
  assert(!seen.has(quest.m),'duplicate fresh-farm quest');seen.add(quest.m);
  assert.deepEqual(quest,{m:quest.m,n:FRESH_QUESTS[quest.m],prog:0,got:0},'fresh quest target and reward state');
 }
 assert(Number.isSafeInteger(before.lastSeen),'pre-reload timestamp');
 assert(Number.isSafeInteger(after.lastSeen),'post-reload timestamp');
 assert(after.lastSeen>before.lastSeen,'reload advances lastSeen');
 assert(after.lastSeen>=reloadStart&&after.lastSeen<=reloadEnd,'lastSeen belongs to reload clock window');
 const otherFields=save=>{const copy=structuredClone(save);delete copy.quests;delete copy.lastSeen;return copy;};
 assert.deepEqual(otherFields(after),otherFields(before),'every other saved field remains exact');
}

module.exports={assertNewFarmReload};

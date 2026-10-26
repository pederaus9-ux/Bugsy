const assert=require('node:assert/strict');

function assertImportedFarmReload(beforeRaw,afterRaw,{day,reloadStart,reloadEnd}){
 const before=JSON.parse(beforeRaw),after=JSON.parse(afterRaw);
 assert(Number.isSafeInteger(before.lastSeen),'pre-reload lastSeen');
 assert(Number.isSafeInteger(after.lastSeen),'post-reload lastSeen');
 assert(after.lastSeen>before.lastSeen,'reload advances lastSeen');
 assert(after.lastSeen>=reloadStart&&after.lastSeen<=reloadEnd,'lastSeen belongs to reload clock window');
 const nagDue=before.level>=3&&(!before.lastBackup||reloadStart-before.lastBackup>7*864e5)&&before.lastNag!==day;
 if(nagDue)assert.equal(after.lastNag,day,'due backup reminder uses reload day');
 else assert.deepEqual(after.lastNag,before.lastNag,'backup reminder cannot change when not due');
 const otherFields=save=>{const copy=structuredClone(save);delete copy.lastSeen;delete copy.lastNag;return copy;};
 assert.deepEqual(otherFields(after),otherFields(before),'every other imported save field remains exact');
}

module.exports={assertImportedFarmReload};

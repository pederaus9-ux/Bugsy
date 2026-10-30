// Pure test observation helpers. Never mutate a farm or change auth behavior.
const {performance} = require('node:perf_hooks');
const OBSERVATION_MS = 40000, MAX_SAMPLES = 40;
const AUTH_AUTOMATIC_FIELDS = Object.freeze(['orders','event','nextEventAt','lastNag','lastBackup','lastSeen']);
const CHANGED_FIELD_LABELS = Object.freeze([
  'v','coins','gems','xp','level','barn','barnCap','barnUps','plots','stand','decor',
  'event','nextEventAt','holidayDone','lastCrop','pens','pets','buildings','orders',
  'lastDaily','stats','style','tut','gold','sprinklers','land','perks','quests','ach',
  'museum','rush','nextRushAt','visitor','nextVisitorAt','villagers','lastSeen',
  'streak','seasonTrack','look','unlocks','layout','lastNag','lastBackup',
  'pens.chicken.care','pens.chicken.appearance','pens.chicken.list','pens.chicken.meta',
  'pens.cow.care','layout.animalPens'
]);
const TOP_LEVEL_LABELS = new Set(CHANGED_FIELD_LABELS.filter(label => !label.includes('.')));
function authProgressOf(raw) {
  try { const s = JSON.parse(raw); for (const k of AUTH_AUTOMATIC_FIELDS) delete s[k]; return JSON.stringify(s); }
  catch (_) { return raw; }
}
function allowedChangedFields(value) {
  return Array.isArray(value) && value.length <= CHANGED_FIELD_LABELS.length &&
    value.every(label => CHANGED_FIELD_LABELS.includes(label));
}
function changedFieldDiagnostics(raw, baseRaw) {
  try {
    const current = JSON.parse(raw), base = JSON.parse(baseRaw);
    if (!current || !base || Array.isArray(current) || Array.isArray(base) || typeof current !== 'object' || typeof base !== 'object') return {fieldComparisonReadable:false};
    const valueAt = (object, label) => label.split('.').reduce((value, key) => value && typeof value === 'object' ? value[key] : undefined, object);
    const changedFields = CHANGED_FIELD_LABELS.filter(label => JSON.stringify(valueAt(current,label)) !== JSON.stringify(valueAt(base,label)));
    const unclassifiedTopLevelChange = [...new Set([...Object.keys(current),...Object.keys(base)])].some(key => !TOP_LEVEL_LABELS.has(key) && JSON.stringify(current[key]) !== JSON.stringify(base[key]));
    return {fieldComparisonReadable:true, changedFields, unclassifiedTopLevelChange,
      unclassifiedByteDifference:raw !== baseRaw && changedFields.length === 0,
      authProgressEqual:authProgressOf(raw) === authProgressOf(baseRaw)};
  } catch (_) { return {fieldComparisonReadable:false}; }
}
function requestedSaveMatches(after, base) {
  try {
    return after.rev > base.rev && typeof after.save === 'string' &&
      after.save.includes('"__sentinel":"' + base.token + '"') &&
      JSON.parse(after.save).coins === JSON.parse(base.save).coins + 3;
  } catch (_) { return false; }
}
function withinRemaining(task, ms, timers) {
  return new Promise((resolve,reject) => {
    let finished = false;
    const timer = timers.setTimeout(() => { finished = true; resolve({expired:true}); },ms);
    Promise.resolve().then(task).then(value => {
      if (finished) return;
      finished = true; timers.clearTimeout(timer); resolve({expired:false,value});
    },error => {
      if (finished) return;
      finished = true; timers.clearTimeout(timer); reject(error);
    });
  });
}
async function pollRequestedSave({read, wait, base, observe = () => {}, now = () => performance.now(), timers = {setTimeout,clearTimeout}}) {
  const deadline = now() + OBSERVATION_MS;
  let after = null;
  for (let index = 0; index < MAX_SAMPLES; index++) {
    const remaining = deadline - now();
    if (remaining <= 0) break;
    const sample = await withinRemaining(read,remaining,timers);
    if (sample.expired || now() > deadline) break;
    const matched = requestedSaveMatches(sample.value,base);
    observe(sample.value,index,matched);
    if (now() > deadline) break;
    after = sample.value;
    if (matched) return after;
    const delay = Math.min(1000,deadline - now());
    if (delay <= 0 || (await withinRemaining(() => wait(delay),deadline - now(),timers)).expired) break;
  }
  if (!after) throw new Error('Recovery save observation produced no sample within40000ms');
  return after; // The original final assertion must reject a nonmatching last sample.
}
module.exports = {OBSERVATION_MS,MAX_SAMPLES,AUTH_AUTOMATIC_FIELDS,CHANGED_FIELD_LABELS,authProgressOf,allowedChangedFields,changedFieldDiagnostics,requestedSaveMatches,pollRequestedSave};

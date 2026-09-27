/* ============================================================
   Sunny Acres 3D: the game itself (rules, menus, sound, weather, events, backup).
   Ported from the 2D game (farm/index.html) so both play exactly the same.
   No real money, ever: coins and gems are only earned by playing.
   The 3D world (index.html) draws the farm and fills in `view` so this file
   can show rewards over things, move the camera and place decorations.
   ============================================================ */

export const opts = {quiet:false}; // test pictures: never pop up menus by themselves
export const view = {
  fx(key, text) {}, focus(key) {}, closeTrays() {}, busy() { return false; }, moveDecor(j) {},
  refresh(what) {},               // "plots" | "herd" | "buildings" | "decor" | "stand" | "style" | "all"
  sparkle(key) {}, fly(kind, n) {}, // a gold burst over something; coins or gems flying into their counter
  freeDecorSpot(size) { return null; },
  paintOptions: {}, setQuality(q) {}, applyWeather() {}, screenPos(key) { return null; },
};

// ---------- game data (same as the 2D game) ----------
export const ITEMS = {
  wheat:{n:"Wheat",e:"🌾",p:2,lvl:1,kind:"crop"}, corn:{n:"Corn",e:"🌽",p:4,lvl:1,kind:"crop"}, carrot:{n:"Carrot",e:"🥕",p:6,lvl:2,kind:"crop"},
  soybean:{n:"Soybean",e:"🫘",p:7,lvl:3,kind:"crop"}, sugarcane:{n:"Sugarcane",e:"🎋",p:9,lvl:4,kind:"crop"}, tomato:{n:"Tomato",e:"🍅",p:11,lvl:5,kind:"crop"},
  strawberry:{n:"Strawberry",e:"🍓",p:14,lvl:6,kind:"crop"}, pumpkin:{n:"Pumpkin",e:"🎃",p:20,lvl:8,kind:"crop"},
  chicken_feed:{n:"Chicken feed",e:"🟡",p:3,lvl:1,kind:"feed"}, cow_feed:{n:"Cow feed",e:"🟤",p:5,lvl:4,kind:"feed"}, sheep_feed:{n:"Sheep feed",e:"🟢",p:7,lvl:7,kind:"feed"},
  fertilizer:{n:"Fertilizer",e:"🧪",p:4,lvl:3,kind:"feed"}, flour:{n:"Flour",e:"🥣",p:5,lvl:2,kind:"good"},
  egg:{n:"Egg",e:"🥚",p:10,lvl:2,kind:"animal"}, milk:{n:"Milk",e:"🥛",p:18,lvl:4,kind:"animal"}, wool:{n:"Wool",e:"🧶",p:28,lvl:7,kind:"animal"},
  bread:{n:"Bread",e:"🍞",p:18,lvl:2,kind:"good"}, cornbread:{n:"Corn bread",e:"🥯",p:32,lvl:3,kind:"good"}, sugar:{n:"Brown sugar",e:"🍬",p:16,lvl:4,kind:"good"},
  butter:{n:"Butter",e:"🧈",p:45,lvl:4,kind:"good"}, cookie:{n:"Cookie",e:"🍪",p:45,lvl:5,kind:"good"}, tomato_soup:{n:"Tomato soup",e:"🍲",p:55,lvl:5,kind:"good"},
  cheese:{n:"Cheese",e:"🧀",p:65,lvl:6,kind:"good"}, carrot_pie:{n:"Carrot pie",e:"🥧",p:70,lvl:6,kind:"good"}, strawberry_jam:{n:"Strawberry jam",e:"🍯",p:70,lvl:7,kind:"good"},
  pumpkin_pie:{n:"Pumpkin pie",e:"🍮",p:85,lvl:8,kind:"good"}, sweater:{n:"Sweater",e:"🧥",p:90,lvl:8,kind:"good"},
  cake:{n:"Cake",e:"🎂",p:130,lvl:7,kind:"good"}, pizza:{n:"Pizza",e:"🍕",p:140,lvl:8,kind:"good"},
};
// time in seconds; seed = coin price when you have none of that crop to replant
export const CROPS = {
  wheat:{time:20,xp:1,seed:1}, corn:{time:45,xp:1,seed:2}, carrot:{time:90,xp:2,seed:3},
  soybean:{time:120,xp:2,seed:4}, sugarcane:{time:180,xp:3,seed:5}, tomato:{time:240,xp:3,seed:6},
  strawberry:{time:360,xp:4,seed:8}, pumpkin:{time:600,xp:6,seed:12},
};
export const ANIMALS = {
  chicken:{n:"Chicken",e:"🐔",feed:"chicken_feed",out:"egg",time:90,xp:2,lvl:2,pen:"Chicken coop",penE:"🐔",penCost:100,cost:40,max:6},
  cow:{n:"Cow",e:"🐄",feed:"cow_feed",out:"milk",time:180,xp:3,lvl:4,pen:"Cow pasture",penE:"🐄",penCost:300,cost:120,max:5},
  sheep:{n:"Sheep",e:"🐑",feed:"sheep_feed",out:"wool",time:300,xp:4,lvl:7,pen:"Sheep meadow",penE:"🐑",penCost:500,cost:200,max:5},
  // horses don't make goods: feed them a carrot and they give pony rides to visitors for coins
  horse:{n:"Horse",e:"🐴",feed:"carrot",out:null,coins:45,time:150,xp:4,lvl:5,pen:"Horse paddock",penE:"🐴",penCost:600,cost:350,max:4},
};
export const outE = (a) => a.out ? ITEMS[a.out].e : "🪙";
const outName = (a) => a.out ? ITEMS[a.out].n.toLowerCase() : "coins from pony rides";
export const NAMES = {
  chicken:["Clucky", "Nugget", "Henrietta", "Pip", "Goldie", "Peep", "Ginger"], cow:["Bessie", "Clover", "Buttercup", "Mabel", "Daisy", "Moo-Moo"],
  sheep:["Woolly", "Fluffy", "Cotton", "Dolly", "Snowball"], horse:["Spirit", "Maple", "Thunder", "Honey", "Star", "Biscuit"],
  dog:["Buddy", "Max", "Bella", "Rusty", "Sunny"], cat:["Whiskers", "Mittens", "Ginger", "Luna", "Tiger"],
};
// Pets roam the farm. Make them happy and they bring you little gifts.
export const PETS = {
  dog:{n:"Dog", e:"🐕", cost:300, lvl:2, verb:"dug up", toy:"🎾"},
  cat:{n:"Cat", e:"🐈", cost:300, lvl:3, verb:"found", toy:"🧶"},
};
const PET_CD = 20 * 60e3, BRUSH_CD = 2 * 3600e3, PLAY_CD = 3600e3, TREAT_CD = 4 * 3600e3, GIFT_CD = 6 * 3600e3;
export const BUILDINGS = {
  feedmill:{n:"Feed Mill",e:"🏭",lvl:1,cost:0,recipes:["chicken_feed","flour","fertilizer","cow_feed","sheep_feed"]},
  bakery:{n:"Bakery",e:"🥖",lvl:2,cost:120,recipes:["bread","cornbread","cookie","cake"]},
  sugarmill:{n:"Sugar Mill",e:"🍬",lvl:4,cost:250,recipes:["sugar"]},
  dairy:{n:"Dairy",e:"🧀",lvl:4,cost:300,recipes:["butter","cheese"]},
  kitchen:{n:"Kitchen",e:"🍳",lvl:5,cost:450,recipes:["tomato_soup","carrot_pie","strawberry_jam","pumpkin_pie","pizza"]},
  loom:{n:"Loom",e:"🧵",lvl:8,cost:600,recipes:["sweater"]},
};
export const RECIPES = {
  chicken_feed:{in:{wheat:2,corn:1},out:3,time:30,xp:1}, cow_feed:{in:{corn:2,soybean:1},out:3,time:60,xp:1}, sheep_feed:{in:{soybean:2,carrot:1},out:3,time:90,xp:2},
  flour:{in:{wheat:3},out:2,time:40,xp:1}, fertilizer:{in:{wheat:1,corn:1},out:2,time:45,xp:1}, // wheat → flour → bread, cookies, pies, cake, pizza
  bread:{in:{flour:2},out:1,time:60,xp:2}, cornbread:{in:{corn:2,egg:2},out:1,time:120,xp:4}, cookie:{in:{flour:1,egg:1,sugar:1},out:1,time:180,xp:5},
  sugar:{in:{sugarcane:1},out:1,time:90,xp:2}, butter:{in:{milk:2},out:1,time:120,xp:4}, cheese:{in:{milk:3},out:1,time:180,xp:6},
  tomato_soup:{in:{tomato:3,carrot:1},out:1,time:180,xp:5}, carrot_pie:{in:{carrot:3,egg:2,flour:1},out:1,time:240,xp:7},
  strawberry_jam:{in:{strawberry:3,sugar:1},out:1,time:240,xp:7}, pumpkin_pie:{in:{pumpkin:1,egg:2,sugar:1},out:1,time:300,xp:8}, sweater:{in:{wool:2},out:1,time:300,xp:8},
  cake:{in:{flour:2,egg:2,butter:1,sugar:1},out:1,time:360,xp:10}, pizza:{in:{flour:1,tomato:2,cheese:1},out:1,time:300,xp:10},
};
export const MAX_PLOTS = 30, QUEUE_SLOTS = 3, STAND_MAX = 8;
// more land west of the fields: each deed makes room for 6 more fields
export const LAND = [{lvl:8, cost:1500}, {lvl:12, cost:3000}, {lvl:16, cost:6000}], LAND_FIELDS = 6;
export const maxPlots = () => MAX_PLOTS + LAND_FIELDS * ((S && S.land) || 0);
// crops grow best in their own seasons; out of season they still grow, only half as fast (and never gold)
export const CROP_SEASONS = {wheat:null, corn:["spring", "summer", "fall"], carrot:["spring", "fall", "winter"], soybean:["spring", "summer"],
  sugarcane:["summer", "fall"], tomato:["summer", "fall"], strawberry:["spring", "summer"], pumpkin:["fall", "winter"]};
export const SEASON_E = {spring:"🌸", summer:"☀️", fall:"🍂", winter:"❄️"};
// villagers who stop by with a request; helping them makes friends (up to 5 hearts), and friends pay better
export const VILLAGERS = {
  rosa:{n:"Granny Rosa", e:"👵", pers:"The cheerful baker from town", likes:["good"], hi:["Something smells lovely on your farm!", "My customers can't get enough of your goods."]},
  joe:{n:"Grandpa Joe", e:"👴", pers:"A bit grumpy, but always fair", likes:["crop"], hi:["Hmph. Your fields look... acceptable.", "Back in my day we grew our own. Now I buy yours."]},
  mia:{n:"Mia", e:"👧", pers:"Loves every animal she meets", likes:["animal", "crop"], hi:["Can I say hi to your animals? Pleeease?", "I'm making pancakes with my grandma!"]},
  sam:{n:"Sam", e:"🧔", pers:"Your neighbor, always busy", likes:["crop", "feed"], hi:["Howdy, neighbor! My farm's a mess this week.", "Could you help me out? I'll pay you well."]},
  lily:{n:"Lily", e:"👩", pers:"An artist who paints farm life", likes:["crop", "good"], hi:["The light on your barn is perfect today!", "I need a few things for my picnic painting."]},
};
// Decorations. Some are bought with coins; the rest can only be won in events. rare: 1-3 = event prize tier. hol = holiday prize.
export const DECOR = {
  tulips:{n:"Tulip bed", e:"🌷", cost:30}, sunflowers:{n:"Sunflowers", e:"🌻", cost:40}, roses:{n:"Rose bush", e:"🌹", cost:50},
  oak:{n:"Oak tree", tree:"oak", cost:60}, pine:{n:"Pine tree", tree:"pine", cost:60},
  mailbox:{n:"Mailbox", e:"📫", cost:70}, bench:{n:"Bench", e:"🪑", cost:80}, lantern:{n:"Lantern", e:"🏮", cost:90, glow:true},
  statue:{n:"Stone statue", e:"🗿", cost:300}, fountain:{n:"Fountain", e:"⛲", cost:450, size:2},
  mushroom:{n:"Giant mushroom", e:"🍄", rare:1}, flamingo:{n:"Flamingo", e:"🦩", rare:1}, balloons:{n:"Balloons", e:"🎈", rare:1}, cactus:{n:"Cactus", e:"🌵", rare:1},
  unicorn:{n:"Unicorn", e:"🦄", rare:2}, trophy:{n:"Gold trophy", e:"🏆", rare:2}, tent:{n:"Circus tent", e:"🎪", rare:2, size:2}, rainbow:{n:"Rainbow arch", e:"🌈", rare:2, size:2},
  carousel:{n:"Carousel", e:"🎠", rare:3, size:2}, ferris:{n:"Ferris wheel", e:"🎡", rare:3, size:2}, castle:{n:"Little castle", e:"🏰", rare:3, size:2},
  spider:{n:"Spider web", e:"🕸️", hol:"halloween"}, jack:{n:"Jack-o'-lantern", e:"🎃", hol:"halloween", glow:true}, haunted:{n:"Haunted house", e:"🏚️", hol:"halloween", size:2},
  leaves:{n:"Leaf pile", e:"🍂", hol:"thanksgiving"}, turkey:{n:"Turkey", e:"🦃", hol:"thanksgiving"}, cornucopia:{n:"Harvest basket", e:"🧺", hol:"thanksgiving", size:2},
  gifts:{n:"Gift pile", e:"🎁", hol:"christmas"}, snowman:{n:"Snowman", e:"⛄", hol:"christmas"}, xmastree:{n:"Christmas tree", e:"🎄", hol:"christmas", size:2, glow:true},
  confetti:{n:"Confetti ball", e:"🎊", hol:"newyear"}, popper:{n:"Party popper", e:"🎉", hol:"newyear"}, fireworks:{n:"Firework show", e:"🎆", hol:"newyear", size:2},
  heart:{n:"Gift heart", e:"💝", hol:"valentine"}, letter:{n:"Love letter", e:"💌", hol:"valentine"}, chapel:{n:"Wedding chapel", e:"💒", hol:"valentine", size:2},
  chick:{n:"Little chick", e:"🐣", hol:"easter"}, bunny:{n:"Easter bunny", e:"🐰", hol:"easter"}, eggstatue:{n:"Painted egg", e:"🥚", hol:"easter", size:2},
  clover:{n:"Shamrock", e:"☘️", hol:"stpatrick"}, lucky:{n:"Four-leaf clover", e:"🍀", hol:"stpatrick"}, tophat:{n:"Leprechaun hat", e:"🎩", hol:"stpatrick", size:2},
};
// Random events: reach the goals before time runs out to win decorations.
const EVENTS = {
  harvest:{n:"Harvest Festival", e:"🌾", task:"Harvest crops", metric:"harvest", goals:[20, 50, 100]},
  orders:{n:"Truck Rush", e:"🚚", task:"Deliver truck orders", metric:"orders", goals:[3, 8, 16]},
  eggs:{n:"Egg Hunt", e:"🥚", task:"Collect eggs from your chickens", metric:"egg", goals:[5, 12, 24], need:() => S.pens.chicken.owned},
  milk:{n:"Milk Moo-thon", e:"🥛", task:"Collect milk from your cows", metric:"milk", goals:[4, 10, 20], need:() => S.pens.cow.owned},
  rides:{n:"Pony Parade", e:"🐴", task:"Give pony rides with your horses", metric:"rides", goals:[3, 8, 16], need:() => S.pens.horse.owned},
  love:{n:"Animal Lovers", e:"💖", task:"Pet, brush and play with your animals", metric:"love", goals:[5, 15, 30], need:() => S.pets.length || Object.values(S.pens).some(p => p.owned)},
  wool:{n:"Woolly Week", e:"🧶", task:"Collect wool from your sheep", metric:"wool", goals:[3, 8, 16], need:() => S.pens.sheep.owned},
  bake:{n:"Bake-off", e:"🍞", task:"Make goods in your buildings", metric:"make", goals:[4, 10, 20], need:() => S.buildings.bakery.owned},
  feed:{n:"Feed Frenzy", e:"🟡", task:"Make animal feed", metric:"feed", goals:[9, 24, 48], need:() => S.pens.chicken.owned},
  market:{n:"Market Day", e:"🏪", task:"Earn coins at your roadside shop", metric:"market", goals:[40, 120, 300]},
};
const HOLIDAY_EVENTS = {
  halloween:{n:"Pumpkin Party", e:"🎃", task:"Harvest crops", metric:"harvest", goals:[20, 50, 100], prizes:["spider", "jack", "haunted"]},
  thanksgiving:{n:"Harvest Feast", e:"🦃", task:"Deliver truck orders", metric:"orders", goals:[3, 8, 16], prizes:["leaves", "turkey", "cornucopia"]},
  christmas:{n:"Holiday Cheer", e:"🎄", task:"Deliver truck orders", metric:"orders", goals:[3, 8, 16], prizes:["gifts", "snowman", "xmastree"]},
  newyear:{n:"New Year Party", e:"🎆", task:"Harvest crops", metric:"harvest", goals:[20, 50, 100], prizes:["confetti", "popper", "fireworks"]},
  valentine:{n:"Sweetheart Week", e:"💝", task:"Deliver truck orders", metric:"orders", goals:[3, 8, 16], prizes:["heart", "letter", "chapel"]},
  easter:{n:"Easter Egg Hunt", e:"🐣", task:"Harvest crops", metric:"harvest", goals:[20, 50, 100], prizes:["chick", "bunny", "eggstatue"]},
  stpatrick:{n:"Lucky Clover Hunt", e:"☘️", task:"Harvest crops", metric:"harvest", goals:[20, 50, 100], prizes:["clover", "lucky", "tophat"]},
};
const EVENT_LEN = 24 * 3600e3;
const PRIZE_COINS = [50, 120, 250], PRIZE_GEMS = [0, 1, 2];
export const HOLIDAYS = {
  valentine:{n:"Valentine's Day", e:"💝"}, stpatrick:{n:"St. Patrick's Day", e:"☘️"}, easter:{n:"Easter", e:"🐣"},
  halloween:{n:"Halloween", e:"🎃"}, thanksgiving:{n:"Thanksgiving", e:"🦃"}, christmas:{n:"Christmas", e:"🎄"}, newyear:{n:"New Year", e:"🎆"},
};

// ---------- helpers ----------
const $ = (s) => document.querySelector(s);
export const now = () => Date.now();
const today = () => new Date().toLocaleDateString("en-CA");
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const xpNeed = (lvl) => Math.round(15 * Math.pow(lvl, 1.6));
export const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return s + "s";
  if (s < 3600) return Math.floor(s / 60) + "m" + (s % 60 ? " " + (s % 60) + "s" : "");
  return Math.floor(s / 3600) + "h " + Math.floor((s % 3600) / 60) + "m";
};
export const gemCost = (ms) => Math.max(1, Math.ceil(ms / 300000)); // 1 gem per 5 min left
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const plotCost = () => 40 + (S.plots.length - 6) * 35;
const sprinklerCost = () => 200 * (S.sprinklers + 1);
export const maxSprinklers = () => Math.ceil(maxPlots() / 6);
const barnCost = () => Math.round(80 * Math.pow(1.55, S.barnUps) / 10) * 10;
const orderSlots = () => Math.min(4 + Math.floor(S.level / 2), 9);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));

// ---------- state (the same shape as the 2D game, so a 2D farm can move over) ----------
export const SAVE_KEY = "sunny-acres-3d-v1", SAVE_2D = "sunny-acres-v1";
export let S;
let homeS = null; // your own farm, kept aside while you visit a friend's
// a field: what grows, when it's ready, watered/fertilized, soil health (0-100) and the last crop grown there
const newPlot = () => ({crop:null, end:0, water:0, fert:0, soil:100, soilAt:0, last:null});
function fresh() {
  return {
    v:1, coins:60, gems:5, xp:0, level:1,
    barn:{wheat:3, corn:2}, barnCap:50, barnUps:0,
    plots:Array.from({length:6}, () => newPlot()),
    stand:{slots:4, list:[null, null, null, null]},
    decor:{inv:{}, placed:[]}, event:null, nextEventAt:0, holidayDone:{},
    lastCrop:"wheat",
    pens:{chicken:{owned:false,list:[]}, cow:{owned:false,list:[]}, sheep:{owned:false,list:[]}, horse:{owned:false,list:[]}},
    pets:[],
    buildings:Object.fromEntries(Object.keys(BUILDINGS).map(k => [k, {owned:k === "feedmill", jobs:[]}])),
    orders:[], lastDaily:"",
    stats:{orders:0, harvests:0, made:0, earned:0, gold:0, water:0, visitors:0, rush:0},
    style:{}, tut:0,
    gold:{},                          // how many of each item in the barn are gold quality (sell for double)
    sprinklers:0, land:0,             // automation and extra land
    perks:{grow:0, sell:0, owed:0},   // level-up perks: every 5 levels, pick faster crops or better prices
    quests:null, ach:{}, museum:{},   // daily quests, achievements claimed, the collection
    rush:null, nextRushAt:0,          // a limited-time order
    visitor:null, nextVisitorAt:0, villagers:{}, // who is visiting, and friendship with each villager
    layout:{b:{}, t:{}}, // where buildings and the big trees stand after Edit mode (3D only)
  };
}
// fill in anything a save from an older version (or from the 2D game) is missing
function upgrade(saved) {
  // compare against a separate fresh farm: the one being filled in can't also be the reference
  const def = fresh(), s = Object.assign(fresh(), saved);
  s.buildings = s.buildings || {}; s.pens = s.pens || {};
  for (const k in def.buildings) { const b = s.buildings[k] = s.buildings[k] || def.buildings[k]; b.jobs = Array.isArray(b.jobs) ? b.jobs : []; }
  for (const k in def.pens) { const p = s.pens[k] = s.pens[k] || def.pens[k]; p.owned = !!p.owned; p.list = Array.isArray(p.list) ? p.list : []; if (p.owned && !p.list.length) p.list.push(0); }
  s.stats = Object.assign(def.stats, s.stats);
  s.barn = s.barn || {};
  s.plots = (Array.isArray(s.plots) && s.plots.length ? s.plots : def.plots).map(p => Object.assign(newPlot(), p));
  s.gold = s.gold && typeof s.gold === "object" ? s.gold : {};
  s.sprinklers = s.sprinklers | 0; s.land = s.land | 0;
  s.perks = Object.assign({grow:0, sell:0, owed:0}, s.perks);
  s.perks.owed = Math.max(s.perks.owed | 0, Math.floor((s.level || 1) / 5) - s.perks.grow - s.perks.sell); // farms from before perks get their picks too
  s.ach = s.ach || {}; s.museum = s.museum || {}; s.villagers = s.villagers || {};
  s.stand = s.stand && Array.isArray(s.stand.list) ? s.stand : def.stand;
  while (s.stand.list.length < s.stand.slots) s.stand.list.push(null);
  s.pets = (Array.isArray(s.pets) ? s.pets : []).filter(p => p && PETS[p.kind]);
  s.orders = Array.isArray(s.orders) ? s.orders : [];
  s.holidayDone = s.holidayDone || {};
  s.decor = s.decor || {inv:{}, placed:[]}; s.decor.inv = s.decor.inv || {};
  s.decor.placed = (s.decor.placed || []).filter(d => DECOR[d.id]);
  s.style = s.style || {};
  s.layout = s.layout && typeof s.layout === "object" ? s.layout : {}; s.layout.b = s.layout.b || {}; s.layout.t = s.layout.t || {};
  return s;
}
export function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { S = upgrade(JSON.parse(raw)); return "3d"; } } catch (e) {}
  S = fresh();
  try { if (localStorage.getItem(SAVE_2D)) return "has2d"; } catch (e) {} // the 2D game lives on the same site: offer to bring it over
  return "new";
}
let restoring = false; // stops the page from re-saving the old farm while a backup is being loaded
// visit a friend's farm: their farm is shown instead of yours (read-only), and nothing is saved until you go home
export function visitFarm(saved) {
  if (!homeS) homeS = S;
  const v = upgrade(saved); v.tut = TUT.length; v.event = null; v.nextEventAt = 9e15; // no tutorial or event pop-ups on someone else's farm
  S = v; closePanel(); view.refresh("all"); renderHud();
}
export function leaveVisit() { if (!homeS) return; S = homeS; homeS = null; view.refresh("all"); renderHud(); }
export const isVisiting = () => !!homeS;
export function save() {
  if (restoring || window.__saHold || homeS) return; // never save while visiting a friend's farm // __saHold: accounts (auth.js) are swapping in the farm from the cloud and reloading
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  window.dispatchEvent(new Event("sa3d:saved")); // accounts back the farm up to the cloud
}

// ---------- inventory ----------
export const have = (id) => S.barn[id] || 0;
export const barnUsed = () => Object.values(S.barn).reduce((a, b) => a + b, 0);
export const space = () => S.barnCap - barnUsed();
function add(id, n) { S.barn[id] = have(id) + n; }
function take(id, n) { // plain ones go first; gold ones are kept for last
  S.barn[id] = have(id) - n; if (S.barn[id] <= 0) delete S.barn[id];
  if (S.gold[id] > have(id)) S.gold[id] = have(id); if (!S.gold[id]) delete S.gold[id];
}
export const goldOf = (id) => Math.min(S.gold[id] || 0, have(id));
function addGold(id, n) { S.gold[id] = goldOf(id) + n; S.stats.gold += n; track("gold", n); }
export const sellPrice = (id) => Math.round(ITEMS[id].p * (1 + .1 * S.perks.sell)); // the "Haggler" perk
export const hasAll = (req) => Object.entries(req).every(([id, n]) => have(id) >= n);

// ---------- progression ----------
export function gainXP(n) {
  S.xp += n;
  while (S.xp >= xpNeed(S.level)) {
    S.xp -= xpNeed(S.level);
    S.level++;
    S.gems += 2;
    S.coins += 20 * S.level;
    showLevelUp(S.level, unlocksAt(S.level));
    if (S.level % 5 === 0) { S.perks.owed++; popup("perk"); }
    fillOrders();
    view.refresh("all");
  }
}
function unlocksAt(lvl) {
  const out = [];
  for (const id of Object.keys(CROPS)) if (ITEMS[id].lvl === lvl) out.push(ITEMS[id].e + " " + ITEMS[id].n + " seeds");
  for (const a of Object.values(ANIMALS)) if (a.lvl === lvl) out.push(a.penE + " " + a.pen);
  for (const P of Object.values(PETS)) if (P.lvl === lvl) out.push(P.e + " A pet " + P.n.toLowerCase() + " in the Shop");
  for (const b of Object.values(BUILDINGS)) if (b.lvl === lvl && b.cost) out.push(b.e + " " + b.n);
  for (const id of Object.keys(RECIPES)) if (ITEMS[id].lvl === lvl) out.push(ITEMS[id].e + " " + ITEMS[id].n + " recipe");
  if (lvl === 3) out.push("⏰ Rush orders and 👋 visitors");
  if (lvl === 5) out.push("💦 Sprinklers in the Shop");
  LAND.forEach(L => { if (L.lvl === lvl) out.push("🗺️ More land in the Shop"); });
  if (lvl % 5 === 0) out.push("🎁 Choose a perk");
  return out;
}

// ---------- fields ----------
export function isRaining() { const w = weatherNow(); return !!w && (w.kind === "rain" || w.kind === "storm"); }
export function heatwave() { const w = weatherNow(); return !!w && w.temp != null && w.temp >= (w.unit === "°F" ? 90 : 32); }
export const inSeason = (crop) => !CROP_SEASONS[crop] || CROP_SEASONS[crop].includes(THEME.season);
// an empty field rests and slowly gets its strength back (+10 an hour)
export const soilNow = (p) => p.crop ? p.soil : Math.min(100, p.soil + Math.max(0, now() - (p.soilAt || 0)) / 36e4);
export const soilWord = (v) => v >= 70 ? "🟢 Healthy soil" : v >= 40 ? "🟡 Tired soil" : "🔴 Worn-out soil";
export const sprinkled = (i) => i < S.sprinklers * 6;
// how long a crop takes on this field: season, soil, perks, and water (a heatwave slows crops nobody watered)
export function growTime(crop, p) {
  let t = CROPS[crop].time * 1000;
  if (!inSeason(crop)) t *= 2;
  if (soilNow(p) < 40) t *= 1.25;
  t *= Math.max(.5, 1 - .1 * S.perks.grow);
  return t * (p.water ? .75 : heatwave() ? 1.2 : 1);
}
export const goldChance = (p) => !inSeason(p.crop) ? 0 : .05 + (p.water ? .1 : 0) + (p.fert ? .35 : 0) + (p.soil >= 70 ? .05 : 0);
export function plant(i, crop, quiet) {
  const p = S.plots[i], c = CROPS[crop];
  if (!p || p.crop || ITEMS[crop].lvl > S.level) return false;
  if (have(crop) > 0) take(crop, 1);
  else if (S.coins >= c.seed) S.coins -= c.seed;
  else { if (!quiet) { toast("Not enough coins for " + ITEMS[crop].n + " seeds"); sfx("error"); } return false; }
  p.soil = soilNow(p); p.soilAt = now();
  p.crop = crop; p.water = isRaining() || sprinkled(i) ? 1 : 0; p.hot = !p.water && heatwave() ? 1 : 0; // rain and sprinklers water for you
  p.dur = growTime(crop, p); p.end = now() + p.dur; S.lastCrop = crop;
  sfx("plant");
  return true;
}
// watering: a growing crop finishes 25% sooner (and shrugs off a heatwave)
export function waterPlot(i, quiet) {
  const p = S.plots[i];
  if (!p || !p.crop || p.water || p.end <= now()) return false;
  const left = p.end - now(); p.end = now() + left * .75 / (p.hot ? 1.2 : 1); p.water = 1; p.hot = 0;
  S.stats.water++; track("water", 1);
  if (!quiet) { sfx("water"); view.fx("plot:" + i, "💧"); view.refresh("plots"); commit(); }
  return true;
}
export function waterAll() {
  let n = 0; S.plots.forEach((_, i) => { if (waterPlot(i, true)) n++; });
  if (n) { sfx("water"); toast("💧 Watered " + n + " field" + (n > 1 ? "s" : "")); view.refresh("plots"); commit(); }
  return n;
}
export const thirsty = () => S.plots.filter(p => p.crop && !p.water && p.end > now()).length;
// fertilizer (made at the Feed Mill): much better odds of a gold harvest, and the soil gets stronger
export function fertilize(i) {
  const p = S.plots[i];
  if (!p || p.fert) return false;
  if (have("fertilizer") < 1) { toast("You need 🧪 fertilizer. Make it at the Feed Mill."); sfx("error"); return false; }
  take("fertilizer", 1); p.soil = Math.min(100, soilNow(p) + 25); p.soilAt = now(); p.fert = 1;
  sfx("magic"); view.fx("plot:" + i, "🧪"); commit();
  return true;
}
export function harvest(i, quiet) {
  const p = S.plots[i];
  if (!p || !p.crop || p.end > now()) return false;
  if (space() < 2) { if (!quiet) barnFull(); return "full"; }
  const crop = p.crop, gold = Math.random() < goldChance(p);
  view.fx("plot:" + i, (gold ? "🥇 +2 " : "+2 ") + ITEMS[crop].e);
  add(crop, 2); if (gold) { addGold(crop, 2); view.sparkle("plot:" + i); }
  gainXP(CROPS[crop].xp); S.stats.harvests++; sfx("harvest"); if (gold) sfx("magic"); eventProgress("harvest", 2);
  // crop rotation: the same crop again wears the soil out, a different one freshens it up
  p.soil = clamp(p.soil + (p.last === crop ? -15 : 10), 0, 100); p.soilAt = now(); p.last = crop;
  p.crop = null; p.end = 0; p.water = 0; p.fert = 0; p.hot = 0;
  return true;
}
export function speedPlot(i) {
  const p = S.plots[i], left = p.end - now();
  if (!p.crop || left <= 0) return;
  const cost = gemCost(left);
  if (S.gems < cost) return toast("Not enough 💎");
  S.gems -= cost; p.end = now(); sfx("magic"); view.closeTrays(); commit();
}

// ---------- animals ----------
export function feedOne(kind, i) {
  const a = ANIMALS[kind], pen = S.pens[kind];
  if (pen.list[i] !== 0 || have(a.feed) < 1) return false;
  take(a.feed, 1); pen.list[i] = now() + a.time * 1000 * (loveOf(meta(kind, i)) >= 70 ? .8 : 1); // happy animals work faster
  sfx("feed");
  return true;
}
export function feedAll(kind) {
  const a = ANIMALS[kind], pen = S.pens[kind];
  let n = 0;
  pen.list.forEach((_, i) => { if (feedOne(kind, i)) n++; });
  if (n) toast("Fed " + n + " " + a.e);
  else if (pen.list.some(e => e === 0)) toast("You need " + ITEMS[a.feed].n + ". " + (a.feed === "carrot" ? "Grow some in your fields." : "Make it at the Feed Mill."));
  commit();
  return n;
}
export function collectAnimal(kind, i) {
  const a = ANIMALS[kind], pen = S.pens[kind], end = pen.list[i];
  if (!end || end > now()) return false;
  const happy = loveOf(meta(kind, i)) >= 70;
  if (!a.out) { // horse: pony-ride money
    const c = Math.round(a.coins * (happy ? 1.25 : 1));
    S.coins += c; S.stats.earned += c; gainXP(a.xp); pen.list[i] = 0; eventProgress("rides", 1);
    view.fx("animal:" + kind + ":" + i, "+" + c + " 🪙"); sfx("coin"); sfx(kind);
    return true;
  }
  const n = happy && Math.random() < .25 && space() >= 2 ? 2 : 1; // happy animals sometimes make double
  if (space() < 1) { barnFull(); return false; }
  const gold = happy && Math.random() < .3; // and very happy ones sometimes make gold-quality goods
  add(a.out, n); if (gold) addGold(a.out, n); gainXP(a.xp); pen.list[i] = 0; eventProgress(a.out, n);
  view.fx("animal:" + kind + ":" + i, (gold ? "🥇 " : "") + (n > 1 ? "×2! " : "+1 ") + ITEMS[a.out].e); sfx(kind);
  return true;
}
export function collectAll(kind) {
  let n = 0;
  S.pens[kind].list.forEach((_, i) => { if (collectAnimal(kind, i)) n++; });
  commit();
  return n;
}

// ---------- names, happiness and petting ----------
export function meta(kind, i) {
  const pen = S.pens[kind];
  pen.meta = pen.meta || [];
  if (!pen.meta[i]) {
    const used = new Set(pen.meta.filter(Boolean).map(m => m.name)), free = NAMES[kind].filter(n => !used.has(n));
    pen.meta[i] = {name:pick(free.length ? free : NAMES[kind]), love:50, loveAt:now(), petAt:0, brushAt:0, playAt:0};
  }
  return pen.meta[i];
}
export const loveOf = (m) => clamp(m.love - (now() - m.loveAt) / 8.64e6, 0, 100); // fades by about 10 a day
function addLove(m, n) { m.love = clamp(loveOf(m) + n, 0, 100); m.loveAt = now(); }
export const hearts = (m) => { const n = Math.round(loveOf(m) / 20); return "❤️".repeat(n) + "🤍".repeat(5 - n); };
export const cdLeft = (at, cd) => Math.max(0, at + cd - now());
// act: pet | brush | play | treat. Returns true if something happened.
export function interact(m, sound, act, key) {
  const t = now(), CD = {pet:PET_CD, brush:BRUSH_CD, play:PLAY_CD, treat:TREAT_CD}[act], k = act + "At";
  if (cdLeft(m[k] || 0, CD)) return false;
  if (act === "treat") { if (S.coins < 10) { toast("Need 10 🪙"); sfx("error"); return false; } S.coins -= 10; }
  m[k] = t;
  addLove(m, {pet:15, brush:25, play:20, treat:30}[act]);
  gainXP(act === "pet" ? 1 : 2);
  eventProgress("love", 1);
  view.fx(key, "+ 💖"); sfx(sound);
  commit();
  return true;
}

// ---------- pets ----------
export function buyPet(kind) {
  const P = PETS[kind];
  if (S.level < P.lvl || S.pets.some(p => p.kind === kind)) return false;
  if (S.coins < P.cost) { toast("Need " + P.cost + " 🪙"); sfx("error"); return false; }
  S.coins -= P.cost;
  const name = pick(NAMES[kind]);
  S.pets.push({kind, name, love:60, loveAt:now(), petAt:0, playAt:0, treatAt:0, giftAt:now()});
  toast("Say hi to " + name + "! " + P.e); sfx(kind); view.refresh("herd"); commit();
  return true;
}
export const giftReady = (p) => loveOf(p) >= 40 && now() - p.giftAt > GIFT_CD;
export function petGift(j) {
  const p = S.pets[j], P = PETS[p.kind];
  if (!giftReady(p)) return false;
  p.giftAt = now();
  const r = Math.random(), key = "pet:" + j;
  if (r < .06) {
    const id = pick(Object.keys(DECOR).filter(k => DECOR[k].rare === 1));
    S.decor.inv[id] = (S.decor.inv[id] || 0) + 1;
    toast(p.name + " " + P.verb + " a " + DECOR[id].n + "! It's in your 🌷 Decor box.");
    view.fx(key, "+1 " + DECOR[id].e);
  } else if (r < .22) {
    S.gems++; toast(p.name + " " + P.verb + " a 💎 gem!"); view.fx(key, "+1 💎");
  } else {
    const c = 20 + S.level * 6; S.coins += c; S.stats.earned += c;
    toast(p.name + " " + P.verb + " " + c + " 🪙!"); view.fx(key, "+" + c + " 🪙");
  }
  sfx("coin"); sfx(p.kind); commit();
  return true;
}

// ---------- buildings ----------
export function startJob(bid, rid) {
  const b = S.buildings[bid], r = RECIPES[rid];
  if (b.jobs.length >= QUEUE_SLOTS) return toast("Queue is full. Collect finished goods first.");
  if (!hasAll(r.in)) return toast("Missing ingredients");
  for (const [id, n] of Object.entries(r.in)) take(id, n);
  const last = b.jobs[b.jobs.length - 1];
  const start = Math.max(now(), last ? last.end : 0);
  b.jobs.push({r:rid, end:start + r.time * 1000, dur:r.time * 1000});
  sfx("make");
  tutEvent("make");
  commit();
}
export function collectJobs(bid) {
  const b = S.buildings[bid];
  let n = 0;
  while (b.jobs.length && b.jobs[0].end <= now()) {
    const j = b.jobs[0], r = RECIPES[j.r];
    if (space() < r.out) { barnFull(); break; }
    add(j.r, r.out); gainXP(r.xp); S.stats.made += r.out; b.jobs.shift(); n++;
    eventProgress(ITEMS[j.r].kind === "feed" ? "feed" : "make", r.out);
    view.fx("building:" + bid, "+" + r.out + " " + ITEMS[j.r].e);
  }
  if (n) sfx("collect");
  commit();
  return n;
}
function speedJob(bid) {
  const b = S.buildings[bid], t = now();
  const j = b.jobs.find(j => j.end > t);
  if (!j) return;
  const left = j.end - t, cost = gemCost(left);
  if (S.gems < cost) return toast("Not enough 💎. Earn more by leveling up and filling orders.");
  S.gems -= cost; sfx("magic");
  b.jobs.forEach(x => { if (x.end > t) x.end -= left; }); // pull this job and the ones behind it forward
  commit();
}

// ---------- orders ----------
function producible() {
  const out = [];
  for (const [id, it] of Object.entries(ITEMS)) {
    if (it.lvl > S.level) continue;
    if (it.kind === "crop") out.push(id);
    else if (it.kind === "animal") { const a = Object.keys(ANIMALS).find(k => ANIMALS[k].out === id); if (S.pens[a].owned && S.pens[a].list.length) out.push(id); }
    else {
      const bid = Object.keys(BUILDINGS).find(k => BUILDINGS[k].recipes.includes(id));
      if (S.buildings[bid].owned && (it.kind !== "feed" || S.level < 3)) out.push(id);
    }
  }
  return out;
}
function genOrder() {
  const pool = producible();
  const kinds = Math.min(pool.length, rand(1, S.level < 3 ? 2 : 3));
  const items = {};
  while (Object.keys(items).length < kinds) {
    const id = pick(pool);
    if (items[id]) continue;
    const k = ITEMS[id].kind;
    items[id] = k === "crop" ? rand(2, 3 + Math.min(S.level, 5)) : k === "good" ? rand(1, 2) : rand(1, 3);
  }
  const value = Object.entries(items).reduce((a, [id, n]) => a + ITEMS[id].p * n, 0);
  return {items, coins:Math.round(value * 1.35 + 4), xp:Math.max(2, Math.round(value / 4)), gem:Math.random() < 0.12 ? 1 : 0, wait:0};
}
export function fillOrders() { while (S.orders.length < orderSlots()) S.orders.push(genOrder()); }
export const readyOrders = () => S.orders.filter(o => !o.wait && hasAll(o.items)).length + (S.rush && S.rush.end > now() && hasAll(S.rush.items) ? 1 : 0);
function deliver(i) {
  const o = S.orders[i];
  if (!o || o.wait || !hasAll(o.items)) return;
  for (const [id, n] of Object.entries(o.items)) take(id, n);
  S.coins += o.coins; S.gems += o.gem; S.stats.orders++; S.stats.earned += o.coins;
  const bonus = S.stats.orders % 10 === 0 ? 1 : 0; // a free gem every 10 orders
  S.gems += bonus;
  toast("🚚 +" + o.coins + " 🪙" + (o.gem + bonus ? "  +" + (o.gem + bonus) + " 💎" : "") + "  +" + o.xp + " ⭐");
  view.fx("board", "+" + o.coins + " 🪙");
  S.orders[i] = {wait:now() + 8000};
  eventProgress("orders", 1);
  sfx("truck"); sfx("coin");
  gainXP(o.xp);
  tutEvent("deliver");
  commit();
}
function discard(i) {
  S.orders[i] = {wait:now() + 45000};
  toast("Order removed. A new one arrives soon.");
  commit();
}

// ---------- barn / shop ----------
function sell(id, n) {
  n = Math.min(n, have(id));
  if (!n) return;
  const g = Math.min(n, goldOf(id)), coins = sellPrice(id) * (n + g); // gold ones go first, for double
  S.gold[id] = goldOf(id) - g; take(id, n); S.coins += coins; S.stats.earned += coins; sfx("coin");
  toast("Sold " + n + " " + ITEMS[id].e + (g ? " (" + g + " 🥇)" : "") + " for " + coins + " 🪙");
  commit();
}
function upgradeBarn() {
  const c = barnCost();
  if (S.coins < c) return toast("Need " + c + " 🪙");
  S.coins -= c; S.barnUps++; S.barnCap += 25; sfx("build"); toast("Barn now holds " + S.barnCap); commit();
}
export function buyPlot() {
  if (S.plots.length >= maxPlots()) return false;
  const c = plotCost();
  if (S.coins < c) { toast("Need " + c + " 🪙"); sfx("error"); return false; }
  S.coins -= c; S.plots.push(newPlot()); toast("New field ready!"); sfx("build"); view.refresh("plots"); commit();
  return true;
}
export function buyBuilding(bid) {
  const b = BUILDINGS[bid];
  if (S.level < b.lvl || S.buildings[bid].owned) return false;
  if (S.coins < b.cost) { toast("Need " + b.cost + " 🪙"); sfx("error"); return false; }
  S.coins -= b.cost; S.buildings[bid].owned = true; toast(b.n + " built!"); sfx("build"); fillOrders(); view.refresh("buildings"); commit();
  return true;
}
export function buyPen(kind) {
  const a = ANIMALS[kind];
  if (S.level < a.lvl || S.pens[kind].owned) return false;
  if (S.coins < a.penCost) { toast("Need " + a.penCost + " 🪙"); sfx("error"); return false; }
  S.coins -= a.penCost; S.pens[kind].owned = true; S.pens[kind].list.push(0); sfx("build"); sfx(kind);
  toast(a.pen + " ready, with your first " + a.n.toLowerCase() + "!"); fillOrders(); view.refresh("herd"); commit();
  return true;
}
export function buyAnimal(kind) {
  const a = ANIMALS[kind], pen = S.pens[kind];
  if (!pen.owned || pen.list.length >= a.max) return false;
  if (S.coins < a.cost) { toast("Need " + a.cost + " 🪙"); sfx("error"); return false; }
  S.coins -= a.cost; pen.list.push(0); sfx(kind); toast("A new " + a.n.toLowerCase() + " joined the farm!"); view.refresh("herd"); commit();
  return true;
}
export const dailyReady = () => S.lastDaily !== today();
export function claimDaily() {
  if (!dailyReady()) return false;
  S.lastDaily = today();
  const c = 25 + 5 * S.level;
  S.coins += c; S.gems += 1;
  view.fx("gift", "+" + c + " 🪙"); sfx("level");
  toast("🎁 Daily gift: +" + c + " 🪙  +1 💎"); commit();
  return true;
}

// ---------- roadside shop ----------
// Put items out with your own price. Townsfolk buy them over time: the higher the price, the longer it takes.
const standSlotCost = () => 150 * Math.pow(2, S.stand.slots - 4);
function priceRange(id, qty) {
  const base = sellPrice(id) * qty;
  return {base, min:Math.max(1, Math.floor(base * .8)), max:Math.ceil(base * 1.6), step:Math.max(1, Math.round(base * .1))};
}
const saleSecs = (id, qty, price) => Math.round(20 + 200 * clamp((price / (ITEMS[id].p * qty) - .8) / .8, 0, 1));
function standList(slot, id, qty, price) {
  if (S.stand.list[slot] || have(id) < qty || qty < 1) return false;
  take(id, qty);
  S.stand.list[slot] = {id, qty, price, sellAt:now() + saleSecs(id, qty, price) * (800 + Math.random() * 400)};
  sfx("place"); view.refresh("stand"); commit();
  return true;
}
function standCollect(slot) {
  const L = S.stand.list[slot];
  if (!L || L.sellAt > now()) return false;
  S.coins += L.price; S.stats.earned += L.price; S.stand.list[slot] = null; eventProgress("market", L.price);
  view.fx("stand", "+" + L.price + " 🪙");
  return true;
}
export function standCollectAll() {
  let n = 0;
  S.stand.list.forEach((_, j) => { if (standCollect(j)) n++; });
  if (n) { sfx("coin"); view.refresh("stand"); commit(); }
  return n;
}
export const standSold = () => S.stand.list.filter(L => L && L.sellAt <= now()).length;
function standCancel(slot) {
  const L = S.stand.list[slot];
  if (!L || L.sellAt <= now()) return;
  if (space() < L.qty) return barnFull();
  add(L.id, L.qty); S.stand.list[slot] = null; view.refresh("stand"); commit();
}
function buyStandSlot() {
  if (S.stand.slots >= STAND_MAX) return;
  const c = standSlotCost();
  if (S.coins < c) { toast("Need " + c + " 🪙"); sfx("error"); return; }
  S.coins -= c; S.stand.slots++; S.stand.list.push(null); sfx("build"); commit();
}

// ---------- decorations ----------
export function placeDecor(id) {
  if (!S.decor.inv[id]) return false;
  const spot = view.freeDecorSpot(DECOR[id].size || 1);
  if (!spot) { toast("No free space here. Turn the camera to an open patch of grass and try again."); sfx("error"); return false; }
  S.decor.placed.push({id, x:spot.x, z:spot.z});
  if (!--S.decor.inv[id]) delete S.decor.inv[id];
  sfx("place"); toast("Placed! Drag it where you like, then tap Done."); view.refresh("decor"); commit();
  view.focus("decor:" + (S.decor.placed.length - 1)); view.moveDecor(S.decor.placed.length - 1);
  return true;
}
function buyDecor(id) {
  const D = DECOR[id];
  if (!D.cost) return;
  if (S.coins < D.cost) { toast("Need " + D.cost + " 🪙"); sfx("error"); return; }
  S.coins -= D.cost; S.decor.inv[id] = (S.decor.inv[id] || 0) + 1; sfx("coin");
  closePanel(); placeDecor(id);
}
export function storeDecor(j) {
  const d = S.decor.placed[j];
  if (!d) return;
  S.decor.placed.splice(j, 1);
  S.decor.inv[d.id] = (S.decor.inv[d.id] || 0) + 1;
  toast(DECOR[d.id].n + " put away in your Decor box"); sfx("pickup"); view.refresh("decor"); commit();
}
export const decorIcon = (id) => DECOR[id].tree ? (DECOR[id].tree === "pine" ? "🌲" : "🌳") : DECOR[id].e;
const decorTag = (D) => D.hol ? `<span class="tag hol">${HOLIDAYS[D.hol].n}</span>` : D.rare ? `<span class="tag r${D.rare}">${["", "Event prize", "Rare prize", "Grand prize"][D.rare]}</span>` : "";

// ---------- special events ----------
// Level-ups and prizes can happen at the same moment, so they wait their turn.
const popups = [];
function popup(type, arg) {
  if (opts.quiet) return;
  if (view.busy() || (panel && (panel.type === "level" || panel.type === "prize" || panel.type === "confirm" || panel.type === "perk"))) { popups.push([type, arg]); return; }
  openPanel(type, arg);
}
const evDef = (ev = S.event) => ev.type.startsWith("h:") ? HOLIDAY_EVENTS[ev.type.slice(2)] : EVENTS[ev.type];
function eventTick() {
  const t = now();
  if (S.event && S.event.end <= t) { S.event = null; S.nextEventAt = t + rand(2, 8) * 3600e3; save(); }
  // a new holiday interrupts the wait for the next random event
  const hol = THEME.holiday, hk = hol && hol + new Date().getFullYear();
  if (!S.event && S.level >= 2 && (t >= (S.nextEventAt || 0) || (hol && !S.holidayDone[hk]))) startEvent();
}
function startEvent() {
  const hol = THEME.holiday, hk = hol && hol + new Date().getFullYear();
  let type, def;
  if (hol && !S.holidayDone[hk]) { type = "h:" + hol; def = HOLIDAY_EVENTS[hol]; S.holidayDone[hk] = 1; }
  else {
    const opts = Object.keys(EVENTS).filter(k => !EVENTS[k].need || EVENTS[k].need());
    type = pick(opts); def = EVENTS[type];
  }
  const prizes = def.prizes || [1, 2, 3].map(r => pick(Object.keys(DECOR).filter(k => DECOR[k].rare === r)));
  S.event = {type, start:now(), end:now() + EVENT_LEN, prog:0, won:0, prizes};
  save(); sfx("level");
  if (!panel && !view.busy() && !tutActive() && !opts.quiet) openPanel("event", {fresh:true});
  else toast(def.e + " A new event started: " + def.n + "!");
}
function eventProgress(metric, n) {
  track(metric, n);
  const ev = S.event;
  if (!ev || ev.end <= now() || evDef(ev).metric !== metric) return;
  ev.prog += n;
  const goals = evDef(ev).goals;
  while (ev.won < 3 && ev.prog >= goals[ev.won]) {
    const tier = ev.won++, id = ev.prizes[tier];
    S.decor.inv[id] = (S.decor.inv[id] || 0) + 1;
    S.coins += PRIZE_COINS[tier]; S.gems += PRIZE_GEMS[tier];
    sfx("level"); popup("prize", {id, tier});
  }
}


/* ============================================================
   MORE TO DO: rush orders, visitors, daily quests, achievements, the collection, perks, sprinklers and land
   ============================================================ */
// ---------- rush orders: a bigger order that has to go out within 20 minutes ----------
const RUSH_LEN = 20 * 60e3;
function rushTick() {
  const t = now();
  if (S.rush && S.rush.end <= t) { S.rush = null; S.nextRushAt = t + rand(30, 90) * 60e3; toast("⏰ The rush order's truck left. Another one will come."); save(); }
  if (S.rush || S.level < 3) return;
  if (!S.nextRushAt) { S.nextRushAt = t + rand(5, 15) * 60e3; save(); return; } // the first one comes a little after level 3
  if (t < S.nextRushAt) return;
  const o = genOrder();
  for (const id in o.items) o.items[id] += ITEMS[id].kind === "crop" ? 2 : 1;
  const value = Object.entries(o.items).reduce((a, [id, n]) => a + ITEMS[id].p * n, 0);
  S.rush = {items:o.items, coins:Math.round(value * 2.2 + 10), xp:Math.max(4, Math.round(value / 3)), gem:Math.random() < .5 ? 1 : 0, end:t + RUSH_LEN};
  save(); sfx("truck"); toast("⏰ Rush order! Fill it in 20 minutes for a big reward. See 🚚 Orders.");
}
function deliverRush() {
  const o = S.rush;
  if (!o || o.end <= now() || !hasAll(o.items)) return;
  for (const [id, n] of Object.entries(o.items)) take(id, n);
  S.coins += o.coins; S.gems += o.gem; S.stats.orders++; S.stats.rush++; S.stats.earned += o.coins;
  toast("⏰ Rush order delivered! +" + o.coins + " 🪙" + (o.gem ? "  +" + o.gem + " 💎" : "") + "  +" + o.xp + " ⭐");
  view.fx("board", "+" + o.coins + " 🪙"); sfx("truck"); sfx("coin");
  S.rush = null; S.nextRushAt = now() + rand(30, 90) * 60e3;
  eventProgress("orders", 1); track("rush", 1); gainXP(o.xp); commit();
}

// ---------- visitors ----------
const VISIT_LEN = 30 * 60e3;
export const friendOf = (id) => S.villagers[id] || (S.villagers[id] = {h:0, n:0});
function visitorTick() {
  const t = now(), v = S.visitor;
  if (v && v.end <= t) { S.visitor = null; S.nextVisitorAt = t + rand(10, 40) * 60e3; toast(VILLAGERS[v.id].e + " " + VILLAGERS[v.id].n + " headed home. Maybe next time!"); view.refresh("visitor"); save(); }
  if (S.visitor || S.level < 3 || t < (S.nextVisitorAt || 0)) return;
  const ids = Object.keys(VILLAGERS).filter(k => k !== S.lastVisitor), id = pick(ids), V = VILLAGERS[id], f = friendOf(id);
  const all = producible(), liked = all.filter(x => V.likes.includes(ITEMS[x].kind)), pool = liked.length ? liked : all, items = {};
  const kinds = Math.min(pool.length, rand(1, 2));
  while (Object.keys(items).length < kinds) { const x = pick(pool); if (items[x]) continue; const k = ITEMS[x].kind; items[x] = k === "crop" ? rand(3, 6) : k === "good" ? rand(1, 2) : rand(1, 3); }
  const value = Object.entries(items).reduce((a, [x, n]) => a + ITEMS[x].p * n, 0);
  S.visitor = {id, items, coins:Math.round((value * 1.6 + 10) * (1 + .1 * f.h)), xp:Math.max(3, Math.round(value / 3)), end:t + VISIT_LEN, say:pick(V.hi)};
  S.lastVisitor = id; save(); view.refresh("visitor");
  toast(V.e + " " + V.n + " is visiting! Tap them by the path.");
}
function helpVisitor() {
  const v = S.visitor;
  if (!v || !hasAll(v.items)) return;
  const V = VILLAGERS[v.id], f = friendOf(v.id);
  for (const [id, n] of Object.entries(v.items)) take(id, n);
  f.h = Math.min(5, f.h + 1); f.n++;
  const gem = f.h >= 5 ? 1 : 0; // best friends always bring a little extra
  S.coins += v.coins; S.gems += gem; S.stats.visitors++; S.stats.earned += v.coins;
  toast(V.e + " " + V.n + ": \"Thank you, dear!\" +" + v.coins + " 🪙" + (gem ? " +1 💎" : "") + "  +" + v.xp + " ⭐");
  sfx("coin"); sfx("level");
  S.visitor = null; S.nextVisitorAt = now() + rand(10, 40) * 60e3;
  track("visitor", 1); gainXP(v.xp); closePanel(); view.refresh("visitor"); commit();
}
function panelVisitor() {
  const v = S.visitor;
  if (!v) return {title:"Visitors", body:`<p class="center" style="font-weight:800">Nobody is visiting right now. Villagers stop by from level 3.</p>`};
  const V = VILLAGERS[v.id], f = friendOf(v.id), can = hasAll(v.items);
  return {title:V.n, body:`<div class="big">${V.e}</div><p class="center muted" style="font-weight:800;margin:0">${V.pers}</p>
    <p class="center" style="font-weight:800;font-size:16px;margin:8px 0">"${esc(v.say)}"</p>
    <p class="center" style="margin:0">${"💞".repeat(f.h)}${"🤍".repeat(5 - f.h)}</p>
    <div class="slot" style="padding:10px;margin-top:10px"><b>Could you spare:</b><div class="need" style="justify-content:center;margin-top:6px">${needList(v.items)}</div>
    <div class="reward center" style="margin-top:8px;display:flex;gap:12px;justify-content:center;font-weight:800"><span>🪙 ${v.coins}</span><span>⭐ ${v.xp}</span>${f.h >= 4 ? "<span>💎 1</span>" : ""}<span>+💞</span></div></div>
    <p class="center muted" style="font-weight:800;margin:8px 0 0">Leaves in ${timer(v.end)}</p>
    <p class="center" style="margin:12px 0 0;display:flex;gap:8px;justify-content:center"><button class="btn" data-act="helpVisitor" ${can ? "" : "disabled"}>Give</button><button class="btn plain" data-act="closePanel">Not now</button></p>`};
}

// ---------- daily quests ----------
const QUESTS = [
  {m:"harvest", t:"Harvest {n} crops", n:(L) => 10 + 2 * Math.min(L, 15)},
  {m:"orders", t:"Deliver {n} truck orders", n:(L) => 2 + Math.floor(L / 5)},
  {m:"water", t:"Water {n} fields", n:(L) => 6 + Math.min(L, 14)},
  {m:"make", t:"Make {n} goods in your buildings", n:(L) => 2 + Math.floor(L / 4), need:() => S.buildings.bakery.owned},
  {m:"feed", t:"Make {n} animal feed", n:() => 6, need:() => S.pens.chicken.owned},
  {m:"egg", t:"Collect {n} eggs", n:() => 6, need:() => S.pens.chicken.owned},
  {m:"milk", t:"Collect {n} milk", n:() => 4, need:() => S.pens.cow.owned},
  {m:"love", t:"Pet or brush animals {n} times", n:() => 4, need:() => S.pets.length || Object.values(S.pens).some(p => p.owned)},
  {m:"market", t:"Earn {n} 🪙 at your roadside shop", n:(L) => 30 + 10 * Math.min(L, 20)},
  {m:"gold", t:"Grow {n} gold crops or goods", n:() => 2, need:() => S.level >= 3},
  {m:"visitor", t:"Help {n} visitor", n:() => 1, need:() => S.level >= 3},
];
const questDef = (m) => QUESTS.find(q => q.m === m);
const questReward = () => ({coins:20 + 5 * Math.min(S.level, 30), xp:5 + Math.min(S.level, 30)});
export function questsToday() {
  if (S.quests && S.quests.day === today()) return S.quests;
  const pool = QUESTS.filter(q => !q.need || q.need()), list = [];
  while (list.length < 3 && pool.length) { const q = pool.splice(rand(0, pool.length - 1), 1)[0]; list.push({m:q.m, n:q.n(S.level), prog:0, got:0}); }
  S.quests = {day:today(), list, bonus:0};
  return S.quests;
}
function track(metric, n) {
  if (!S || homeS) return;
  let done = false;
  for (const q of questsToday().list) if (q.m === metric && q.prog < q.n) { q.prog = Math.min(q.n, q.prog + n); if (q.prog >= q.n) done = true; }
  if (done) { toast("📜 Quest done! Collect your reward in 📜 Quests."); sfx("collect"); }
}
function claimQuest(k) {
  const q = questsToday().list[k];
  if (!q || q.got || q.prog < q.n) return;
  const r = questReward(); q.got = 1; S.coins += r.coins; S.stats.earned += r.coins;
  toast("📜 +" + r.coins + " 🪙  +" + r.xp + " ⭐"); sfx("coin"); gainXP(r.xp); commit();
}
function claimQuestBonus() {
  const Q = questsToday();
  if (Q.bonus || !Q.list.every(q => q.got)) return;
  Q.bonus = 1; S.gems += 1; toast("📜 All of today's quests done! +1 💎"); sfx("level"); commit();
}

// ---------- achievements ----------
export const ACH = [
  {id:"h50", e:"🌾", t:"Harvest 50 fields", v:() => S.stats.harvests, n:50, gems:1},
  {id:"h500", e:"🌾", t:"Harvest 500 fields", v:() => S.stats.harvests, n:500, gems:3},
  {id:"o10", e:"🚚", t:"Deliver 10 orders", v:() => S.stats.orders, n:10, gems:1},
  {id:"o100", e:"🚚", t:"Deliver 100 orders", v:() => S.stats.orders, n:100, gems:3},
  {id:"r5", e:"⏰", t:"Deliver 5 rush orders", v:() => S.stats.rush, n:5, gems:2},
  {id:"m50", e:"🏭", t:"Make 50 goods", v:() => S.stats.made, n:50, gems:2},
  {id:"g10", e:"🥇", t:"Get 10 gold crops or goods", v:() => S.stats.gold, n:10, gems:2},
  {id:"w100", e:"💧", t:"Water 100 fields", v:() => S.stats.water, n:100, gems:1},
  {id:"v10", e:"👋", t:"Help 10 visitors", v:() => S.stats.visitors, n:10, gems:2},
  {id:"bff", e:"💞", t:"Become best friends with a villager", v:() => Math.max(0, ...Object.values(S.villagers).map(f => f.h)), n:5, gems:3},
  {id:"l10", e:"⭐", t:"Reach level 10", v:() => S.level, n:10, gems:2},
  {id:"l20", e:"🌟", t:"Reach level 20", v:() => S.level, n:20, gems:5},
  {id:"f30", e:"🟫", t:"Own 30 fields", v:() => S.plots.length, n:30, gems:2},
  {id:"all", e:"🏘️", t:"Build every building", v:() => Object.values(S.buildings).filter(b => b.owned).length, n:Object.keys(BUILDINGS).length, gems:3},
  {id:"mus", e:"🏛️", t:"Add 10 things to your collection", v:() => Object.keys(S.museum).length, n:10, gems:1},
];
function claimAch(id) {
  const a = ACH.find(x => x.id === id);
  if (!a || S.ach[id] || a.v() < a.n) return;
  S.ach[id] = now(); S.gems += a.gems; toast(a.e + " Achievement: " + a.t + "! +" + a.gems + " 💎"); sfx("level"); commit();
}

// ---------- the collection: ship one of everything ----------
const MUSEUM_GROUPS = [["crop", "🌾 Crops"], ["animal", "🥚 From animals"], ["feed", "🟡 Feed and farm supplies"], ["good", "🍞 Goods"]];
function shipToMuseum(id) {
  if (S.museum[id] || have(id) < 1) return;
  take(id, 1); S.museum[id] = now(); sfx("place"); toast(ITEMS[id].e + " " + ITEMS[id].n + " added to your collection!");
  for (const [kind, name] of MUSEUM_GROUPS) {
    const ids = Object.keys(ITEMS).filter(x => ITEMS[x].kind === kind);
    if (ITEMS[id].kind === kind && ids.every(x => S.museum[x])) { S.gems += 2; toast("🏛️ " + name + " collection complete! +2 💎"); sfx("level"); }
  }
  if (Object.keys(ITEMS).every(x => S.museum[x])) { S.gems += 5; S.decor.inv.trophy = (S.decor.inv.trophy || 0) + 1; toast("🏆 You shipped one of everything! +5 💎 and a Gold trophy"); }
  commit();
}

export const questClaims = () => {
  if (!S || homeS) return 0;
  const Q = questsToday();
  return (S.perks.owed > 0 ? 1 : 0) + Q.list.filter(q => q.prog >= q.n && !q.got).length + (!Q.bonus && Q.list.length && Q.list.every(q => q.got) ? 1 : 0) + ACH.filter(a => !S.ach[a.id] && a.v() >= a.n).length;
};
function panelQuests(tab = "daily") {
  const tabs = [["daily", "📜 Today"], ["ach", "🏅 Achievements"], ["museum", "🏛️ Collection"]];
  let h = (S.perks.owed > 0 ? `<p class="center" style="margin:0 0 8px"><button class="btn gold" data-act="open" data-p="perk">🎁 Choose your level-up perk</button></p>` : "") +
    `<div class="toggles" style="justify-content:center">${tabs.map(([k, n]) => `<button class="btn ${tab === k ? "" : "plain"} sm" data-act="qtab" data-k="${k}">${n}</button>`).join("")}</div>`;
  if (tab === "daily") {
    const Q = questsToday(), r = questReward();
    h += `<p class="center muted" style="font-weight:800;margin:8px 0">New quests every day. Each pays ${r.coins} 🪙 and ${r.xp} ⭐; finish all three for +1 💎.</p><div class="qlist">`;
    h += Q.list.map((q, k) => `<div class="qrow slot"><div class="grow"><b>${questDef(q.m).t.replace("{n}", q.n)}</b><div class="cap"><i style="width:${Math.min(100, q.prog / q.n * 100)}%"></i></div><small class="muted">${q.prog} / ${q.n}</small></div>
      ${q.got ? `<span class="done">✔</span>` : `<button class="btn sm" data-act="claimQuest" data-i="${k}" ${q.prog >= q.n ? "" : "disabled"}>Collect</button>`}</div>`).join("");
    const all = Q.list.every(q => q.got);
    h += `<div class="qrow slot"><div class="grow"><b>💎 All three done</b><small class="muted">${Q.list.filter(q => q.got).length} / ${Q.list.length}</small></div>
      ${Q.bonus ? `<span class="done">✔</span>` : `<button class="btn gold sm" data-act="questBonus" ${all ? "" : "disabled"}>+1 💎</button>`}</div></div>`;
  }
  if (tab === "ach") {
    h += `<div class="qlist">` + ACH.map(a => { const v = Math.min(a.v(), a.n);
      return `<div class="qrow slot ${S.ach[a.id] ? "got" : ""}"><span class="e">${a.e}</span><div class="grow"><b>${a.t}</b><div class="cap"><i style="width:${v / a.n * 100}%"></i></div><small class="muted">${v} / ${a.n} · ${a.gems} 💎</small></div>
        ${S.ach[a.id] ? `<span class="done">✔</span>` : `<button class="btn gold sm" data-act="claimAch" data-id="${a.id}" ${a.v() >= a.n ? "" : "disabled"}>+${a.gems} 💎</button>`}</div>`; }).join("") + `</div>`;
  }
  if (tab === "museum") {
    const n = Object.keys(S.museum).length, all = Object.keys(ITEMS).length;
    h += `<p class="center muted" style="font-weight:800;margin:8px 0">Ship one of everything to the town collection (${n}/${all}). Each finished shelf gives 2 💎, and the whole set a 🏆 trophy.</p>`;
    for (const [kind, name] of MUSEUM_GROUPS) {
      h += `<h4>${name}</h4><div class="inv">` + Object.keys(ITEMS).filter(x => ITEMS[x].kind === kind).map(x => S.museum[x]
        ? `<div class="islot slot got" title="${ITEMS[x].n}"><span class="e">${ITEMS[x].e}</span><span class="q">✔</span></div>`
        : have(x) ? `<button class="islot slot" data-act="ship" data-id="${x}" title="Ship 1 ${ITEMS[x].n}"><span class="e">${ITEMS[x].e}</span><span class="q out">Ship</span></button>`
        : `<div class="islot slot missing" title="${ITEMS[x].n}"><span class="e">${ITEMS[x].e}</span></div>`).join("") + `</div>`;
    }
  }
  return {title:"Quests", body:h};
}

// ---------- level-up perks ----------
let perkAsked = false; // offered once per visit; after that the choice waits in 📜 Quests
function panelPerk() {
  return {title:"Choose a perk", body:`<div class="big">🎁</div><p class="center" style="font-weight:800">Every 5 levels you pick one. They add up!</p>
    <div class="shop"><div class="scard slot"><span class="e">🌱</span><b>Green thumb</b><small>Crops grow 10% faster (now ${S.perks.grow * 10}%)</small><button class="btn" data-act="perk" data-k="grow">Pick</button></div>
    <div class="scard slot"><span class="e">💰</span><b>Haggler</b><small>Things sell for 10% more (now ${S.perks.sell * 10}%)</small><button class="btn gold" data-act="perk" data-k="sell">Pick</button></div></div>`};
}
function pickPerk(k) {
  if (S.perks.owed < 1 || (k !== "grow" && k !== "sell")) return;
  S.perks[k]++; S.perks.owed--; sfx("level");
  toast(k === "grow" ? "🌱 Green thumb! Crops grow faster." : "💰 Haggler! Better prices.");
  closePanel(); if (S.perks.owed > 0) openPanel("perk"); commit();
}

// ---------- sprinklers and land ----------
function buySprinkler() {
  if (S.level < 5 || S.sprinklers >= maxSprinklers()) return;
  const c = sprinklerCost();
  if (S.coins < c) { toast("Need " + c + " 🪙"); sfx("error"); return; }
  S.coins -= c; S.sprinklers++; sfx("build");
  toast("💦 Sprinkler installed! Fields " + ((S.sprinklers - 1) * 6 + 1) + "-" + S.sprinklers * 6 + " water themselves when planted.");
  S.plots.forEach((_, i) => { if (sprinkled(i)) waterPlot(i, true); });
  view.refresh("plots"); commit();
}
function buyLand() {
  const L = LAND[S.land];
  if (!L || S.level < L.lvl) return;
  if (S.coins < L.cost) { toast("Need " + L.cost + " 🪙"); sfx("error"); return; }
  S.coins -= L.cost; S.land++; sfx("build"); toast("🗺️ New land cleared! Room for " + LAND_FIELDS + " more fields.");
  closePanel(); view.refresh("plots"); view.focus("plot:" + Math.min(S.plots.length, maxPlots() - 1)); commit();
}
// rain waters every growing field for you
function rainTick() {
  if (!isRaining()) return;
  let n = 0; S.plots.forEach((_, i) => { if (waterPlot(i, true)) n++; });
  if (n) { toast("🌧️ The rain watered " + n + " field" + (n > 1 ? "s" : "")); view.refresh("plots"); save(); }
}

/* ============================================================
   REAL WEATHER, SEASONS AND HOLIDAYS
   ============================================================ */
const qs = new URLSearchParams(location.search); // ?theme=halloween&season=winter&weather=snow&night=1 to preview
const WX_KEY = SAVE_KEY + "-weather";
// mode: ask | gps | city | off; look: "real" follows the weather and the clock, or a fixed look chosen in Settings
export let WX = {mode:"ask", lat:null, lon:null, place:"", cur:null, look:"real"};
try { Object.assign(WX, JSON.parse(localStorage.getItem(WX_KEY) || "{}")); } catch (e) {}
function saveWX() { try { localStorage.setItem(WX_KEY, JSON.stringify(WX)); } catch (e) {} }
function wxKind(c) {
  if (c <= 1) return "clear"; if (c === 2) return "partly"; if (c === 3) return "cloudy";
  if (c === 45 || c === 48) return "fog"; if (c >= 95) return "storm";
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return "snow";
  return c >= 51 ? "rain" : "clear";
}
const WX_ICON = {clear:["☀️", "🌙"], partly:["⛅", "☁️"], cloudy:["☁️", "☁️"], fog:["🌫️", "🌫️"], rain:["🌧️", "🌧️"], snow:["🌨️", "🌨️"], storm:["⛈️", "⛈️"]};
const WX_NAME = {clear:"Clear", partly:"Partly cloudy", cloudy:"Cloudy", fog:"Foggy", rain:"Rainy", snow:"Snowing", storm:"Thunderstorm"};
export function weatherNow() {
  const f = qs.get("weather");
  if (f || qs.get("night")) return {kind:f || "clear", day:qs.get("night") !== "1", temp:null, preview:true};
  return (WX.mode === "gps" || WX.mode === "city") && WX.cur ? WX.cur : null;
}
export async function fetchWeather() {
  if (!(WX.mode === "gps" || WX.mode === "city") || WX.lat == null) return;
  try {
    const f = /US|LR|MM/.test(navigator.language || "") ? "&temperature_unit=fahrenheit" : "";
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${WX.lat}&longitude=${WX.lon}&current=temperature_2m,weather_code,is_day&timezone=auto${f}`);
    const j = await r.json(), c = j.current;
    WX.cur = {kind:wxKind(c.weather_code), day:!!c.is_day, temp:Math.round(c.temperature_2m), unit:f ? "°F" : "°C", t:Date.now()};
    saveWX(); refreshTheme(); renderHud(); view.applyWeather();
    if (panel && panel.type === "weather") renderPanel();
  } catch (e) {}
}
function useGPS() {
  if (!navigator.geolocation) return toast("This phone can't share its location. Type your town instead.");
  toast("Finding your weather…");
  navigator.geolocation.getCurrentPosition((pos) => {
    WX.mode = "gps"; WX.lat = +pos.coords.latitude.toFixed(2); WX.lon = +pos.coords.longitude.toFixed(2); WX.place = "Your location";
    saveWX(); fetchWeather(); if (panel) renderPanel();
  }, () => toast("Location wasn't allowed. You can type your town instead."), {timeout:15000, maximumAge:3600000});
}
async function useCity(name) {
  if (!name.trim()) return;
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name.trim())}&count=1`);
    const g = ((await r.json()).results || [])[0];
    if (!g) return toast("Couldn't find that town. Try a bigger town nearby.");
    WX.mode = "city"; WX.lat = g.latitude; WX.lon = g.longitude; WX.place = g.name + (g.country ? ", " + g.country : "");
    saveWX(); await fetchWeather(); toast("Weather set to " + WX.place); if (panel) renderPanel();
  } catch (e) { toast("Couldn't reach the weather service. Check your internet."); }
}
function easterSunday(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
}
function holidayOn(date) {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const day = new Date(y, m - 1, d).getTime(), near = (t, before, after) => day >= t - before * 864e5 && day <= t + after * 864e5;
  if ((m === 12 && d === 31) || (m === 1 && d <= 2)) return "newyear";
  if (m === 12) return "christmas";
  if (m === 2 && d >= 7 && d <= 14) return "valentine";
  if (m === 3 && d >= 14 && d <= 17) return "stpatrick";
  if (near(easterSunday(y).getTime(), 7, 1)) return "easter";
  if (m === 10 && d >= 17) return "halloween";
  const nov1 = new Date(y, 10, 1).getDay(), thanks = new Date(y, 10, 1 + (4 - nov1 + 7) % 7 + 21).getTime(); // 4th Thursday of November
  if (near(thanks, 3, 1)) return "thanksgiving";
  return null;
}
function seasonOf(date) {
  const m = date.getMonth();
  let s = m === 11 || m < 2 ? "winter" : m < 5 ? "spring" : m < 8 ? "summer" : "fall";
  if (WX.lat != null && WX.lat < 0) s = {winter:"summer", summer:"winter", spring:"fall", fall:"spring"}[s]; // southern half of the world
  return s;
}
export const THEME = {season:"summer", holiday:null};
export function refreshTheme() {
  const d = new Date();
  THEME.season = qs.get("season") || seasonOf(d);
  THEME.holiday = qs.has("theme") ? (qs.get("theme") || null) : holidayOn(d);
  const w = weatherNow();
  THEME.night = !!w && !w.day;
  THEME.snowy = !!w && w.kind === "snow";
}
// which 3D look to show: a fixed one from Settings, or the real weather and time of day
export function lookNow() {
  if (WX.look && WX.look !== "real") return WX.look;
  const w = weatherNow(), h = new Date().getHours() + new Date().getMinutes() / 60;
  if (w && (w.kind === "rain" || w.kind === "storm")) return "rain";
  if (w && w.kind === "snow") return "snow";
  const night = w ? !w.day : (h < 6 || h >= 21);
  if (night && tutActive()) return "morning"; // a brand-new farm always starts in daylight, so new players can see their fields
  if (night) return "night";
  if (h < 9.5) return "morning";
  if (h >= 17.5) return "golden";
  return "noon";
}

/* ============================================================
   HUD, PANELS, TOASTS
   ============================================================ */
export function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 2400);
  while ($("#toasts").children.length > 3) $("#toasts").firstChild.remove();
}
export function barnFull() { toast("📦 Barn is full! Sell items or upgrade it."); sfx("error"); }
export function commit() { save(); renderHud(); if (panel) renderPanel(); }

let bumpPrev = {};
export function renderHud() {
  $("#lvl").textContent = S.level;
  const need = xpNeed(S.level);
  $("#xpTxt").textContent = S.xp + "/" + need;
  $("#xpBar").style.width = Math.min(100, (S.xp / need) * 100) + "%";
  $("#coins").textContent = S.coins.toLocaleString();
  $("#gems").textContent = S.gems;
  for (const [id, v] of [["coins", S.coins], ["gems", S.gems], ["lvl", S.level * 1e6 + S.xp]]) {
    if (bumpPrev[id] !== undefined && v > bumpPrev[id] && id !== "lvl" && !homeS) view.fly(id === "coins" ? "coin" : "gem", v - bumpPrev[id]); // earned: they fly in
    if (bumpPrev[id] !== undefined && bumpPrev[id] !== v) { const el = $("#" + id).closest(".cnt, .lvlbox"); el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
    bumpPrev[id] = v;
  }
  const badge = (sel, n) => {
    const btn = document.querySelector(sel);
    if (!btn) return;
    let d = btn.querySelector(".badge");
    if (n) { if (!d) { d = document.createElement("span"); d.className = "badge"; btn.appendChild(d); } d.textContent = n; }
    else if (d) d.remove();
  };
  badge('[data-p="orders"]', readyOrders());
  badge('[data-p="barn"]', space() <= 0 ? "!" : 0);
  badge('[data-p="decor"]', Object.values(S.decor.inv).reduce((a, b) => a + b, 0));
  badge('#questBtn', questClaims());
  // weather chip
  const w = weatherNow(), wc = $("#wxChip");
  const wHtml = w ? `<span class="e">${WX_ICON[w.kind][w.day ? 0 : 1]}</span><span>${w.temp != null ? w.temp + (w.unit || "°") : WX_NAME[w.kind]}${heatwave() ? " 🔥" : ""}</span>`
    : `<span class="e">🌤️</span><span>${WX.mode === "off" ? "Weather" : "Real weather?"}</span>`;
  if (wc.innerHTML !== wHtml) wc.innerHTML = wHtml;
  // event chip
  const ev = S.event, ec = $("#evChip");
  if (ev && ev.end > now()) {
    const d = evDef(ev), g = d.goals[Math.min(ev.won, 2)], pct = ev.won >= 3 ? 100 : Math.min(100, ev.prog / g * 100);
    const eh = `<span class="e">${d.e}</span><span>${d.n}<small> · ${fmt(ev.end - now()).split(" ")[0]}</small><span class="mini"><i style="width:${pct}%"></i></span></span>`;
    if (ec.innerHTML !== eh) ec.innerHTML = eh;
    ec.hidden = false;
  } else ec.hidden = true;
}

const timer = (end) => `<span data-end="${end}">${fmt(end - now())}</span>`;
const needList = (req) => Object.entries(req).map(([id, n]) =>
  `<span class="${have(id) < n ? "short" : ""}">${ITEMS[id].e} ${have(id)}/${n}</span>`).join("");
export const ART_PATH = { p:"art/" };
const artImg = (k, fallback) => `<img src="${ART_PATH.p}${k}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${fallback}'))">`;

export let panel = null;
let lastPanelSig = "", selItem = null;
export function openPanel(type, arg) { view.closeTrays(); if (!panel) sfx("pop"); panel = {type, arg}; renderPanel(); tutEvent("open:" + type + (type === "building" ? ":" + arg : "")); }
export function closePanel() {
  panel = null; standUI = null; $("#panelRoot").innerHTML = "";
  if (popups.length && !view.busy()) openPanel(...popups.shift());
}

function panelBuilding(bid) {
  const b = BUILDINGS[bid], st = S.buildings[bid], t = now();
  const running = st.jobs.find(j => j.end > t), done = st.jobs.filter(j => j.end <= t).length;
  let h = `<div class="queue">` + st.jobs.map(j => j.end <= t
      ? `<div class="qslot slot done"><span class="e">${ITEMS[j.r].e}</span>Ready!</div>`
      : `<div class="qslot slot ${j === running ? "" : "wait"}"><span class="e">${ITEMS[j.r].e}</span>${j === running ? timer(j.end) : "Next"}</div>`).join("") +
    Array.from({length:QUEUE_SLOTS - st.jobs.length}, () => `<div class="qslot empty">Empty</div>`).join("") + `</div>`;
  h += `<div class="qbtns">${done ? `<button class="btn" data-act="collectJobs" data-b="${bid}">Collect ${done}</button>` : ""}
    ${running ? `<button class="btn blue" data-act="speedJob" data-b="${bid}">Finish now · ${gemCost(running.end - t)} 💎</button>` : ""}</div>`;
  h += `<h4>Recipes</h4><div class="recipes">` + b.recipes.map(rid => {
    const r = RECIPES[rid], it = ITEMS[rid];
    if (it.lvl > S.level) return `<div class="rcard slot locked"><span class="e">🔒</span><div class="mid"><b>${it.n}</b><small>Unlocks at level ${it.lvl}</small></div></div>`;
    const ok = hasAll(r.in) && st.jobs.length < QUEUE_SLOTS;
    return `<div class="rcard slot"><span class="e">${it.e}</span><div class="mid"><b>${r.out > 1 ? r.out + "× " : ""}${it.n}</b><small>⏱ ${fmt(r.time * 1000)} · +${r.xp}⭐</small>
      <div class="need">${needList(r.in)}</div></div><button class="btn sm" data-act="make" data-b="${bid}" data-r="${rid}" ${ok ? "" : "disabled"}>Make</button></div>`;
  }).join("") + `</div>`;
  return {title:b.n, body:h};
}
function panelLot(bid) {
  const b = BUILDINGS[bid];
  return {title:b.n, body:`<div class="big">${b.e}</div><p class="center" style="font-weight:800">Makes ${b.recipes.map(r => ITEMS[r].e + " " + ITEMS[r].n).join(", ")}</p>
    <p class="center" style="margin:12px 0 0">${S.level >= b.lvl ? `<button class="btn gold" data-act="building" data-k="${bid}">Build · ${b.cost} 🪙</button>` : `<b>🔒 Unlocks at level ${b.lvl}</b>`}</p>`};
}
function panelPenLot(kind) {
  const a = ANIMALS[kind];
  return {title:a.pen, body:`<div class="big">${a.e}</div><p class="center" style="font-weight:800">Raise ${a.n.toLowerCase()}s for ${outE(a)} ${outName(a)}. Comes with your first ${a.n.toLowerCase()}.</p>
    <p class="center" style="margin:12px 0 0">${S.level >= a.lvl ? `<button class="btn gold" data-act="pen" data-k="${kind}">Build · ${a.penCost} 🪙</button>` : `<b>🔒 Unlocks at level ${a.lvl}</b>`}</p>`};
}

function panelOrders() {
  const R = S.rush && S.rush.end > now() ? S.rush : null, rc = R && hasAll(R.items);
  let h = R ? `<div class="note rush ${rc ? "can" : ""}"><div class="rtag">⏰ Rush order · ${timer(R.end)} left</div><div class="items">` +
      Object.entries(R.items).map(([id, n]) => `<span class="oi ${have(id) < n ? "short" : "ok"}" title="${ITEMS[id].n}"><span class="e">${ITEMS[id].e}</span><b class="n">${have(id)}/${n}</b><small>${ITEMS[id].n}</small></span>`).join("") +
      `</div><div class="reward"><span>🪙 ${R.coins}</span><span>⭐ ${R.xp}</span>${R.gem ? `<span>💎 ${R.gem}</span>` : ""}</div>
      <div class="foot"><button class="btn gold sm" data-act="deliverRush" ${rc ? "" : "disabled"}>Deliver</button></div></div>` : "";
  if (S.visitor) { const V = VILLAGERS[S.visitor.id]; h += `<p class="center" style="font-weight:800;margin:0 0 8px"><button class="btn plain sm" data-act="open" data-p="visitor">${V.e} ${V.n} is waiting by the path</button></p>`; }
  h += `<div class="orders">` + S.orders.map((o, i) => {
    if (o.wait) return `<div class="note waiting"><div><div class="e">🚚</div>New order in<br>${timer(o.wait)}</div></div>`;
    const can = hasAll(o.items);
    return `<div class="note ${can ? "can" : ""}"><div class="items">` +
      Object.entries(o.items).map(([id, n]) => `<span class="oi ${have(id) < n ? "short" : "ok"}" title="${ITEMS[id].n}"><span class="e">${ITEMS[id].e}</span><b class="n">${have(id)}/${n}</b><small>${ITEMS[id].n}</small></span>`).join("") +
      `</div><div class="reward"><span>🪙 ${o.coins}</span><span>⭐ ${o.xp}</span>${o.gem ? `<span>💎 ${o.gem}</span>` : ""}</div>
      <div class="foot"><button class="btn sm" data-act="deliver" data-i="${i}" ${can ? "" : "disabled"}>Deliver</button>
      <button class="btn plain sm" data-act="discard" data-i="${i}" aria-label="Remove order">🗑️</button></div></div>`;
  }).join("") + `</div><p class="center muted" style="font-weight:800;margin:14px 0 0">Orders pay more than selling. Every 10th order gives a bonus 💎.</p>`;
  return {title:"Truck Orders", body:h};
}

function panelBarn() {
  const used = barnUsed(), ids = Object.keys(ITEMS).filter(id => have(id) > 0);
  if (selItem && !have(selItem)) selItem = null;
  let h = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
    <b style="font-family:var(--fun);font-weight:400;font-size:18px">${used} / ${S.barnCap}</b>
    <button class="btn gold sm" data-act="barnUp">Upgrade +25 · ${barnCost()} 🪙</button></div>
    <div class="cap ${used >= S.barnCap ? "full" : ""}"><i style="width:${Math.min(100, used / S.barnCap * 100)}%"></i></div>`;
  if (!ids.length) return {title:"Barn", body:h + `<p class="center muted" style="font-weight:800">Your barn is empty. Go harvest something!</p>`};
  h += `<div class="inv">` + ids.map(id => `<button class="islot slot ${selItem === id ? "sel" : ""}" data-act="selItem" data-id="${id}" title="${ITEMS[id].n}"><span class="e">${ITEMS[id].e}</span><span class="q out">${have(id)}</span>${goldOf(id) ? `<span class="gq">🥇${goldOf(id)}</span>` : ""}</button>`).join("") + `</div>`;
  if (selItem) {
    const it = ITEMS[selItem];
    h += `<div class="sellbar slot"><span class="e">${it.e}</span><div class="grow"><b style="font-family:var(--fun);font-weight:400;font-size:17px">${it.n}</b><div class="muted" style="font-weight:800">Sells for ${sellPrice(selItem)} 🪙 each${goldOf(selItem) ? ` · 🥇 gold ones ${sellPrice(selItem) * 2} 🪙` : ""}</div></div>
      <button class="btn gold sm" data-act="sell" data-id="${selItem}" data-n="1">Sell 1</button>
      ${have(selItem) > 1 ? `<button class="btn gold sm" data-act="sell" data-id="${selItem}" data-n="${have(selItem)}">Sell all · ${sellPrice(selItem) * (have(selItem) + goldOf(selItem))} 🪙</button>` : ""}</div>`;
  } else h += `<p class="center muted" style="font-weight:800;margin:12px 0 0">Tap an item to sell it</p>`;
  return {title:"Barn", body:h};
}

let standUI = null; // {slot, id, qty, price} while choosing what to sell
function panelStand() {
  const t = now();
  if (standUI) {
    const ids = Object.keys(ITEMS).filter(id => have(id) > 0);
    let h = `<h4>What do you want to sell?</h4>`;
    h += ids.length ? `<div class="inv">` + ids.map(id => `<button class="islot slot ${standUI.id === id ? "sel" : ""}" data-act="standItem" data-id="${id}" title="${ITEMS[id].n}"><span class="e">${ITEMS[id].e}</span><span class="q out">${have(id)}</span></button>`).join("") + `</div>`
      : `<p class="center muted" style="font-weight:800">Your barn is empty. Harvest or make something first.</p>`;
    if (standUI.id) {
      const it = ITEMS[standUI.id], pr = priceRange(standUI.id, standUI.qty), secs = saleSecs(standUI.id, standUI.qty, standUI.price);
      const speed = secs < 60 ? "🐇 Sells fast" : secs < 150 ? "🐢 Takes a couple of minutes" : "🐌 Takes a while";
      h += `<div class="picker slot">
        <div class="prow"><span>${it.e} ${it.n}</span><span class="muted">Barn price ${pr.base} 🪙</span></div>
        <div class="prow"><span>Amount</span><div class="stepper"><button class="btn plain" data-act="qty" data-d="-1" aria-label="Less">−</button><b>${standUI.qty}</b><button class="btn plain" data-act="qty" data-d="1" aria-label="More">+</button></div></div>
        <div class="prow"><span>Price</span><div class="stepper"><button class="btn plain" data-act="price" data-d="-1" aria-label="Cheaper">−</button><b>${standUI.price} 🪙</b><button class="btn plain" data-act="price" data-d="1" aria-label="Pricier">+</button></div></div>
        <div class="prow"><span class="muted">${speed}</span></div>
        <button class="btn wide" data-act="standList">Put on sale</button></div>`;
    }
    return {title:"Roadside Shop", body:h + `<p class="center" style="margin:12px 0 0"><button class="btn plain sm" data-act="standBack">Back</button></p>`};
  }
  let h = `<p class="center muted" style="font-weight:800;margin:0 0 10px">Set your own prices. Passers-by buy over time, and cheaper things sell faster.</p><div class="stand">`;
  S.stand.list.forEach((L, j) => {
    if (!L) h += `<button class="sslot slot empty" data-act="standPick" data-s="${j}"><span class="e">➕</span>Put something on sale</button>`;
    else if (L.sellAt <= t) h += `<button class="sslot slot sold" data-act="standCollect" data-s="${j}"><span class="e">💰</span><b>+${L.price} 🪙</b>Sold! Tap to collect</button>`;
    else h += `<div class="sslot slot"><span class="e">${ITEMS[L.id].e}</span><b>×${L.qty}</b>${L.price} 🪙<small>Waiting for a buyer…</small>
      <button class="rm" data-act="standCancel" data-s="${j}" aria-label="Take it back">✕</button></div>`;
  });
  if (S.stand.slots < STAND_MAX) h += `<button class="sslot slot empty" data-act="standSlot"><span class="e">🧺</span>Extra slot<b>${standSlotCost()} 🪙</b></button>`;
  return {title:"Roadside Shop", body:h + `</div>`};
}

function panelEvent(arg) {
  const ev = S.event;
  if (!ev || ev.end <= now()) {
    const hol = THEME.holiday && HOLIDAYS[THEME.holiday];
    return {title:"Events", body:`<div class="big">🎪</div>
      <p class="center" style="font-weight:800">${S.level < 2 ? "Special events start once you reach level 2." : "No event right now. The next one starts in about " + fmt(Math.max(60000, (S.nextEventAt || 0) - now())) + "."}</p>
      <p class="center muted" style="font-weight:800">Events are challenges that last a day. Win prizes like a 🎠 carousel, a 🦄 unicorn or a 🏰 castle for your farm!</p>
      ${hol ? `<p class="center" style="font-weight:800">${hol.e} It's ${hol.n} on the farm!</p>` : ""}`};
  }
  const d = evDef(ev), g = d.goals, top = g[2];
  let h = `${arg && arg.fresh ? `<p class="center" style="font-family:var(--fun);font-size:18px;margin:0 0 4px">A special event has started!</p>` : ""}
    <div class="big">${d.e}</div><p class="center" style="font-family:var(--fun);font-size:24px;margin:0">${d.n}</p>
    <p class="center" style="font-weight:800;margin:4px 0">${d.task} · ends in ${timer(ev.end)}</p>
    <div class="evbar"><i style="width:${Math.min(100, ev.prog / top * 100)}%"></i></div>
    <p class="center" style="font-family:var(--fun);font-size:17px;margin:0">${Math.min(ev.prog, top)} / ${top}</p><div class="tiers">`;
  ev.prizes.forEach((id, i) => {
    const D = DECOR[id];
    h += `<div class="tier slot ${ev.won > i ? "won" : ""}"><span class="muted">Reach ${g[i]}</span><span class="e">${decorIcon(id)}</span><b>${D.n}</b>
      <span>+${PRIZE_COINS[i]} 🪙${PRIZE_GEMS[i] ? " +" + PRIZE_GEMS[i] + " 💎" : ""}</span></div>`;
  });
  return {title:"Special Event", body:h + `</div><p class="center muted" style="font-weight:800;margin:12px 0 0">Prizes go into your 🌷 Decor box.</p>`};
}
function panelPrize({id, tier}) {
  const D = DECOR[id];
  return {title:"You won!", body:`<div class="big">${decorIcon(id)}</div><p class="center" style="font-family:var(--fun);font-size:24px;margin:0">${D.n}</p>
    <p class="center" style="font-weight:800;font-size:17px;margin:6px 0">+${PRIZE_COINS[tier]} 🪙${PRIZE_GEMS[tier] ? " &nbsp; +" + PRIZE_GEMS[tier] + " 💎" : ""}</p>
    <p class="center">${decorTag(D)}</p>
    <p class="center" style="margin:14px 0 0;display:flex;gap:8px;justify-content:center"><button class="btn" data-act="placeDecor" data-id="${id}">Place it now</button><button class="btn plain" data-act="closePanel">Later</button></p>`};
}
function panelDecor() {
  const inv = Object.entries(S.decor.inv);
  let h = `<h4>Your decorations</h4>`;
  h += inv.length ? `<div class="decor">` + inv.map(([id, n]) => `<div class="dcard slot"><span class="e">${decorIcon(id)}</span>${DECOR[id].n}${n > 1 ? " ×" + n : ""}
      <button class="btn sm" data-act="placeDecor" data-id="${id}">Place</button></div>`).join("") + `</div>`
    : `<p class="muted" style="font-weight:800;margin:0">Nothing waiting to be placed. Buy some below, or win them in events!</p>`;
  h += `<h4>Buy decorations</h4><div class="decor">` + Object.entries(DECOR).filter(([, D]) => D.cost).map(([id, D]) =>
    `<div class="dcard slot"><span class="e">${decorIcon(id)}</span>${D.n}${D.size === 2 ? "<small class=muted>big</small>" : ""}<button class="btn gold sm" data-act="buyDecor" data-id="${id}">${D.cost} 🪙</button></div>`).join("") + `</div>`;
  const won = new Set([...Object.keys(S.decor.inv), ...S.decor.placed.map(d => d.id)]);
  h += `<h4>Win in events</h4><div class="decor">` + Object.entries(DECOR).filter(([, D]) => !D.cost).map(([id, D]) =>
    `<div class="dcard slot ${won.has(id) ? "" : "locked"}"><span class="e">${decorIcon(id)}</span>${D.n}${decorTag(D)}</div>`).join("") + `</div>`;
  h += `<p class="center muted" style="font-weight:800;margin:12px 0 0">New decorations go where you're looking. Tap one to put it away; press and hold to move it.</p>`;
  return {title:"Decorations", body:h};
}
const LOOKS = [["real", "🌍 Real weather & time"], ["morning", "🌅 Morning"], ["noon", "☀️ Noon"], ["golden", "🌇 Golden hour"], ["rain", "🌧️ Rain"], ["snow", "❄️ Snow"], ["night", "🌙 Night"]];
function panelWeather() {
  const w = weatherNow(), hol = THEME.holiday && HOLIDAYS[THEME.holiday];
  let h = "";
  if (w) h += `<div class="wxnow slot"><span class="e">${WX_ICON[w.kind][w.day ? 0 : 1]}</span><div><b>${WX_NAME[w.kind]}${w.temp != null ? " · " + w.temp + (w.unit || "°") : ""}</b>
    <span class="muted" style="font-weight:800">${w.preview ? "Preview" : esc(WX.place)}${w.day ? "" : " · night"}</span></div></div>`;
  else h += `<p style="font-weight:800;margin:0">Make your farm match the real weather outside: sun, rain, snow and night time with glowing windows.</p>`;
  if (isRaining()) h += `<p style="font-weight:800">💧 Rain is watering your fields for you! Watered crops grow 25% faster.</p>`;
  if (heatwave()) h += `<p style="font-weight:800">🔥 Heatwave! Crops nobody waters grow 20% slower. Water them, or get 💦 sprinklers.</p>`;
  h += `<div class="wxrow"><button class="btn" data-act="wxGPS">📍 Use my location</button>${WX.mode !== "off" && WX.mode !== "ask" ? `<button class="btn plain" data-act="wxOff">Turn off</button>` : ""}</div>
    <div class="wxrow"><input id="wxCity" placeholder="…or type your town" autocomplete="off" enterkeyhint="done"><button class="btn gold" data-act="wxCity">Set</button></div>
    <p class="muted" style="font-weight:700;font-size:13px">Your location is only used to look up the weather (from Open-Meteo, a free weather service). It stays on your phone.</p>
    <h4>How the farm looks</h4><div class="toggles">${LOOKS.map(([k, n]) => `<button class="btn ${WX.look === k ? "" : "plain"} sm" data-act="look" data-k="${k}">${n}</button>`).join("")}</div>
    <h4>Season</h4><p style="font-weight:800;margin:0">${{spring:"🌸 Spring", summer:"☀️ Summer", fall:"🍂 Fall", winter:"❄️ Winter"}[THEME.season]}${hol ? ` &nbsp;·&nbsp; ${hol.e} ${hol.n}` : ""}</p>
    <p style="font-weight:800;margin:4px 0 0">In season now: ${Object.keys(CROPS).filter(inSeason).map(c => ITEMS[c].e).join(" ")}. <span class="muted">Other crops grow at half speed.</span></p>
    <p class="muted" style="font-weight:700;font-size:13px">The farm dresses up for Halloween, Thanksgiving, Christmas, New Year, Valentine's Day, Easter and St. Patrick's Day.</p>`;
  return {title:"Weather", body:h};
}
function panelShop() {
  let h = `<h4>Expand</h4><div class="shop">`;
  h += S.plots.length < maxPlots()
    ? `<div class="scard slot"><span class="e">🟫</span><b>New field</b><small>${S.plots.length}/${maxPlots()} fields</small><button class="btn gold sm" data-act="plot+">${plotCost()} 🪙</button></div>`
    : `<div class="scard slot"><span class="e">🟫</span><b>Fields</b><small>All ${maxPlots()} owned!</small></div>`;
  const L = LAND[S.land];
  h += L ? (S.level >= L.lvl ? `<div class="scard slot"><span class="e">🗺️</span><b>More land</b><small>Room for ${LAND_FIELDS} more fields</small><button class="btn gold sm" data-act="land">${L.cost.toLocaleString()} 🪙</button></div>`
      : `<div class="scard slot locked"><span class="e">🗺️</span><b>More land</b><small>Level ${L.lvl}</small></div>`) : "";
  h += S.level >= 5 ? (S.sprinklers < maxSprinklers() ? `<div class="scard slot"><span class="e">💦</span><b>Sprinkler</b><small>Waters 6 fields by itself (${S.sprinklers} owned)</small><button class="btn gold sm" data-act="sprinkler">${sprinklerCost()} 🪙</button></div>`
      : `<div class="scard slot"><span class="e">💦</span><b>Sprinklers</b><small>Every field is covered!</small></div>`) : `<div class="scard slot locked"><span class="e">💦</span><b>Sprinkler</b><small>Level 5</small></div>`;
  h += `<div class="scard slot"><span class="e">📦</span><b>Barn +25</b><small>Holds ${S.barnCap} now</small><button class="btn gold sm" data-act="barnUp">${barnCost()} 🪙</button></div></div>`;
  h += `<h4>Animals</h4><div class="shop">`;
  for (const [k, a] of Object.entries(ANIMALS)) {
    const pen = S.pens[k];
    if (pen.owned) h += `<div class="scard slot">${artImg(k, a.e)}<b>${a.n}</b><small>${pen.list.length}/${a.max} · ${a.out ? "makes " + outE(a) : "earns 🪙 from rides"}</small>
      ${pen.list.length < a.max ? `<button class="btn gold sm" data-act="animal" data-k="${k}">${a.cost} 🪙</button>` : `<small>Pen is full</small>`}</div>`;
    else if (S.level >= a.lvl) h += `<div class="scard slot">${artImg(k, a.e)}<b>${a.pen}</b><small>Comes with 1 ${a.n.toLowerCase()}</small><button class="btn gold sm" data-act="pen" data-k="${k}">${a.penCost} 🪙</button></div>`;
    else h += `<div class="scard slot locked"><span class="e">🔒</span><b>${a.pen}</b><small>Level ${a.lvl}</small></div>`;
  }
  h += `</div><h4>Pets</h4><div class="shop">`;
  for (const [k, P] of Object.entries(PETS)) {
    const owned = S.pets.find(p => p.kind === k);
    h += owned ? `<div class="scard slot">${artImg(k, P.e)}<b>${esc(owned.name)}</b><small>Your ${P.n.toLowerCase()} · tap them on the farm</small></div>`
      : S.level >= P.lvl ? `<div class="scard slot">${artImg(k, P.e)}<b>${P.n}</b><small>Roams your farm and brings gifts</small><button class="btn gold sm" data-act="buyPet" data-k="${k}">${P.cost} 🪙</button></div>`
      : `<div class="scard slot locked"><span class="e">🔒</span><b>${P.n}</b><small>Level ${P.lvl}</small></div>`;
  }
  h += `</div><h4>Buildings</h4><div class="shop">`;
  for (const [k, b] of Object.entries(BUILDINGS)) {
    if (S.buildings[k].owned) continue;
    h += S.level >= b.lvl
      ? `<div class="scard slot"><span class="e">${b.e}</span><b>${b.n}</b><small>Makes ${b.recipes.map(r => ITEMS[r].e).join(" ")}</small><button class="btn gold sm" data-act="building" data-k="${k}">${b.cost} 🪙</button></div>`
      : `<div class="scard slot locked"><span class="e">🔒</span><b>${b.n}</b><small>Level ${b.lvl}</small></div>`;
  }
  if (Object.values(S.buildings).every(b => b.owned)) h += `<div class="scard slot"><span class="e">🎉</span><b>All built!</b></div>`;
  h += `<div class="scard slot"><span class="e">🌷</span><b>Decorations</b><small>Flowers, trees, fountains…</small><button class="btn sm" data-act="open" data-p="decor">Look</button></div>`;
  h += `</div>` + promise();
  return {title:"Shop", body:h};
}
const promise = () => `<div class="promise"><b>💎 No real money. Ever.</b><div>Nothing in this game costs real money. Coins and gems are only earned by playing:</div>
  <ul><li>+2 💎 every level up</li><li>+1 💎 from the daily gift 🎁</li><li>+1 💎 every 10th order, and some orders pay 💎</li></ul></div>`;

// Settings: sound, graphics, how the farm looks, the barn's colours, backup and the tutorial
export const PREFS = {quality:"auto"};
try { Object.assign(PREFS, JSON.parse(localStorage.getItem(SAVE_KEY + "-prefs") || "{}")); } catch (e) {}
const savePrefs = () => { try { localStorage.setItem(SAVE_KEY + "-prefs", JSON.stringify(PREFS)); } catch (e) {} };
function panelSettings() {
  const Q = [["auto", "✨ Auto"], ["high", "💎 Best"], ["balanced", "⚖️ Balanced"], ["battery", "🔋 Battery saver"]];
  const P = view.paintOptions;
  const sw = Object.keys(P).map(part => `<div class="prow" style="flex-wrap:wrap"><span>${part}</span><div class="swatches">${P[part].map(([name, css], i) =>
    `<button class="sw ${(S.style[part] || 0) === i ? "on" : ""}" style="background:${css}" data-act="paint" data-k="${part}" data-i="${i}" title="${name}" aria-label="${part}: ${name}"></button>`).join("")}</div></div>`).join("");
  const acct = window.saAuth && window.saAuth.user; // player accounts (auth.js)
  return {title:"Settings", body:`${acct ? `<h4>Account</h4><div class="toggles"><span style="font-weight:800;align-self:center">👤 ${esc(acct.email || "")}</span>
      <button class="btn plain sm" data-act="signOut">🚪 Sign out</button></div>` : window.saAuth && window.saAuth.guest ? `<h4>Account</h4><div class="toggles"><span style="font-weight:800;align-self:center">🌱 Playing as a guest: this farm is saved on this phone only</span>
      <button class="btn sm" data-act="makeAccount">☁️ Create account</button></div>` : ""}<div class="stats">
      <div class="stat slot"><b>${S.stats.harvests}</b>fields harvested</div>
      <div class="stat slot"><b>${S.stats.orders}</b>orders delivered</div>
      <div class="stat slot"><b>${S.stats.made}</b>goods made</div>
      <div class="stat slot"><b>${S.stats.earned.toLocaleString()}</b>coins earned</div></div>
    <h4>Sound</h4><div class="toggles">
      <button class="btn ${snd.on ? "" : "plain"} sm" data-act="sound">${snd.on ? "🔊 Sounds on" : "🔇 Sounds off"}</button>
      <button class="btn ${snd.music ? "" : "plain"} sm" data-act="music">${snd.music ? "🎵 Music on" : "🎵 Music off"}</button>
      <button class="btn ${snd.amb ? "" : "plain"} sm" data-act="amb">${snd.amb ? "🐦 Farm sounds on" : "🐦 Farm sounds off"}</button>
      <button class="btn ${snd.buzz ? "" : "plain"} sm" data-act="buzz">${snd.buzz ? "📳 Vibration on" : "📳 Vibration off"}</button></div>
    <h4>Graphics</h4><div class="toggles">${Q.map(([k, n]) => `<button class="btn ${PREFS.quality === k ? "" : "plain"} sm" data-act="quality" data-k="${k}">${n}</button>`).join("")}</div>
    <p class="muted center" style="font-weight:700;font-size:13px;margin:6px 0 0">Auto lowers the detail by itself if the phone gets slow. Battery saver is gentlest on the battery.</p>
    <h4>Weather & time of day</h4><div class="toggles"><button class="btn sm" data-act="open" data-p="weather">🌤️ Weather settings</button></div>
    <h4>Barn colours</h4><div class="slot" style="padding:10px">${sw}</div>
    <h4>Backup</h4>
    <p style="font-weight:800;margin:0 0 6px">${S.lastBackup ? "Last backup: " + new Date(S.lastBackup).toLocaleDateString() : "⚠️ No backup yet."}
      <span class="muted">A backup keeps your farm safe if you get a new phone or clear your browser.</span></p>
    <div class="toggles"><button class="btn sm" data-act="backupFile">💾 Save backup file</button><button class="btn sm" data-act="backupCode">📋 Backup code</button></div>
    <div class="toggles"><button class="btn plain sm" data-act="restoreFile">📂 Restore from file</button><button class="btn plain sm" data-act="restorePaste">📝 Restore from code</button></div>
    <p class="muted center" style="font-weight:700;font-size:13px;margin:6px 0 0">A backup from the 2D Sunny Acres works here too: your levels, coins, crops and animals come with you.</p>
    <h4>How to play</h4>${howTo()}
    <div class="toggles"><button class="btn sm" data-act="tutorial">🎓 Show the tutorial again</button></div>
    ${promise()}
    <p class="center" style="margin:18px 0 0"><button class="btn plain sm" data-act="reset">Start a new farm…</button></p>`};
}
function panelBackup({mode, code}) {
  if (mode === "show") return {title:"Backup code", body:`<div class="backup">
    <p style="font-weight:800;margin:0 0 8px">Copy this code and keep it somewhere safe, like a note or a message to yourself. To get your farm back, paste it into <b>Restore from code</b>.</p>
    <textarea id="codeBox" readonly>${code}</textarea>
    <p class="center" style="margin:10px 0 0"><button class="btn" data-act="copyCode">📋 Copy code</button></p></div>`};
  return {title:"Restore farm", body:`<div class="backup">
    <p style="font-weight:800;margin:0 0 8px">Paste a backup code below (from this game or the 2D one). This replaces the farm on this phone.</p>
    <textarea id="codeBox" placeholder="Paste your backup code here"></textarea>
    <p class="center" style="margin:10px 0 0"><button class="btn gold" data-act="restoreCode">Restore</button></p></div>`};
}
// in-game yes/no, because some browsers (and the test page) block the phone's own pop-ups
let confirmFn = null;
function askConfirm(title, text, yes, fn) { confirmFn = fn; openPanel("confirm", {title, text, yes}); }
function panelConfirm({title, text, yes}) {
  return {title, body:`<p class="center" style="font-weight:800;font-size:17px">${text}</p>
    <p class="center" style="margin:14px 0 0;display:flex;gap:8px;justify-content:center"><button class="btn red" data-act="confirmYes">${yes}</button><button class="btn plain" data-act="closePanel">Cancel</button></p>`};
}
let renameFn = null;
export function askName(what, current, fn) { renameFn = fn; openPanel("rename", {what, current}); }
function panelRename({what, current}) {
  return {title:"Name your " + what, body:`<div class="wxrow"><input id="nameBox" maxlength="16" value="${esc(current)}" autocomplete="off" enterkeyhint="done"><button class="btn gold" data-act="nameOk">Save</button></div>`};
}
function panelImport2D() {
  return {title:"Welcome to 3D!", body:`<div class="big">🌻</div>
    <p class="center" style="font-weight:800;font-size:17px">We found your farm from the 2D Sunny Acres on this phone.</p>
    <p class="center" style="font-weight:700">Bring it over? Your levels, coins, gems, barn, fields, animals, buildings and decorations all come with you. The 2D farm stays as it is.</p>
    <p class="center" style="margin:14px 0 0;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn gold" data-act="import2d">Bring my farm</button><button class="btn plain" data-act="fresh3d">Start fresh</button></p>`};
}
const howTo = () => `<ul class="howto">
  <li>Tap an empty field, pick a seed, then tap or <b>drag across</b> empty fields to plant.</li>
  <li>When crops are ripe, tap one, or start a swipe on a ripe crop and slide across the rest, to harvest. A drag that starts anywhere else turns the camera.</li>
  <li>Tap a growing field to 💧 water it (25% faster) or add 🧪 fertilizer (better chance of 🥇 gold crops, which sell for double).</li>
  <li>Grow a different crop now and then: the same crop over and over tires the soil. Crops grow at half speed out of season.</li>
  <li>Tap the 📋 order board to deliver orders for coins and ⭐. ⏰ Rush orders pay extra but don't wait long.</li>
  <li>👋 Villagers stop by with requests. Help them to become friends. Check 📜 Quests every day.</li>
  <li>Tap buildings to make feed, bread, cheese, pies and more.</li>
  <li>Sell at the 🏪 roadside shop by the path, at your own price.</li>
  <li>Tap an animal to feed it, collect from it, pet and brush it. Happy animals make more.</li>
  <li>Win decorations in 🎪 special events. Tap a decoration and choose Move to put it somewhere else.</li>
  <li>Drag to turn the camera all the way around, pinch to zoom, two fingers to move.</li></ul>`;
function panelLevel({lvl, unlocked}) {
  return {title:"Level Up!", body:`<div class="big">⭐</div><p class="center" style="font-family:var(--fun);font-size:30px;margin:0">Level ${lvl}</p>
    <p class="center" style="font-weight:800;font-size:18px;margin:6px 0">+2 💎 &nbsp; +${20 * lvl} 🪙</p>
    ${unlocked.length ? `<div class="slot" style="padding:12px"><b style="font-family:var(--fun);font-weight:400;font-size:17px">New on your farm</b><ul class="howto">${unlocked.map(u => `<li>${u}</li>`).join("")}</ul></div>` : ""}
    <p class="center" style="margin:14px 0 0"><button class="btn" data-act="closePanel">Yay!</button></p>`};
}
function panelWelcome() {
  return {title:"Sunny Acres", body:`<div class="big">🌻</div><p class="center" style="font-family:var(--fun);font-size:24px;margin:0">Welcome to your farm!</p>
    ${promise()}<p class="center" style="margin:14px 0 0"><button class="btn" data-act="startTut">Let's farm!</button></p>`};
}
function panelSig() {
  if (!panel) return "";
  const t = now(), f = (e) => (e && e <= t ? 1 : 0);
  if (panel.type === "building") return S.buildings[panel.arg].jobs.map(j => f(j.end)).join("");
  if (panel.type === "orders") return S.orders.map(o => f(o.wait)).join("") + (S.rush ? "r" : "");
  if (panel.type === "stand") return S.stand.list.map(L => L ? f(L.sellAt) : "-").join("");
  return "";
}
export function renderPanel() {
  if (!panel) return;
  const v = {backup:panelBackup, event:panelEvent, prize:panelPrize, decor:panelDecor, weather:panelWeather, stand:panelStand, building:panelBuilding, lot:panelLot, penLot:panelPenLot,
    orders:panelOrders, barn:panelBarn, shop:panelShop, settings:panelSettings, level:panelLevel, welcome:panelWelcome, confirm:panelConfirm, rename:panelRename, import2d:panelImport2D,
    quests:panelQuests, perk:panelPerk, visitor:panelVisitor}[panel.type](panel.arg);
  const old = document.querySelector(".pbody"), scroll = old ? old.scrollTop : 0;
  $("#panelRoot").innerHTML = `<div class="scrim" data-act="closePanel"><div class="panel" role="dialog" aria-modal="true" aria-label="${v.title}">
    <div class="ribbon out">${v.title}</div><button class="xbtn" data-act="closePanel" aria-label="Close">✕</button>
    <div class="pbody">${v.body}</div></div></div>`;
  if (old) document.querySelector(".pbody").scrollTop = scroll;
  lastPanelSig = panelSig();
  if (panel.type === "rename") { const b = $("#nameBox"); if (b) { b.focus(); b.select(); } }
}
function showLevelUp(lvl, unlocked) { sfx("level"); popup("level", {lvl, unlocked}); }
function tickTimers() {
  const t = now();
  document.querySelectorAll("[data-end]").forEach(el => { el.textContent = fmt(+el.dataset.end - t); });
}
export function tick() {
  const t = now();
  let changed = false;
  S.orders.forEach((o, i) => { if (o.wait && o.wait <= t) { S.orders[i] = genOrder(); changed = true; } });
  if (changed) save();
  refreshTheme(); eventTick();
  if (!homeS) { rushTick(); visitorTick(); rainTick(); if (!perkAsked && !panel && S.perks.owed > 0 && !tutActive() && !opts.quiet && !view.busy()) { perkAsked = true; openPanel("perk"); } }
  renderHud(); tutTick();
  if (panel) { if (changed || panelSig() !== lastPanelSig) renderPanel(); else tickTimers(); }
}

/* ============================================================
   TUTORIAL: a few friendly steps for a brand-new farm
   ============================================================ */
// each step: what to say, where to point (a thing in the world, or a button), and when it's done
const TUT = [
  {say:"Tap a glowing field, pick 🌾 wheat, then drag across the other fields to plant them all.", at:"plot:0", done:() => S.plots.some(p => p.crop)},
  {say:"Wheat grows in 20 seconds. When it turns golden, tap it, or start a swipe on it and slide across the others, to harvest.", at:"plot:ready", done:() => S.stats.harvests > 0},
  // the steps with next:true just explain something, and wait for "Got it"
  {say:"🪙 Coins buy seeds, animals and buildings. 💎 Gems are rarer: you get them for leveling up, from the daily 🎁 gift and from some orders, and they make things finish right away. No real money, ever.", at:null, next:true, done:(e) => e === "next"},
  {say:() => `Everything you harvest or make goes into your 📦 Barn. It holds ${S.barnCap} things. When it's full, deliver orders or sell at the stand, or make it bigger in the 🛒 Shop.`, at:"btn:barn", next:true, done:(e) => e === "next" || e === "open:barn"},
  {say:"Trucks want things from your farm. Tap the 📋 order board.", at:"board", done:(e) => e === "open:orders"},
  {say:"Deliver an order when you have everything. Orders pay coins and ⭐. (Plant more wheat or corn if you're short.)", at:null, done:(e) => e === "deliver" || S.stats.orders > 0},
  {say:"Tap the 🏭 Feed Mill to make chicken feed from wheat and corn.", at:"building:feedmill", done:(e) => e === "open:building:feedmill" || e === "make"},
  {say:() => "Each building turns your goods into something worth more: " + Object.values(BUILDINGS).map(b => `${b.e} ${b.n}: ${b.recipes.slice(0, 2).map(r => ITEMS[r].n.toLowerCase()).join(", ")}`).join(" · ") + ". The empty lots show when each one unlocks.", at:null, next:true, done:(e) => e === "next"},
  {say:"At level 2 you can buy a chicken coop in the 🛒 Shop. Have fun on your farm! 🌻", at:"btn:shop", done:(e) => e === "open:shop" || e === "skip"},
];
export const tutActive = () => S && S.tut >= 0 && S.tut < TUT.length;
let tutShown = -1;
export function tutEvent(e) {
  if (!tutActive()) return;
  if (TUT[S.tut].done(e)) { S.tut++; save(); tutShown = -1; if (S.tut < TUT.length) sfx("pop"); else view.applyWeather(); renderTut(); }
}
function tutTick() { if (tutActive()) tutEvent("tick"); renderTut(); }
export function tutTarget() { return tutActive() ? TUT[S.tut].at : null; }
export function renderTut() {
  const el = $("#tut");
  if (!tutActive() || panel) { el.hidden = true; return; }
  el.hidden = false;
  if (tutShown !== S.tut) { const T = TUT[S.tut]; tutShown = S.tut; $("#tutText").textContent = typeof T.say === "function" ? T.say() : T.say; $("#tutStep").textContent = (S.tut + 1) + " / " + TUT.length; $("#tutNext").hidden = !T.next; }
}
function startTutorial() { S.tut = 0; save(); closePanel(); renderTut(); view.applyWeather(); }

// ---------- buttons ----------
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  if (el.classList.contains("scrim") && e.target !== el) return; // tapping inside a panel shouldn't close it
  const d = el.dataset, i = +d.i;
  switch (d.act) {
    case "closePanel": closePanel(); break;
    case "backupFile": backupFile(); break;
    case "backupCode": showBackupCode(); break;
    case "copyCode": copyCode(); break;
    case "restoreFile": $("#restoreInput").click(); break;
    case "restorePaste": openPanel("backup", {mode:"restore"}); break;
    case "restoreCode": restoreFrom(($("#codeBox") || {}).value || ""); break;
    case "placeDecor": closePanel(); placeDecor(d.id); break;
    case "buyDecor": buyDecor(d.id); break;
    case "wxGPS": useGPS(); break;
    case "wxCity": useCity(($("#wxCity") || {}).value || ""); break;
    case "wxOff": WX.mode = "off"; saveWX(); refreshTheme(); renderHud(); view.applyWeather(); renderPanel(); break;
    case "look": WX.look = d.k; saveWX(); view.applyWeather(); renderPanel(); break;
    case "open": openPanel(d.p); break;
    case "animal": buyAnimal(d.k); break;
    case "pen": if (buyPen(d.k)) { closePanel(); view.focus("pen:" + d.k); } break;
    case "building": if (buyBuilding(d.k)) { closePanel(); view.focus("building:" + d.k); } break;
    case "buyPet": if (buyPet(d.k)) { closePanel(); view.focus("pet:" + (S.pets.length - 1)); } break;
    case "plot+": if (buyPlot()) { closePanel(); view.focus("plot:" + (S.plots.length - 1)); } break;
    case "make": startJob(d.b, d.r); break;
    case "collectJobs": collectJobs(d.b); break;
    case "speedJob": speedJob(d.b); break;
    case "deliver": deliver(i); break;
    case "discard": discard(i); break;
    case "selItem": selItem = d.id; renderPanel(); break;
    case "standPick": standUI = {slot:+d.s}; renderPanel(); break;
    case "standBack": standUI = null; renderPanel(); break;
    case "standItem": {
      const qty = Math.min(have(d.id), ITEMS[d.id].kind === "crop" ? 5 : 1);
      standUI = {slot:standUI.slot, id:d.id, qty, price:Math.round(ITEMS[d.id].p * qty * 1.2)};
      renderPanel(); break;
    }
    case "qty": {
      const u = standUI, ratio = u.price / (ITEMS[u.id].p * u.qty);
      u.qty = clamp(u.qty + +d.d, 1, Math.min(10, have(u.id)));
      const pr = priceRange(u.id, u.qty); u.price = clamp(Math.round(ratio * pr.base), pr.min, pr.max);
      sfx("tick"); renderPanel(); break;
    }
    case "price": {
      const u = standUI, pr = priceRange(u.id, u.qty);
      u.price = clamp(u.price + +d.d * pr.step, pr.min, pr.max);
      sfx("tick"); renderPanel(); break;
    }
    case "standList": if (standList(standUI.slot, standUI.id, standUI.qty, standUI.price)) { standUI = null; renderPanel(); } break;
    case "standCollect": if (standCollect(+d.s)) { sfx("coin"); view.refresh("stand"); commit(); } break;
    case "standCancel": standCancel(+d.s); break;
    case "standSlot": buyStandSlot(); break;
    case "sound": snd.on = !snd.on; saveSound(); if (panel) renderPanel(); if (snd.on) { audio(); sfx("pop"); } break;
    case "music": snd.music = !snd.music; saveSound(); if (panel) renderPanel(); break;
    case "amb": snd.amb = !snd.amb; saveSound(); if (panel) renderPanel(); break;
    case "buzz": snd.buzz = !snd.buzz; saveSound(); if (panel) renderPanel(); buzz(15); break;
    case "quality": PREFS.quality = d.k; savePrefs(); view.setQuality(d.k); renderPanel(); break;
    case "signOut": closePanel(); if (window.saAuth) window.saAuth.signOut(); break;
    case "makeAccount": closePanel(); if (window.saAuth && window.saAuth.upgrade) window.saAuth.upgrade(); break;
    case "paint": S.style[d.k] = +d.i; save(); view.refresh("style"); renderPanel(); break;
    case "sell": sell(d.id, +d.n); break;
    case "deliverRush": deliverRush(); break;
    case "helpVisitor": helpVisitor(); break;
    case "qtab": panel.arg = d.k; renderPanel(); break;
    case "claimQuest": claimQuest(i); break;
    case "questBonus": claimQuestBonus(); break;
    case "claimAch": claimAch(d.id); break;
    case "ship": shipToMuseum(d.id); break;
    case "perk": pickPerk(d.k); break;
    case "sprinkler": buySprinkler(); break;
    case "land": buyLand(); break;
    case "barnUp": upgradeBarn(); break;
    case "tutorial": startTutorial(); break;
    case "startTut": startTutorial(); break;
    case "tutSkip": S.tut = TUT.length; save(); renderTut(); view.applyWeather(); break;
    case "tutNext": tutEvent("next"); break;
    case "confirmYes": { const fn = confirmFn; confirmFn = null; closePanel(); if (fn) fn(); break; }
    case "nameOk": { const v = (($("#nameBox") || {}).value || "").trim().slice(0, 16), fn = renameFn; renameFn = null; closePanel(); if (v && fn) { fn(v); commit(); } break; }
    case "import2d": import2D(); break;
    case "fresh3d": closePanel(); openPanel("welcome"); break;
    case "reset":
      askConfirm("New farm?", "Start a brand new farm? Your current farm will be erased. (Make a backup first if you want to keep it.)", "Start over", () => {
        S = fresh(); fillOrders(); save(); renderHud(); view.refresh("all"); openPanel("welcome");
      });
      break;
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closePanel(); view.closeTrays(); }
  if (e.key === "Enter" && e.target.id === "wxCity") useCity(e.target.value);
  if (e.key === "Enter" && e.target.id === "nameBox") document.querySelector('[data-act="nameOk"]').click();
});
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); else tick(); });

/* ============================================================
   SOUND: little effects and a gentle tune, all made on the fly (no sound files to download)
   ============================================================ */
export const snd = {on:true, music:true, amb:true, buzz:true}; // amb: birds, wind and rain around the farm; buzz: the phone vibrates a little
try { Object.assign(snd, JSON.parse(localStorage.getItem(SAVE_KEY + "-sound") || "{}")); } catch (e) {}
let AC = null, master = null, musicBus = null, noiseBuf = null;
function audio() {
  if (!AC) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try { AC = new Ctx(); } catch (e) { return null; }
    master = AC.createGain(); master.connect(AC.destination);
    musicBus = AC.createGain(); musicBus.connect(master);
    noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applySound();
  }
  if (AC.state === "suspended") AC.resume();
  return AC;
}
export function applySound() {
  const b = $("#soundBtn"); if (b) b.textContent = snd.on ? "🔊" : "🔇";
  if (!AC) return;
  master.gain.value = snd.on ? 0.55 : 0;
  musicBus.gain.value = snd.music ? 0.22 : 0;
}
function saveSound() { try { localStorage.setItem(SAVE_KEY + "-sound", JSON.stringify(snd)); } catch (e) {} applySound(); }
export function toggleSound() { snd.on = !snd.on; saveSound(); if (snd.on) { audio(); sfx("pop"); } if (panel) renderPanel(); }
function tone(f, d, o = {}) {
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime + (o.at || 0), osc = ac.createOscillator(), g = ac.createGain();
  osc.type = o.type || "sine";
  osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + d);
  if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib; lg.gain.value = f * .04; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + d + .05); }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(o.vol || .2, t + (o.attack || .005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  let out = g;
  if (o.lp) { const f2 = ac.createBiquadFilter(); f2.type = "lowpass"; f2.frequency.value = o.lp; g.connect(f2); out = f2; }
  osc.connect(g); out.connect(o.bus || BUS || master);
  osc.start(t); osc.stop(t + d + .05);
}
function noise(d, o = {}) {
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime + (o.at || 0), src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = o.freq || 1500; f.Q.value = o.q || 1;
  g.gain.setValueAtTime(o.vol || .2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(f); f.connect(g); g.connect(o.bus || BUS || master); src.start(t); src.stop(t + d + .05);
}
const SOUNDS = {
  pop:() => tone(520, .08, {to:820, vol:.12, type:"triangle"}),
  tick:() => tone(900, .03, {vol:.05, type:"triangle"}),
  plant:() => { tone(240, .09, {to:420, vol:.18}); noise(.05, {vol:.06, freq:900}); },
  harvest:() => { noise(.13, {vol:.14, freq:4000, q:.7}); tone(880, .12, {type:"triangle", vol:.09, at:.04, to:1320}); },
  feed:() => { noise(.08, {vol:.1, freq:2500}); noise(.08, {vol:.08, freq:2000, at:.07}); },
  collect:() => { tone(523, .09, {type:"triangle", vol:.16}); tone(784, .16, {type:"triangle", vol:.16, at:.08}); },
  coin:() => { tone(1318, .08, {type:"square", vol:.05}); tone(1760, .25, {type:"square", vol:.05, at:.07}); },
  make:() => { tone(330, .1, {type:"triangle", vol:.12}); tone(440, .12, {type:"triangle", vol:.12, at:.08}); },
  build:() => { noise(.22, {vol:.2, freq:280}); [392, 523, 659].forEach((f, i) => tone(f, .2, {type:"triangle", vol:.13, at:.14 + i * .08})); },
  magic:() => [784, 988, 1175, 1568].forEach((f, i) => tone(f, .18, {type:"sine", vol:.1, at:i * .05})),
  level:() => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .32, {type:"triangle", vol:.15, at:i * .09})),
  error:() => tone(170, .18, {type:"square", vol:.05, to:120}),
  thunder:() => { noise(1.6, {vol:.35, freq:110, q:.4}); noise(.9, {vol:.2, freq:260, q:.6, at:.1}); },
  pickup:() => tone(380, .12, {to:720, vol:.12, type:"triangle"}),
  place:() => { noise(.1, {vol:.18, freq:380}); tone(300, .12, {type:"triangle", vol:.12, to:210}); },
  truck:() => { tone(440, .12, {type:"square", vol:.04, lp:1400}); tone(554, .16, {type:"square", vol:.04, lp:1400, at:.14}); },
  chicken:() => { tone(1150, .07, {type:"square", vol:.035, to:720, lp:2500}); tone(1250, .09, {type:"square", vol:.035, to:650, lp:2500, at:.11}); },
  cow:() => tone(165, .75, {type:"sawtooth", vol:.09, to:118, lp:700, attack:.12}),
  sheep:() => tone(330, .55, {type:"sawtooth", vol:.06, to:290, lp:1500, attack:.05, vib:9}),
  horse:() => { tone(620, .7, {type:"sawtooth", vol:.05, to:300, lp:2200, attack:.03, vib:14}); noise(.3, {vol:.06, freq:600, at:.6}); },
  dog:() => { tone(520, .09, {type:"square", vol:.05, to:330, lp:1600}); tone(560, .1, {type:"square", vol:.05, to:340, lp:1600, at:.16}); },
  cat:() => tone(700, .45, {type:"triangle", vol:.08, to:950, attack:.08, vib:5}),
  slice:() => { noise(.12, {vol:.16, freq:3200, q:.5}); tone(1400, .09, {type:"triangle", vol:.05, to:420}); },
  bounce:() => tone(210, .07, {vol:.07, to:130}),
  water:() => { noise(.35, {vol:.12, freq:5200, q:.4}); noise(.25, {vol:.08, freq:3000, q:.6, at:.12}); },
  bird:() => { const f = 2400 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) tone(f * (1 + (Math.random() - .5) * .25), .07 + Math.random() * .05, {type:"sine", vol:.05, at:i * (.1 + Math.random() * .06), to:f * (Math.random() < .5 ? 1.3 : .8)}); },
  cricket:() => { for (let i = 0; i < 3; i++) tone(4300, .035, {type:"square", vol:.012, at:i * .06, lp:6000}); },
  shutter:() => { noise(.05, {vol:.25, freq:3500, q:.8}); noise(.07, {vol:.2, freq:1800, q:.8, at:.09}); },
  throw:() => { noise(.2, {vol:.09, freq:1100, q:.6}); tone(300, .16, {type:"triangle", vol:.06, to:520}); },
};
const BUZZ = {harvest:8, collect:12, level:[30, 40, 60], error:[25, 30, 25], build:[20, 30, 20], coin:6, magic:[10, 20, 10], thunder:[60, 40, 80]};
export function sfx(name) { if (BUZZ[name]) buzz(BUZZ[name]); if (!snd.on || !AC) return; try { SOUNDS[name] && SOUNDS[name](); } catch (e) {} }
// a light tap from the phone (Android; iPhones don't allow web pages to vibrate)
let lastBuzz = 0;
export function buzz(p) { if (!snd.buzz || !navigator.vibrate || document.hidden) return; const t = performance.now(); if (t - lastBuzz < 40) return; lastBuzz = t; try { navigator.vibrate(p); } catch (e) {} }
// a sound coming from somewhere on the farm: pan -1 (left) … 1 (right), vol 0…1 (quieter further away)
let BUS = null;
export function sfxAt(name, pan, vol) {
  if (!snd.on || !snd.amb || !AC || AC.state !== "running" || !SOUNDS[name] || document.hidden) return;
  const g = AC.createGain(), p = AC.createStereoPanner ? AC.createStereoPanner() : null;
  g.gain.value = clamp(vol, 0, 1); if (p) { p.pan.value = clamp(pan, -1, 1); g.connect(p); p.connect(master); } else g.connect(master);
  BUS = g; try { SOUNDS[name](); } catch (e) {} BUS = null;
}
// the steady sounds of the farm: wind in the grass and rain on the roof
const loops = {};
function loop(name, freq, type, q) {
  if (loops[name]) return loops[name];
  const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  src.buffer = noiseBuf; src.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = 0;
  src.connect(f); f.connect(g); g.connect(master); src.start();
  return (loops[name] = {g, f});
}
export function ambience(wind, rain) {
  if (!AC || AC.state !== "running") return;
  const on = snd.on && snd.amb && !document.hidden ? 1 : 0, t = AC.currentTime;
  const w = loop("wind", 420, "lowpass", .7), r = loop("rain", 2600, "bandpass", .5);
  w.g.gain.setTargetAtTime(on * (.012 + wind * .05), t, 1.5); w.f.frequency.setTargetAtTime(300 + wind * 500 + Math.random() * 200, t, 2);
  r.g.gain.setTargetAtTime(on * (rain ? .09 : 0), t, 1.2);
}
// A soft, wandering tune in C major pentatonic over a I–V–vi–IV bass line.
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const SCALE = [60, 62, 64, 67, 69, 72, 74, 76, 79], ROOTS = [48, 43, 45, 41];
let musicAt = 0, musicStep = 0, melody = 4;
function musicTick() {
  if (!AC || AC.state !== "running" || !snd.on || !snd.music || document.hidden) { musicAt = 0; return; }
  const beat = 60 / 88 / 2; // eighth notes
  if (musicAt < AC.currentTime) musicAt = AC.currentTime + .05;
  while (musicAt < AC.currentTime + .35) {
    const at = musicAt - AC.currentTime, pos = musicStep % 8, root = ROOTS[Math.floor(musicStep / 8) % 4];
    if (pos === 0 || pos === 4) tone(midi(root), .7, {vol:.16, at, bus:musicBus});
    if (pos === 2 || pos === 6) tone(midi(root + 12), .25, {vol:.05, at, bus:musicBus, type:"triangle"});
    if (Math.random() < (pos % 2 ? .35 : .7)) {
      melody = clamp(melody + pick([-2, -1, -1, 0, 1, 1, 2]), 0, SCALE.length - 1);
      tone(midi(SCALE[melody]), .45, {type:"triangle", vol:.07, at, bus:musicBus, attack:.01});
    }
    musicAt += beat; musicStep++;
  }
}
setInterval(musicTick, 120);
document.addEventListener("pointerdown", () => { if (snd.on) audio(); }, true); // browsers only allow sound after a touch

/* ============================================================
   BACKUP & RESTORE (also accepts backups from the 2D game)
   ============================================================ */
const backupData = () => ({game:"sunny-acres", v:1, d:3, at:Date.now(), farm:S, weather:WX});
const b64 = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function toCode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (window.CompressionStream) {
    const z = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
    return "SA2:" + b64(new Uint8Array(await new Response(z).arrayBuffer()));
  }
  return "SA1:" + b64(bytes);
}
async function fromCode(text) {
  const code = text.trim();
  if (code.startsWith("{")) return JSON.parse(code);
  const clean = code.replace(/\s+/g, ""), tag = clean.slice(0, 4);
  let bytes = unb64(clean.slice(4));
  if (tag === "SA2:") bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
  else if (tag !== "SA1:") throw new Error("not a backup");
  return JSON.parse(new TextDecoder().decode(bytes));
}
function markBackedUp() { S.lastBackup = Date.now(); save(); if (panel && panel.type === "settings") renderPanel(); }
async function backupFile() {
  const name = "sunny-acres-3d-backup-" + today() + ".json";
  const blob = new Blob([JSON.stringify(backupData())], {type:"application/json"});
  try { // phones: open the share sheet so it can go to Files, Drive, email…
    const file = new File([blob], name, {type:"application/json"});
    if (navigator.canShare && navigator.canShare({files:[file]})) {
      await navigator.share({files:[file], title:"Sunny Acres backup"});
      markBackedUp(); toast("💾 Backup saved"); return;
    }
  } catch (e) { if (e && e.name === "AbortError") return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  markBackedUp(); toast("💾 Backup file downloaded (if nothing downloaded, use Backup code instead)");
}
async function showBackupCode() { openPanel("backup", {mode:"show", code:await toCode(backupData())}); }
function copyCode() {
  const box = $("#codeBox");
  if (!box) return;
  box.select();
  const done = () => { markBackedUp(); toast("📋 Code copied! Paste it somewhere safe."); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(box.value).then(done, () => { try { document.execCommand("copy"); } catch (e) {} done(); });
  else { try { document.execCommand("copy"); } catch (e) {} done(); }
}
// a 2D farm keeps its layout fields (they're simply ignored here); decorations placed on the 2D map go back in the Decor box
function adopt(farm) {
  const hadTut = farm.tut != null, s = upgrade(farm);
  for (const d of s.decor.placed.splice(0)) if (d.x == null) s.decor.inv[d.id] = (s.decor.inv[d.id] || 0) + 1; else s.decor.placed.push(d);
  s.plots = s.plots.slice(0, MAX_PLOTS + LAND_FIELDS * LAND.length);
  if (!hadTut) s.tut = TUT.length; // a farm from the 2D game doesn't need the tutorial
  return s;
}
async function restoreFrom(text) {
  let data;
  try { data = await fromCode(text); } catch (e) { data = null; }
  const farm = data && (data.farm || data);
  if (!farm || !Array.isArray(farm.plots) || typeof farm.level !== "number") { toast("That doesn't look like a Sunny Acres backup."); sfx("error"); return; }
  const when = data.at ? " from " + new Date(data.at).toLocaleDateString() : "";
  askConfirm("Restore farm?", "Restore the level " + farm.level + " farm" + when + "? The farm on this phone will be replaced.", "Restore", () => {
    restoring = true;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(adopt(farm)));
      if (data.weather) localStorage.setItem(WX_KEY, JSON.stringify(Object.assign({look:"real"}, data.weather)));
    } catch (e) { restoring = false; toast("Couldn't restore. Is the phone's storage full?"); return; }
    location.reload();
  });
}
function import2D() {
  try {
    const farm = JSON.parse(localStorage.getItem(SAVE_2D));
    S = adopt(farm); fillOrders(); save(); closePanel(); renderHud(); view.refresh("all");
    toast("🌻 Your farm moved in! Level " + S.level + ", " + S.coins + " 🪙");
  } catch (e) { toast("Couldn't read the 2D farm. Try a backup code instead."); closePanel(); openPanel("welcome"); }
}
document.addEventListener("change", async (e) => {
  if (e.target.id !== "restoreInput") return;
  const f = e.target.files && e.target.files[0];
  e.target.value = "";
  if (f) restoreFrom(await f.text());
});

// ---------- start ----------
export function start() {
  const how = load();
  refreshTheme();
  fillOrders();
  renderHud(); applySound();
  if (how === "has2d") openPanel("import2d");
  else if (how === "new") openPanel("welcome");
  else if (S.tut == null) S.tut = TUT.length;
  setInterval(tick, 1000);
  if (!WX.cur || Date.now() - WX.cur.t > 10 * 60e3) fetchWeather();
  setInterval(fetchWeather, 15 * 60e3);
  if (how === "3d") setTimeout(eventTick, 1500);
  // a gentle, once-a-day reminder to back up
  if (how === "3d" && S.level >= 3 && (!S.lastBackup || now() - S.lastBackup > 7 * 864e5) && S.lastNag !== today()) {
    S.lastNag = today(); save();
    setTimeout(() => toast("💾 Tip: back up your farm. Tap ⚙️ → Backup."), 5000);
  }
  return how;
}
export { askConfirm, closePanel as close };

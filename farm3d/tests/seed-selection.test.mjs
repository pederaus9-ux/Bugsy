import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise actual page handlers and the unmodified production planting rules.
// Only DOM nodes, world effects and environment services are fixture boundaries.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
function section(source,start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a);
  assert(a>=0&&b>a,'production source anchors must exist: '+start);
  return source.slice(a,b);
}
function element(){
  const classes=new Set();
  return {hidden:true,dataset:{},attributes:{},innerHTML:'',textContent:'',
    setAttribute(k,v){this.attributes[k]=v;},
    classList:{remove:k=>classes.delete(k),add:k=>classes.add(k),contains:k=>classes.has(k),toggle(k,on){if(on)classes.add(k);else classes.delete(k);}}};
}
function fixture(){
  const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const S={level:1,coins:10,barn:{wheat:2},gold:{},plots:Array.from({length:4},()=>({crop:null,soil:100})),lastCrop:null};
  const events={commits:0,toasts:[],keys:new Map()};
  const env={S,events,console,innerWidth:844,innerHeight:390,performance:{now:()=>1000},document:{getElementById:get},
    soilNow:p=>p.soil,now:()=>1000,isRaining:()=>false,sprinkled:()=>false,heatwave:()=>false,
    growTime:()=>20000,toast:m=>events.toasts.push(m),sfx:()=>{},
    GS:()=>S,seedTray:get('seedTray'),infoTray:get('infoTray'),seedTool:get('seedTool'),
    seedChoice:get('seedChoice'),seedIcon:get('seedIcon'),seedName:get('seedName'),
    actBtn:get('actBtn'),xhair:get('xhair'),plots:S.plots.map(()=>({g:{}})),
    farmDrag:null,walk:{},thirdPerson:false,aim:null,aimT:0,inBarn:false,visiting:null,
    photoMode:false,wardrobeOn:false,editMode:null,rotatePaused:false,
    squish:()=>{},buildPlants:()=>{},aimScan:()=>{},handPunch:()=>{},
    harvestAt:()=>false,fpBurst:()=>{},syncSoil:()=>{},petFacing:()=>{},enterBarn:()=>{},
    onTap:()=>{throw Error('Equipped walking Plant must not reopen the picker');},
    addEventListener:(name,fn)=>events.keys.set(name,fn),ART:'art/'};
  vm.createContext(env);
  vm.runInContext(section(game,'export const ITEMS =','export const ANIMALS =').replaceAll('export ',''),env);
  vm.runInContext(section(game,'export const have =','export const goldOf =').replaceAll('export ',''),env);
  vm.runInContext(section(game,'export function plant(','// watering:').replace('export ',''),env);
  vm.runInContext(`globalThis.G={ITEMS,CROPS,plant,have,panel:null,THEME:{season:'spring'},SEASON_E:{spring:'🌸'},
    inSeason:()=>true,CROP_SEASONS:{},soilNow,soilWord:()=>'',fmt:()=>'',close(){},sfx,
    tutEvent(){},commit(){events.commits++;},waterPlot:()=>true};
    let armed=null,pendingPlot=-1,trayFor=null;`,env);
  const sources=[
    section(html,'function closeTrays(','function renderSeeds('),
    section(html,'function renderSeeds(','// tapping an empty field'),
    section(html,'function openSeeds(','// while a finger is dragging'),
    section(html,'function pickSeed(','// or drag a seed'),
    section(html,'function showInfo(','const esc ='),
    section(html,'function plantAt(','function harvestAt('),
    section(html,'function updateAim(','function interact('),
    section(html,'function interact(','actBtn.addEventListener('),
    section(html,'addEventListener("keydown", (e) => { if (!rotatePaused && !G.panel && walk','// the harvest, up close:')
  ];
  vm.runInContext(sources.join('\n')+`\nglobalThis.api={openSeeds,pickSeed,closeTrays,showInfo,plantAt,interact,updateAim,
    get armed(){return armed;},get pending(){return pendingPlot;},
    get putAway(){return typeof putAwaySeeds==='function'?putAwaySeeds:undefined;},
    setAim(i){aim={type:'plot',i,label:'Plant',icon:'🌱'};}};`,env);
  return {S,env,events,get,api:env.api};
}

test('picking a seed plants the selected plot, closes the picker and keeps it equipped',()=>{
  const f=fixture();f.api.openSeeds(0);f.api.pickSeed('wheat');
  assert.equal(f.S.plots[0].crop,'wheat');assert.equal(f.get('seedTray').hidden,true);
  assert.equal(f.api.armed,'wheat');assert.equal(f.api.pending,-1);
});

test('walking Plant repeats the selected crop without reopening its picker',()=>{
  const f=fixture();f.api.openSeeds(0);f.api.pickSeed('wheat');f.api.closeTrays();
  f.api.setAim(1);assert.equal(f.api.interact(),true);
  assert.equal(f.S.plots[1].crop,'wheat');assert.equal(f.S.barn.wheat,undefined);
  assert.equal(f.S.coins,10);assert.equal(f.events.commits,2);assert.equal(f.get('seedTray').hidden,true);
  f.api.interact();assert.equal(f.events.commits,2,'a filled plot cannot charge or commit twice');
  f.api.setAim(2);f.api.interact();assert.equal(f.S.coins,9,'existing coin price applies after inventory runs out');
});

test('changing the equipped seed does not plant an old pending plot',()=>{
  const f=fixture();f.api.openSeeds(0);f.api.pickSeed('wheat');
  f.api.openSeeds(-1);f.api.pickSeed('corn');
  assert.equal(f.api.armed,'corn');assert.equal(f.events.commits,1);assert.equal(f.S.coins,10);
  f.api.setAim(1);f.api.interact();assert.equal(f.S.plots[1].crop,'corn');assert.equal(f.S.coins,8);
});

test('failed purchase keeps the equipped seed and does not change or charge a plot',()=>{
  const f=fixture();f.S.coins=0;f.S.barn={};f.api.openSeeds(0);f.api.pickSeed('corn');
  assert.equal(f.api.armed,'corn');assert.equal(f.get('seedTray').hidden,true);
  f.api.setAim(1);f.api.interact();
  assert.equal(f.S.coins,0);assert(f.S.plots.every(p=>p.crop===null));assert.equal(f.events.commits,0);
  assert.match(f.events.toasts.at(-1),/Not enough coins/);
});

test('opening information and changing view context do not unequip a seed',()=>{
  const f=fixture();f.api.openSeeds(0);f.api.pickSeed('wheat');
  f.api.showInfo('Growing crop',{type:'plot',i:0});
  assert.equal(f.get('seedTool').hidden,true,'equipment control must not cover another information tray');
  f.api.closeTrays();
  f.env.thirdPerson=true;f.api.setAim(1);f.api.interact();
  assert.equal(f.api.armed,'wheat');assert.equal(f.S.plots[1].crop,'wheat');
});

test('putting seeds away explicitly clears the selection and target without spending',()=>{
  const f=fixture();f.api.openSeeds(0);f.api.pickSeed('wheat');
  assert.equal(typeof f.api.putAway,'function');f.api.putAway();
  assert.equal(f.api.armed,null);assert.equal(f.api.pending,-1);assert.equal(f.get('seedTool').hidden,true);
  assert.equal(f.events.commits,1);
});

test('locked and unknown crops cannot become equipped or call the planting rule',()=>{
  const f=fixture();f.api.openSeeds(0);
  assert.doesNotThrow(()=>f.api.pickSeed('not-a-crop'));assert.equal(f.api.armed,null);
  f.api.pickSeed('pumpkin');assert.equal(f.api.armed,null);assert.equal(f.events.commits,0);
});

test('equipped planting cannot modify a visited farm or another blocked mode',()=>{
  for(const mode of ['visiting','editMode','photoMode','wardrobeOn','inBarn']){
    const f=fixture();f.api.openSeeds(0);f.api.pickSeed('wheat');f.env[mode]=true;
    const before=JSON.stringify(f.S);f.api.setAim(1);f.api.interact();
    assert.equal(JSON.stringify(f.S),before,mode);assert.equal(f.events.commits,1,mode);
  }
});

test('walking action label names the equipped crop while keeping its Plant action identity',()=>{
  const f=fixture();f.api.openSeeds(0);f.api.pickSeed('corn');f.api.setAim(1);f.api.updateAim(0);
  assert.match(f.get('actBtn').innerHTML,/Plant Corn/);assert.equal(f.get('actBtn').attributes['aria-label'],'Plant Corn');
  assert.equal(f.get('seedTool').hidden,false);assert.equal(f.get('seedName').textContent,'Corn');
});

test('E and Enter plant once and repeated keydown events do not spend twice',()=>{
  for(const code of ['KeyE','Enter']){
    const f=fixture();f.api.openSeeds(0);f.api.pickSeed('wheat');f.api.setAim(1);
    const key=f.events.keys.get('keydown'),target={closest:()=>null};
    key({code,repeat:false,target});key({code,repeat:true,target});
    assert.equal(f.S.plots[1].crop,'wheat');assert.equal(f.events.commits,2);
  }
});

test('equipped seed chip steps aside while the picker is open and returns when it closes',()=>{
  const f=fixture();f.api.openSeeds(0);f.api.pickSeed('wheat');
  f.api.openSeeds(-1);assert.equal(f.get('seedTool').hidden,true,'the chip must not cover the seed picker header');
  f.api.closeTrays();assert.equal(f.get('seedTool').hidden,false);assert.equal(f.api.armed,'wheat');
});

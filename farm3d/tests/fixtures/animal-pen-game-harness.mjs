import fs from 'node:fs';import vm from 'node:vm';import * as Cow from '../../cow-care.js';import * as Chicken from '../../chicken-care.js';import {decodeAnimalPens} from '../../animal-pen-layout.js';
export function loadPenGame({raw,predecessor=false,time=1900000000000,seed=4242}={}){
 const storage=new Map(raw?[['sunny-acres-3d-v1',raw]]:[]),events=[];let quota=false,writes=0,clock=time;
 const source=fs.readFileSync(new URL(predecessor?'./game-before-pen-writer.js':'../../game.js',import.meta.url),'utf8');
 class Clock extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
 const seededMath=Object.create(Math);let randomState=seed>>>0;seededMath.random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
 const ctx={Math:seededMath,...Cow,...Chicken,decodeAnimalPens,URL,URLSearchParams,structuredClone,console,setTimeout(){},setInterval(){},clearInterval(){},Date:Clock,location:{search:'',hostname:'127.0.0.1',href:'http://127.0.0.1/farm3d/'},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(quota)throw Error('quota');writes++;storage.set(k,String(v));},removeItem:k=>storage.delete(k)},document:{hidden:false,addEventListener(){},getElementById:()=>({}),querySelector(){return null;}},window:{addEventListener(){},dispatchEvent:e=>events.push(e.type),matchMedia:()=>({matches:false,addEventListener(){}})},navigator:{},MARKET_WINDOW_MS:21600000,Event:class{constructor(type){this.type=type;}}};
 const code=source.replace(/^import .*?;\s*$/gm,'').replace(/export\s*\{[^}]*\};?/g,'').replace(/\bexport\s+/g,'');
 vm.runInNewContext(code+';globalThis.G={load,save,upgrade,migrate,SAVE_VERSION,settleCows,commitAnimalPenLayout:typeof commitAnimalPenLayout==="function"?commitAnimalPenLayout:null,get S(){return S}}',ctx);ctx.G.load();
 return {G:ctx.G,events,storage,ctx,get raw(){return storage.get('sunny-acres-3d-v1');},get writes(){return writes;},setQuota:v=>quota=v,setTime:v=>clock=v};
}

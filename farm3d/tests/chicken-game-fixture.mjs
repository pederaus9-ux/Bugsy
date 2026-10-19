// Node-only boundary shim for the real game module. Native input and persistence
// are qualified separately in the browser and emulator suites.
const storage=new Map(),nodes=new Map();
const element=()=>({style:{},dataset:{},children:[],classList:{add(){},remove(){},toggle(){}},appendChild(){},querySelector(){return null;},querySelectorAll(){return[];},closest(){return this;},setAttribute(){},focus(){},remove(){}});
globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
globalThis.location={search:'',hostname:'127.0.0.1',href:'http://127.0.0.1/farm3d/'};
globalThis.document={hidden:false,documentElement:{setAttribute(){}},addEventListener(){},querySelector:s=>{if(!nodes.has(s))nodes.set(s,element());return nodes.get(s);},querySelectorAll:()=>[],getElementById:()=>null,createElement:element};
globalThis.window={addEventListener(){},dispatchEvent(){},matchMedia:()=>({matches:false,addEventListener(){}})};
Object.defineProperty(globalThis,'navigator',{value:{vibrate(){}},configurable:true});
const realInterval=globalThis.setInterval;globalThis.setInterval=()=>0;
export const G=await import('../game.js?chicken-contract');globalThis.setInterval=realInterval;
export const T=1_000_000;
let clock=T;Date.now=()=>clock;
export function at(t){clock=t;}
export function reset(n=6){storage.clear();at(T);G.load();Object.assign(G.S,{level:100,tut:99,nextEventAt:9e15,nextRushAt:9e15,nextVisitorAt:9e15,barnCap:1000});G.S.pens.chicken={owned:true,list:Array(n).fill(0),meta:Array.from({length:n},()=>({name:'Hen',love:50,loveAt:T}))};G.S.barn={chicken_feed:6};G.opts.quiet=true;return G.S;}

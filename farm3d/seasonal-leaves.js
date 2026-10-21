import {Color,Float32BufferAttribute} from './lib/three.module.min.js';
const PALETTES={spring:[0x91b84e,0xa5c76a,0x83ac53,0xb0ca70],summer:[0x5c8b3e,0x6e9846,0x4e7c38,0x789c4b],fall:[0xc78c31,0xc87030,0xb55235,0x98703c],winter:[0x8b704d]};
const colours=Object.fromEntries(Object.entries(PALETTES).map(([s,p])=>[s,p.map(c=>new Color(c))]));
// The photo's green pigment must not multiply an autumn leaf back to green.
// Keep the photographed veins/alpha and the existing weather/snow shader.
export function seasonalLeafShader(shader){
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec4 sampledDiffuseColor=texture2D(map,vMapUv);
 float leafLight=dot(sampledDiffuseColor.rgb,vec3(.2126,.7152,.0722));
 diffuseColor*=vec4(vec3(leafLight),sampledDiffuseColor.a);
 #endif`);
}
export function createSeasonalLeaves(){
 const entries=new Map();let season=null;
 function paint(g,e){
  if(!season)return;const palette=colours[season],a=g.attributes.color.array;
  for(let i=0;i<g.attributes.color.count;i++){
   // Four vertices belong to one photographed leaf card. Keep its colour whole.
   const c=palette[(Math.abs(e.seed)+Math.floor(i/4)*7)%palette.length],shade=e.shade[i];
   a[i*3]=c.r*shade;a[i*3+1]=c.g*shade;a[i*3+2]=c.b*shade;
  }
  g.attributes.color.needsUpdate=true;g.setDrawRange(e.start,season==='winter'?0:e.count);
 }
 return {get size(){return entries.size;},get season(){return season;},
  register(g,seed=0){if(entries.has(g))return;const n=g.attributes.position.count,original=g.attributes.color;
   const shade=Float32Array.from({length:n},(_,i)=>original?original.getY(i):1);
   if(!original)g.setAttribute('color',new Float32BufferAttribute(n*3,3));
   const e={seed:seed|0,shade,start:g.drawRange.start,count:g.drawRange.count};entries.set(g,e);
   g.addEventListener('dispose',()=>entries.delete(g));paint(g,e);
  },
  setSeason(value){value=colours[value]?value:'summer';if(value===season)return false;season=value;for(const[g,e]of entries)paint(g,e);return true;}
 };
}

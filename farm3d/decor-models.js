import * as T from './lib/three.module.min.js';
import {mergeGeometries} from './lib/addons/utils/BufferGeometryUtils.js';

// Visual consumers of existing IDs only: no inventory, price or save ownership.
export const FARM_DECOR_IDS=Object.freeze(['tulips','sunflowers','roses','mailbox','bench','lantern','statue','fountain','mushroom','flamingo','balloons','cactus','unicorn','trophy','tent','rainbow','carousel','ferris','castle','blossom','hive','birdhouse','parasol','melon','pool','maple','hay','cider','sled','skates','igloo']);
const C={wood:0x805636,darkWood:0x503b2b,metal:0x384343,cream:0xf1e3bb,white:0xeeeade,green:0x3f713e,leaf:0x669345,red:0xb94c43,gold:0xe5b04c,blue:0x527e9f,pink:0xd987a4,orange:0xdb812f,stone:0x92958b,water:0x5eacb8,dark:0x282c2b};

export function createFarmDecoration(id,{height=1.15,footprint=1.05}={}){
 if(!FARM_DECOR_IDS.includes(id))return null;
 const root=new T.Group(),body=new T.Group(),materials=new Map();root.name='Farm decoration '+id;root.userData.decorId=id;root.add(body);
 const mat=(color,glow=0)=>{const key=color+':'+glow;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.76,emissive:glow?0xffac42:0,emissiveIntensity:glow}));return materials.get(key);};
 const mesh=(geo,color,x=0,y=0,z=0,rot=[0,0,0],glow=0)=>{const o=new T.Mesh(geo,mat(color,glow));o.position.set(x,y,z);o.rotation.set(...rot);body.add(o);return o;};
 const box=(x,y,z,w,h,d,c,rot=[0,0,0])=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,rot);
 const ball=(x,y,z,rx,ry,rz,c,rot=[0,0,0])=>{const o=mesh(new T.SphereGeometry(1,10,6),c,x,y,z,rot);o.scale.set(rx,ry,rz);return o;};
 const cyl=(x,y,z,rt,rb,h,c,rot=[0,0,0],glow=0)=>mesh(new T.CylinderGeometry(rt,rb,h,12),c,x,y,z,rot,glow);
 const ring=(x,y,z,r,t,c,rot=[0,0,0],arc=Math.PI*2)=>mesh(new T.TorusGeometry(r,t,5,24,arc),c,x,y,z,rot);
 const rod=(a,b,r,c)=>{const from=new T.Vector3(...a),to=new T.Vector3(...b),v=to.clone().sub(from),o=cyl(0,0,0,r,r,v.length(),c);o.position.copy(from.add(to).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;};
 const tube=(points,r,c)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,r,5,false),c);
 const shape=(points,depth,c,x=0,y=0,z=0)=>{const s=new T.Shape();points.forEach(([a,b],i)=>i?s.lineTo(a,b):s.moveTo(a,b));s.closePath();return mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:8}),c,x,y,z);};
 const lathe=(points,c,x=0,y=0,z=0)=>mesh(new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),16),c,x,y,z);
 const soil=()=>cyl(0,.035,0,.45,.42,.07,C.darkWood);
 const flower=(x,z,h,color,sun=false)=>{
  const top=x+.04;rod([x,.05,z],[top,h,z],.018,C.green);
  for(const [sign,y]of [[-1,h*.4],[1,h*.62]]){const leaf=ball(x+sign*.1,y,z,.14,.035,.065,C.leaf,[0,0,sign*.5]);rod([x,y-.05,z],[leaf.position.x,y,z],.012,C.green);}
  const n=sun?12:7,r=sun?.16:.105;for(let i=0;i<n;i++){const a=i*Math.PI*2/n;ball(top+Math.cos(a)*r,h+Math.sin(a)*r,z,.105,sun?.045:.06,.04,color,[0,0,a]);}
  cyl(top,h,z+.045,sun?.12:.055,sun?.12:.055,.07,sun?C.darkWood:C.gold,[Math.PI/2,0,0]);
 };
 const tree=(autumn=false)=>{
  rod([0,.02,0],[0,.94,0],.055,C.wood);for(const [x,y,z]of [[-.25,.73,.04],[.27,.86,-.04],[-.14,1.02,-.15]])rod([0,.4,0],[x,y,z],.025,C.wood);
  if(autumn){const leaf=[[-.14,0],[-.24,.13],[-.13,.15],[-.2,.28],[-.07,.24],[0,.42],[.07,.24],[.2,.28],[.13,.15],[.24,.13],[.14,0],[.03,-.03],[0,-.13],[-.03,-.03]];
   for(let i=0;i<7;i++){const a=i*2.4,x=Math.cos(a)*.23,y=.65+(i%3)*.17,z=Math.sin(a)*.18,o=shape(leaf,.04,[C.orange,C.gold,C.red][i%3],x,y,z);o.rotation.set(.1,a*.35,(i%3-1)*.35);}
  }else{
   for(const [x,y,z]of [[-.22,.85,0],[.19,1.02,0],[0,.91,-.19]])ball(x,y,z,.27,.24,.25,C.leaf);
   for(let i=0;i<9;i++){const a=i*2.4,x=Math.cos(a)*.3,y=.8+(i%3)*.12,z=Math.sin(a)*.23;for(let k=0;k<5;k++){const b=k*Math.PI*2/5;ball(x+Math.cos(b)*.045,y+Math.sin(b)*.045,z,.045,.035,.03,C.pink,[0,0,b]);}ball(x,y,z+.025,.024,.024,.024,C.cream);}
  }
 };
 const horse=(x,y,z,scale=1,horn=false)=>{
  const p=(a,b,c)=>[x+a*scale,y+b*scale,z+c*scale];
  ball(...p(0,.37,0),.26*scale,.15*scale,.12*scale,C.cream);ball(...p(.19,.55,0),.1*scale,.2*scale,.09*scale,C.cream,[0,0,-.4]);ball(...p(.25,.7,.015),.15*scale,.09*scale,.09*scale,C.cream);
  for(const a of [-.17,.16])for(const c of [-.07,.07]){rod(p(a,.03,c),p(a,.32,c),.035*scale,C.cream);box(...p(a,.035,c),.09*scale,.07*scale,.08*scale,C.metal);}
  for(let i=0;i<4;i++)ball(...p(.1,.49+i*.055,-.01),.035*scale,.045*scale,.105*scale,C.pink);
  tube([p(-.23,.4,0),p(-.36,.37,0),p(-.39,.16,0)],.035*scale,C.pink);
  for(const c of [-.06,.06]){cyl(...p(.24,.84,c),0,.035*scale,.16*scale,C.cream);ball(...p(.32,.73,c),.014*scale,.014*scale,.01*scale,C.dark);}
  if(horn)cyl(...p(.32,.87,0),0,.035*scale,.21*scale,C.gold,[0,0,-.3]);
 };
 switch(id){
 case 'tulips':{
  soil();for(const [x,z,h,c]of [[-.2,.1,.64,C.red],[.16,.11,.78,C.pink],[0,-.15,.87,C.gold]]){
   rod([x,.04,z],[x,h,z],.018,C.green);for(const sign of [-1,1])ball(x+sign*.08,h*.45,z,.04,.23,.055,C.leaf,[0,0,-sign*.35]);
   for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(x+Math.cos(a)*.055,h,z+Math.sin(a)*.055,.065,.14,.055,c,[0,0,Math.cos(a)*.12]);}
  }break;
 }
 case 'sunflowers':soil();flower(-.17,-.05,.83,C.gold,true);flower(.2,.13,.64,C.gold,true);break;
 case 'roses':{
  soil();for(const [x,y,z]of [[-.18,.32,0],[.17,.42,.03],[0,.51,-.15]])ball(x,y,z,.27,.27,.23,C.green);
  for(let i=0;i<5;i++){const a=i*2.4,x=Math.cos(a)*.23,y=.5+(i%2)*.13,z=Math.sin(a)*.22;for(let k=0;k<6;k++){const b=k*Math.PI/3;ball(x+Math.cos(b)*.05,y+Math.sin(b)*.05,z+.1,.065,.045,.035,k%2?C.red:0xd66673,[0,0,b]);}ball(x,y,z+.13,.035,.035,.035,C.red);}break;
 }
 case 'mailbox':{
  box(0,.4,0,.1,.8,.1,C.wood);box(0,.04,0,.35,.08,.3,C.darkWood);
  const arch=[[-.3,0],[.3,0],[.3,.26]];for(let i=0;i<=12;i++){const a=i*Math.PI/12;arch.push([Math.cos(a)*.3,.26+Math.sin(a)*.3]);}
  shape(arch,.48,C.blue,0,.72,-.24);box(0,.89,.255,.28,.045,.025,C.dark);rod([.32,.87,0],[.32,1.22,0],.018,C.metal);box(.4,1.21,0,.18,.1,.04,C.red);break;
 }
 case 'bench':{
  for(const x of [-.4,.4])for(const z of [-.19,.19])box(x,.22,z,.065,.44,.065,C.metal);
  for(const z of [-.18,0,.18])box(0,.45,z,1.05,.07,.14,C.wood);
  for(const x of [-.4,.4]){box(x,.65,-.21,.06,.5,.06,C.metal);box(x,.62,.01,.065,.055,.49,C.metal);}
  for(const y of [.68,.85])box(0,y,-.23,1.05,.13,.06,C.wood);break;
 }
 case 'lantern':{
  box(0,.05,0,.48,.1,.4,C.darkWood);rod([0,.1,0],[0,1.14,0],.04,C.wood);rod([0,1.13,0],[0,1.13,.22],.028,C.metal);
  const o=lathe([[0,0],[.15,.04],[.24,.17],[.27,.32],[.24,.47],[.15,.6],[0,.64]],C.orange,0,.42,.23);o.material=mat(C.orange,.3);
  for(let i=0;i<8;i++){const y=.48+i*.068,r=.15+.105*Math.sin((y-.42)/.64*Math.PI);ring(0,y,.23,r,.012,C.gold,[Math.PI/2,0,0]);}
  cyl(0,.44,.23,.15,.15,.06,C.metal);cyl(0,1.05,.23,.15,.15,.07,C.metal);ring(0,1.12,.23,.065,.013,C.metal);break;
 }
 case 'statue':{
  box(0,.1,0,.65,.2,.57,C.stone);box(0,.55,0,.4,.73,.35,C.stone);box(0,.97,0,.49,.45,.42,C.stone);
  box(0,.97,.25,.12,.27,.16,C.stone);for(const x of [-.14,.14]){box(x,1.04,.23,.2,.08,.07,C.dark);box(x,1.09,.25,.22,.055,.08,C.stone);}box(0,.83,.24,.27,.055,.055,C.dark);break;
 }
 case 'fountain':{
  lathe([[0,0],[.55,0],[.61,.08],[.61,.22],[.52,.26],[.47,.13],[0,.13]],C.stone);
  cyl(0,.15,0,.49,.49,.035,C.water);cyl(0,.48,0,.09,.14,.7,C.stone);cyl(0,.83,0,.3,.19,.12,C.stone);ring(0,.89,0,.3,.035,C.stone,[Math.PI/2,0,0]);cyl(0,.9,0,.265,.265,.025,C.water);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;tube([[0,.99,0],[Math.cos(a)*.17,1.07,Math.sin(a)*.17],[Math.cos(a)*.34,.57,Math.sin(a)*.34],[Math.cos(a)*.41,.18,Math.sin(a)*.41]],.018,C.water);}break;
 }
 case 'mushroom':{
  cyl(0,.3,0,.12,.18,.6,C.cream);lathe([[0,0],[.45,0],[.46,.07],[.36,.23],[.16,.35],[0,.38]],C.red,0,.48,0);
  for(let i=0;i<6;i++){const a=i*2.4,r=.12+(i%2)*.13;ball(Math.cos(a)*r,.79-r*.35,Math.sin(a)*r,.06,.025,.06,C.cream);}break;
 }
 case 'flamingo':{
  soil();ball(0,.59,0,.22,.16,.15,C.pink);tube([[.14,.63,0],[.27,.77,0],[.18,.95,0],[.29,1.08,0]],.045,C.pink);ball(.31,1.08,0,.085,.075,.07,C.pink);cyl(.4,1.04,.01,0,.045,.19,C.dark,[0,0,.9]);
  rod([-.07,.04,0],[-.06,.5,0],.017,C.orange);rod([.1,.49,0],[.14,.25,0],.017,C.orange);rod([.14,.25,0],[.26,.3,0],.017,C.orange);ball(0,.61,.13,.19,.09,.045,C.red,[0,0,.2]);ball(.33,1.1,.067,.013,.013,.01,C.dark);break;
 }
 case 'balloons':{
  cyl(0,.035,0,.25,.27,.07,C.metal);for(const [x,y,z,c]of [[-.2,.95,0,C.red],[.18,1.1,0,C.blue],[0,.89,.2,C.gold]]){ball(x,y,z,.2,.26,.18,c);cyl(x,y-.28,z,.025,.055,.06,c);tube([[0,.07,0],[x*.4,.45,z*.4],[x,y-.3,z]],.008,C.cream);}break;
 }
 case 'cactus':{
  cyl(0,.14,0,.27,.19,.28,C.orange);cyl(0,.29,0,.29,.29,.07,C.orange);cyl(0,.32,0,.25,.25,.02,C.darkWood);
  cyl(0,.68,0,.105,.12,.72,C.green);ball(0,1.04,0,.105,.105,.105,C.green);
  for(const sign of [-1,1]){tube([[0,.54,0],[sign*.23,.6,0],[sign*.25,.86,0]],.065,C.green);ball(sign*.25,.86,0,.065,.075,.065,C.green);}break;
 }
 case 'unicorn':box(0,.04,0,.9,.08,.5,C.blue);horse(0,.08,0,1,true);break;
 case 'trophy':{
  box(0,.09,0,.5,.18,.4,C.darkWood);cyl(0,.31,0,.08,.14,.3,C.gold);lathe([[0,0],[.11,0],[.16,.1],[.28,.4],[.28,.47],[.24,.47],[.22,.15],[0,.1]],C.gold,0,.41,0);
  for(const x of [-.29,.29])ring(x,.67,0,.17,.035,C.gold);box(0,.1,.21,.23,.08,.02,C.gold);break;
 }
 case 'tent':{
  for(let i=0;i<8;i++){const a=i*Math.PI/4,c=i%2?C.cream:C.red;mesh(new T.CylinderGeometry(.54,.54,.57,3,1,false,a,Math.PI/4),c,0,.285,0);mesh(new T.ConeGeometry(.65,.5,3,1,false,a,Math.PI/4),c,0,.82,0);}
  box(0,.25,.55,.26,.5,.035,C.dark);rod([0,1.07,0],[0,1.3,0],.02,C.gold);shape([[0,0],[.22,-.05],[0,-.12]],.035,C.red,0,1.3,0);break;
 }
 case 'rainbow':{
  const colors=[C.red,C.orange,C.gold,C.green,C.blue,0x6b6597,C.pink];for(let i=0;i<7;i++)ring(0,.12,0,.66-i*.067,.035,colors[i],[0,0,0],Math.PI);
  for(const x of [-.54,.54])for(let i=0;i<3;i++)ball(x+(i-1)*.1,.1+(i%2)*.06,0,.14,.1,.16,C.white);break;
 }
 case 'carousel':{
  cyl(0,.08,0,.62,.62,.16,C.blue);cyl(0,.18,0,.6,.6,.05,C.gold);cyl(0,.7,0,.055,.055,1.05,C.gold);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3,x=Math.cos(a)*.36,z=Math.sin(a)*.36;rod([x,.2,z],[x,1.05,z],.02,C.gold);horse(x,.22,z,.42);}
  cyl(0,1.14,0,0,.69,.35,C.red);ring(0,.99,0,.65,.035,C.gold,[Math.PI/2,0,0]);cyl(0,1.34,0,0,.07,.12,C.gold);break;
 }
 case 'ferris':{
  box(0,.04,0,1.12,.08,.66,C.darkWood);for(const z of [-.23,.23]){rod([-.43,.08,z],[0,.79,z],.035,C.metal);rod([.43,.08,z],[0,.79,z],.035,C.metal);ring(0,.8,z,.57,.025,C.blue);}
  rod([0,.8,-.29],[0,.8,.29],.05,C.gold);for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*.57,y=.8+Math.sin(a)*.57;rod([0,.8,-.23],[x,y,-.23],.012,C.gold);rod([0,.8,.23],[x,y,.23],.012,C.gold);box(x,y-.1,0,.18,.17,.28,i%2?C.red:C.gold);rod([x,y,-.14],[x,y,.14],.018,C.metal);}break;
 }
 case 'castle':{
  box(0,.05,0,1.1,.1,.85,C.stone);box(0,.4,0,.68,.7,.5,C.stone);box(0,.33,.26,.22,.43,.045,C.dark);
  for(const x of [-.4,.4])for(const z of [-.27,.27]){cyl(x,.48,z,.16,.17,.8,C.stone);cyl(x,1,z,0,.23,.3,C.blue);for(const y of [.46,.68])box(x,y,z+.17,.06,.1,.025,C.dark);}
  for(const x of [-.27,0,.27])box(x,.83,0,.14,.16,.52,C.stone);break;
 }
 case 'blossom':soil();tree(false);break;
 case 'maple':soil();tree(true);break;
 case 'hive':{
  for(const x of [-.23,.23])box(x,.15,0,.065,.3,.42,C.wood);box(0,.32,0,.62,.08,.5,C.wood);
  lathe([[0,0],[.3,0],[.34,.15],[.3,.38],[.22,.55],[.1,.66],[0,.68]],C.gold,0,.36,0);
  for(let i=0;i<6;i++)ring(0,.41+i*.1,0,.33-i*.035,.025,C.orange,[Math.PI/2,0,0]);cyl(0,.51,.3,.075,.075,.04,C.dark,[Math.PI/2,0,0]);box(0,.45,.34,.22,.04,.18,C.wood);break;
 }
 case 'birdhouse':{
  box(0,.4,0,.09,.8,.09,C.wood);box(0,.91,0,.45,.46,.4,C.cream);for(const sign of [-1,1])box(sign*.14,1.21,0,.4,.06,.52,C.red,[0,0,sign*-.58]);
  cyl(0,.97,.21,.085,.085,.03,C.dark,[Math.PI/2,0,0]);rod([0,.8,.2],[0,.8,.38],.025,C.wood);box(0,.025,0,.28,.05,.28,C.wood);break;
 }
 case 'parasol':{
  cyl(0,.045,0,.3,.33,.09,C.cream);rod([0,.08,0],[0,1.2,0],.025,C.wood);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;mesh(new T.ConeGeometry(.64,.28,3,1,false,a,Math.PI/4),i%2?C.cream:C.blue,0,1.12,0);rod([0,1.26,0],[Math.sin(a)*.63,.98,Math.cos(a)*.63],.012,C.cream);}break;
 }
 case 'melon':{
  for(const x of [-.34,.34])for(const z of [-.2,.2])box(x,.25,z,.06,.5,.06,C.wood);box(0,.54,0,.9,.08,.57,C.wood);
  for(const x of [-.25,.02,.27]){ball(x,.72,0,.15,.17,.13,C.green);for(const a of [-.05,.05])ring(x,.72,a,.15,.012,C.leaf,[0,Math.PI/2,0]);}
  shape([[-.23,0],[.23,0],[0,.27]],.12,C.red,-.06,.59,.16);rod([-.29,.6,.28],[.17,.6,.28],.025,C.leaf);break;
 }
 case 'pool':{
  cyl(0,.07,0,.53,.53,.14,C.blue);cyl(0,.15,0,.48,.48,.025,C.water);for(const y of [.08,.18])ring(0,y,0,.52,.06,C.cream,[Math.PI/2,0,0]);
  ball(.15,.23,.1,.12,.07,.08,C.gold);ball(.22,.32,.1,.065,.065,.06,C.gold);cyl(.3,.31,.1,0,.03,.09,C.orange,[0,0,Math.PI/2]);break;
 }
 case 'hay':{
  box(0,.28,0,.85,.52,.55,C.gold);for(const x of [-.27,.27]){box(x,.28,0,.025,.54,.58,C.cream);for(let i=0;i<5;i++)rod([x-.1,.1+i*.08,.283],[x+.1,.12+i*.08,.283],.008,C.orange);}break;
 }
 case 'cider':{
  box(0,.05,0,.95,.1,.7,C.wood);for(const x of [-.36,.36])box(x,.63,0,.09,1.16,.12,C.darkWood);box(0,1.2,0,.88,.1,.18,C.wood);
  cyl(0,.32,0,.28,.24,.44,C.wood);for(const y of [.17,.4,.51])ring(0,y,0,.27,.022,C.metal,[Math.PI/2,0,0]);cyl(0,.88,0,.035,.035,.57,C.metal);
  cyl(0,.67,0,.25,.25,.065,C.wood);rod([-.24,1.22,0],[.24,1.22,0],.023,C.metal);for(const x of [-.23,.05,.24])ball(x,.16,.27,.09,.09,.08,C.red);break;
 }
 case 'sled':{
  for(const x of [-.25,.25]){tube([[x,.1,-.5],[x,.06,.3],[x,.14,.5],[x,.3,.52]],.025,C.metal);for(const z of [-.3,.25])rod([x,.09,z],[x,.27,z],.025,C.red);}
  for(let i=0;i<5;i++)box((i-2)*.11,.29,0,.09,.055,.8,C.wood);rod([-.25,.26,.43],[.25,.26,.43],.025,C.red);break;
 }
 case 'skates':{
  for(const [x,z]of [[-.18,-.08],[.19,.11]]){box(x,.04,z,.13,.06,.5,C.metal);rod([x,.06,z-.15],[x,.19,z-.15],.025,C.metal);rod([x,.06,z+.15],[x,.19,z+.15],.025,C.metal);box(x,.19,z,.23,.045,.45,C.dark);ball(x,.3,z+.08,.12,.13,.22,C.white);box(x,.44,z-.1,.2,.36,.18,C.white);for(let i=0;i<4;i++)rod([x-.07,.42+i*.04,z+.005],[x+.07,.44+i*.04,z+.005],.009,C.dark);}break;
 }
 case 'igloo':{
  mesh(new T.SphereGeometry(.58,16,8,0,Math.PI*2,0,Math.PI/2),C.white,0,.02,0);
  for(let k=0;k<3;k++){const r=.54-k*.11,y=.15+k*.15;for(let i=0;i<10-k*2;i++){const a=i*Math.PI*2/(10-k*2)+k*.3;box(Math.cos(a)*r,y,Math.sin(a)*r,.18,.12,.08,C.cream,[0,-a+Math.PI/2,0]);}}
  const arch=[[-.21,0],[.21,0],[.21,.2]];for(let i=0;i<=10;i++){const a=i*Math.PI/10;arch.push([Math.cos(a)*.21,.2+Math.sin(a)*.21]);}
  shape(arch,.3,C.white,0,0,.35);const inner=shape(arch,.03,C.dark,0,.02,.66);inner.scale.set(.72,.75,1);break;
 }
 }
 // Ground complete geometry and fit the same circular placement footprint.
 body.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(body),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),v=new T.Vector3();let radius=0;
 body.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);radius=Math.max(radius,Math.hypot(v.x-center.x,v.z-center.z));}}});
 const k=Math.min(height/size.y,footprint/(2*radius));body.position.set(-center.x*k,-bounds.min.y*k,-center.z*k);body.scale.setScalar(k);body.updateMatrixWorld(true);
 const buckets=new Map(),source=new Set();body.traverse(o=>{if(o.isMesh){source.add(o.geometry);const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.deleteAttribute('uv');g.applyMatrix4(o.matrixWorld);if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);}});
 root.remove(body);for(const [material,geometries]of buckets){const geometry=mergeGeometries(geometries,false);if(!geometry)throw Error('decoration geometry merge failed: '+id);geometries.forEach(g=>g.dispose());const o=new T.Mesh(geometry,material);o.castShadow=true;o.receiveShadow=true;root.add(o);}source.forEach(g=>g.dispose());
 let disposed=false;root.userData.dispose=()=>{if(disposed)return;disposed=true;root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});materials.forEach(m=>m.dispose());};
 return root;
}

import {animalPenYardLayout} from './animal-pen-layout.js?v=1';
// Transient physical places only. Saved ownership/costs/production remain in game.js.
const station=(kind,slot,mode,dock,approach,facing,contact=null)=>({id:`${kind}-${mode}-${slot}`,kind:mode,slot,dock:[dock[0],0,dock[1]],approach:[approach[0],0,approach[1]],facing,contact,path:[[approach[0],0,approach[1]],[dock[0],0,dock[1]]]});
export function remainingCareLayouts({layouts=null}={}){
 const result={};
 for(const [kind,capacity,xs,polygon,z,depth,height]of [
  ['horse',4,[-20.8,-16.6,-12.4,-8.2],[[-23.5,-31.8],[-4.8,-31.8],[-4.8,-26.5],[-23.5,-19.8]],-28.7,4.6,3.2],
  ['sheep',5,[6.3,9.9,13.5,17.1,20.7],[[4,-31.3],[23,-31.3],[23,-21],[4,-21]],-28.2,3.6,2.35]
 ]){
  const stations=[],turnouts=[];
  for(let i=0;i<capacity;i++){
   const x=xs[i],approachZ=kind==='horse'&&i===3?-27.4:-25.8;
   turnouts.push([x,0,approachZ]);stations.push(station(kind,i,'bed',[x,z],[x,approachZ],0));
   for(const [mode,dx,y]of [['feed',-.85,kind==='horse'?.8:.52],['drink',.85,kind==='horse'?.72:.46]]){
    const dock=[x+dx,z],contact=[x+dx,y,z-(kind==='horse'?1.45:.8)];stations.push(station(kind,i,mode,dock,[x,approachZ],0,contact));
   }
  }
  const [x0,z0]=polygon[0],[x1]=polygon[1],z1=polygon[3][1];
  result[kind]={kind,capacity,polygon,footprint:[[x0,z0],[x1,z0],[x1,z1],[x0,z1]],stations,turnouts,gates:[{a:kind==='horse'?[-20.5,-20.875]:[11,-21],b:kind==='horse'?[-16.5,-22.309]:[15,-21],width:kind==='horse'?4.25:4}],shelter:{x:(x0+x1)/2,z:z-.45,width:x1-x0,depth,height},bedSize:kind==='horse'?[3.65,4.2]:[2.9,3],bedSurface:.10,margin:kind==='horse'?.8:.55,speed:kind==='horse'?1.2:.75};
 }
 for(const l of Object.values(result)){l.accesses=l.gates.map(g=>{const dx=g.b[0]-g.a[0],dz=g.b[1]-g.a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,points=[g.a,g.b,...[g.a,g.b].flatMap(p=>[-2.5,2.5].map(d=>[p[0]+nx*d,p[1]+nz*d]))];return[Math.min(...points.map(p=>p[0])),Math.max(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[1]))];});}
 result.dog={kind:'dog',capacity:1,polygon:null,footprint:[[.8,-13.4],[3.6,-13.4],[3.6,-9.8],[.8,-9.8]],stations:[station('dog',0,'bed',[1.8,-10.9],[2.8,-9.2],0),station('dog',0,'feed',[1.5,-12.1],[1.5,-10.1],0,[1.5,.20,-13]),station('dog',0,'drink',[3,-12.1],[2.8,-10.1],0,[3,.18,-13])],turnouts:[[2.8,0,-9.2]],bedSize:[1.65,1.3],bedSurface:.10,margin:.42,speed:1.5};
 result.cat={kind:'cat',capacity:1,polygon:null,footprint:[[-2.8,-10.6],[-.35,-10.6],[-.35,-7.65],[-2.8,-7.65]],stations:[station('cat',0,'bed',[-1.8,-8.5],[-2.8,-7.2],0),station('cat',0,'feed',[-2,-9.5],[-2.8,-8],0,[-2,.14,-10.2]),station('cat',0,'drink',[-.8,-9.5],[-1,-8],0,[-.8,.12,-10.2])],turnouts:[[-2.8,0,-7.2]],bedSize:[1.25,1.45],bedSurface:.10,margin:.32,speed:.9};
 if(layouts)for(const kind of Object.keys(result))if(layouts[kind])result[kind]=animalPenYardLayout(layouts[kind]);
 return result;
}
export function remainingCareConflicts(layout,{blocks=[],decor=[]}={}){
 const p=layout.footprint,[x0,z0]=p[0],[x1]=p[1],z1=p[2][1],areas=[[x0,x1,z0,z1],...(layout.accesses||[])],hit=(x,z,hw,hd)=>areas.some(([ax,bx,az,bz])=>x+hw>ax&&x-hw<bx&&z+hd>az&&z-hd<bz);
 return [...blocks.filter(b=>hit(...b)).map(b=>({type:'block',bounds:[...b]})),...decor.filter(d=>hit(d.x,d.z,d.r??.6,d.r??.6)).map(d=>({type:'decor',id:d.id,x:d.x,z:d.z}))];
}

// Transient physical places only. Saved ownership/costs/production remain in game.js.
const station=(kind,slot,mode,dock,approach,facing,contact=null)=>({id:`${kind}-${mode}-${slot}`,kind:mode,slot,dock:[dock[0],0,dock[1]],approach:[approach[0],0,approach[1]],facing,contact,path:[[approach[0],0,approach[1]],[dock[0],0,dock[1]]]});
export function remainingCareLayouts(){
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
 result.dog={kind:'dog',capacity:1,polygon:null,footprint:[[-4.1,6.25],[-1.45,6.25],[-1.45,8.4],[-4.1,8.4]],stations:[station('dog',0,'bed',[-2.3,7.2],[-2.0,8.1],Math.PI/2),station('dog',0,'feed',[-2.45,7.9],[-1.7,8.1],Math.PI/2,[-3.35,.20,7.9]),station('dog',0,'drink',[-2.15,6.8],[-1.7,7.8],Math.PI/2,[-3.05,.18,6.8])],turnouts:[[-1.7,0,8.5]],bedSize:[1.65,1.3],bedSurface:.10,margin:.42,speed:1.5};
 result.cat={kind:'cat',capacity:1,polygon:null,footprint:[[1.45,9.3],[3.3,9.3],[3.3,12.2],[1.45,12.2]],stations:[station('cat',0,'bed',[2.2,10.1],[1.5,10.2],0),station('cat',0,'feed',[1.8,10.9],[1.5,10.3],Math.PI,[1.8,.14,11.6]),station('cat',0,'drink',[2.8,10.9],[2.6,10.3],Math.PI,[2.8,.12,11.6])],turnouts:[[1.5,0,10.2]],bedSize:[1.25,1.45],bedSurface:.10,margin:.32,speed:.9};
 return result;
}
export function remainingCareConflicts(layout,{blocks=[],decor=[]}={}){
 const p=layout.footprint,[x0,z0]=p[0],[x1]=p[1],z1=p[2][1],hit=(x,z,hw,hd)=>x+hw>x0&&x-hw<x1&&z+hd>z0&&z-hd<z1;
 return [...blocks.filter(b=>hit(...b)).map(b=>({type:'block',bounds:[...b]})),...decor.filter(d=>hit(d.x,d.z,d.r??.6,d.r??.6)).map(d=>({type:'decor',id:d.id,x:d.x,z:d.z}))];
}

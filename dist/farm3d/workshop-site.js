// The visual ground is a 220 m plane with 160 segments. Interpolate its actual
// triangles, not the continuous hill formula between rendered vertices.
export const TERRAIN_SPAN=220,TERRAIN_SEGMENTS=160;
export function terrainMeshY(x,z,vertexY){
 const half=TERRAIN_SPAN/2,step=TERRAIN_SPAN/TERRAIN_SEGMENTS;
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>half||Math.abs(z)>half)return NaN;
 const fx=(x+half)/step,fz=(z+half)/step,i=Math.min(TERRAIN_SEGMENTS-1,Math.floor(fx)),j=Math.min(TERRAIN_SEGMENTS-1,Math.floor(fz)),u=fx-i,v=fz-j,x0=-half+i*step,z0=-half+j*step;
 const a=vertexY(x0,z0),b=vertexY(x0+step,z0),c=vertexY(x0,z0+step),d=vertexY(x0+step,z0+step);
 return u+v<=1?a*(1-u-v)+b*u+c*v:c*(1-u)+b*(1-v)+d*(u+v-1);
}

// A workshop keeps its original 3.8 x 3.4 m horizontal footprint and faces +z.
// Short visible stone piers may support at most .35 m. Its fixed .35 m floor
// has 3 m of front access for at most .50 m rise, a 1:6 ramp or gentler.
export function assessWorkshopSite(x,z,groundY,{landContains=()=>true,entranceClear=()=>true,maxPier=.35,maxRampRise=.50,floorOffset=.35}={}){
 const hw=1.9,hd=1.7,door=[x,z+hd],approach=[x,z+hd+3],base={x,z,hw,hd,door,approach};
 if(!landContains(x,z,hw,hd))return{...base,ok:false,code:'LAND'};
 let lo=Infinity,hi=-Infinity;
 for(let i=0;i<=8;i++)for(let j=0;j<=8;j++){
  const y=groundY(x-hw+2*hw*i/8,z-hd+2*hd*j/8);
  if(!Number.isFinite(y))return{...base,ok:false,code:'LAND'};
  lo=Math.min(lo,y);hi=Math.max(hi,y);
 }
 const result={...base,y:hi,minY:lo,maxY:hi};
 if(hi-lo>maxPier+1e-9)return{...result,ok:false,code:'SUPPORT'};
 const atDoor=groundY(...door),atApproach=groundY(...approach);
 const needsRamp=hi-lo>.025||Math.abs(hi)>.025;
 if(!Number.isFinite(atDoor)||!Number.isFinite(atApproach)||!entranceClear(door,approach,needsRamp))return{...result,ok:false,code:'ENTRANCE'};
 const floorY=hi+floorOffset,rise=floorY-atApproach;
 if(rise<-.02||rise>maxRampRise+1e-9||floorY<atDoor-.02)return{...result,ok:false,code:'ENTRANCE'};
 for(let i=0;i<=12;i++){const t=i/12,rampY=floorY+(atApproach-floorY)*t,soil=groundY(x,door[1]+3*t);if(!Number.isFinite(soil)||rampY<soil-.02)return{...result,ok:false,code:'ENTRANCE'};}
 return{...result,ok:true,code:'OK',doorY:atDoor,approachY:atApproach,floorY,floorOffset,needsRamp};
}

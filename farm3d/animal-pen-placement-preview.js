import * as T from './lib/three.module.min.js';
export function createPenPlacementPreview(scene,groundY){let current=null,disposed=false;
 function clear(){if(!current)return;current.removeFromParent();const g=new Set(),m=new Set();current.traverse(o=>{if(o.geometry)g.add(o.geometry);if(o.material)m.add(o.material);});g.forEach(v=>v.dispose());m.forEach(v=>v.dispose());current=null;}
 function update(model){if(disposed)return;clear();const group=new T.Group();group.name='Ground placement guide';group.userData.cells=model.cells;current=group;scene.add(group);
  for(const [index,cell]of model.cells.entries()){const [x,z]=cell.at,status=cell.status,color=status==='valid'?0x276245:status==='blocked'?0xa34832:0x665c45,positions=[],line=(a,b)=>positions.push(a[0],groundY(...a)+.105,a[1],b[0],groundY(...b)+.105,b[1]),p=(dx,dz)=>[x+dx,z+dz],corners=[p(-.43,-.43),p(.43,-.43),p(.43,.43),p(-.43,.43)];
   // Neutral dashed outline and centre dot mean unevaluated, never permission.
   for(let j=0;j<4;j++){const a=corners[j],b=corners[(j+1)%4];if(status==='unknown'){for(let k=0;k<4;k++)line(a.map((v,i)=>v+(b[i]-v)*k/4),a.map((v,i)=>v+(b[i]-v)*(k+.5)/4));}else line(a,b);}
   if(status==='valid'){line(p(-.23,0),p(-.06,.19));line(p(-.06,.19),p(.25,-.22));}
   else if(status==='blocked'){line(p(-.18,-.18),p(.18,.18));line(p(-.18,.18),p(.18,-.18));}
   else line(p(-.04,0),p(.04,0));
   const material=new T.LineBasicMaterial({color,depthWrite:false,depthTest:false,transparent:true,opacity:1}),geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(positions,3)),lines=new T.LineSegments(geometry,material);lines.renderOrder=1002;group.add(lines);
   const fill=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,1,2,0,2,3].flatMap(i=>[corners[i][0],groundY(...corners[i])+.08,corners[i][1]]),3)),mat=new T.MeshBasicMaterial({color:status==='unknown'?0xfff9e9:status==='valid'?0x95d6a1:0xe2a08a,side:T.DoubleSide,transparent:true,opacity:index===0?.67:.38,depthWrite:false});const tile=new T.Mesh(fill,mat);tile.renderOrder=1001;group.add(tile);
   if(index===0){const ring=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(corners.flatMap((a,i)=>{const b=corners[(i+1)%4];return[a[0],groundY(...a)+.11,a[1],b[0],groundY(...b)+.11,b[1]]}),3)),edge=new T.LineSegments(ring,new T.LineBasicMaterial({color:0xfff9e9,depthTest:false,depthWrite:false}));edge.renderOrder=1003;group.add(edge);}
  }
 }
 return{update,clear,dispose(){clear();disposed=true;}};
}

import * as T from './lib/three.module.min.js';
import {mergeGeometries} from './lib/addons/utils/BufferGeometryUtils.js';
import {remainingCareLayouts} from './remaining-care-layout.js?v=1';
export function createRemainingCareYards(){
 return Object.fromEntries(Object.values(remainingCareLayouts()).map(layout=>{
  const {kind}=layout,group=new T.Group();group.name=kind+'-physical-care';
  const colors={wood:kind==='horse'?0x99754e:0xc7bda4,roof:kind==='horse'?0x79524b:0x667e6e,straw:0xc8ad65,feed:0xb39a51,water:0x578f9a,fabric:kind==='dog'?0x6e8792:0xb98c79};
  const materials=Object.fromEntries(Object.entries(colors).map(([k,color])=>[k,new T.MeshStandardMaterial({color,roughness:k==='water'?.12:.88})])),parts=new Map(),beds=[],surfaces=[],obstacles=[],fences=[];
  function box(mat,w,h,d,x,y,z,ry=0,individual=false){const geometry=new T.BoxGeometry(w,h,d),m=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromAxisAngle(T.Object3D.DEFAULT_UP,ry),new T.Vector3(1,1,1));geometry.applyMatrix4(m);if(individual){const mesh=new T.Mesh(geometry,materials[mat]);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;}if(!parts.has(mat))parts.set(mat,[]);parts.get(mat).push(geometry);}
  const rail=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),yaw=Math.atan2(-dz,dx),n=Math.ceil(length/2.2);fences.push([...a,...b]);for(let i=0;i<=n;i++)box('wood',.10,1.35,.10,a[0]+dx*i/n,.50,a[1]+dz*i/n);for(const y of [.48,.92])box('wood',length,.10,.09,(a[0]+b[0])/2,y,(a[1]+b[1])/2,yaw);};
  if(layout.polygon){
   const p=layout.polygon,gate=layout.gates[0];
   for(let i=0;i<4;i++){if(i===2){rail(p[2],gate.b);rail(gate.a,p[3]);}else rail(p[i],p[(i+1)%4]);}
   const s=layout.shelter;box('roof',s.width+.3,.15,s.depth+.25,s.x,s.height,s.z);box('wood',s.width,1.75,.12,s.x,.875,s.z-s.depth/2);
   obstacles.push([s.x,s.z-s.depth/2,s.width/2,.06]);
   for(const x of [p[0][0]+.12,p[1][0]-.12])for(const z of [s.z-s.depth/2+.12,s.z+s.depth/2-.12]){box('wood',.13,s.height,.13,x,s.height/2,z);obstacles.push([x,z,.065,.065]);}
  }
  for(const station of layout.stations){
   const [x,,z]=station.dock;if(station.kind==='bed'){
    const [w,d]=layout.bedSize,mesh=box(layout.polygon?'straw':'fabric',w,layout.bedSurface,d,x,layout.bedSurface/2,z,0,true);mesh.name=station.id;mesh.userData.stationId=station.id;beds.push(mesh);
    if(!layout.polygon){box('wood',w+.12,.07,d+.12,x,.035,z);}
   }else{
    const [cx,y,cz]=station.contact,w=kind==='horse'?.68:kind==='sheep'?.5:.48,d=kind==='horse'?.52:kind==='sheep'?.38:.4;
    box('wood',w+.1,y-.035,d+.1,cx,(y-.035)/2,cz);box(station.kind==='feed'?'feed':'water',w,.02,d,cx,y-.01,cz);surfaces.push({station,contact:station.contact});obstacles.push([cx,cz,(w+.1)/2,(d+.1)/2]);
   }
  }
  for(const [mat,geos]of parts){const geometry=mergeGeometries(geos);geos.forEach(g=>g.dispose());const mesh=new T.Mesh(geometry,materials[mat]);mesh.castShadow=mesh.receiveShadow=true;mesh.name=kind+'-'+mat;group.add(mesh);}
  let disposed=false;return [kind,{layout,group,beds,surfaces,obstacles,fences,dispose(){if(disposed)return;disposed=true;group.removeFromParent();group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});Object.values(materials).forEach(m=>m.dispose());}}];
 }));
}
// Site ownership composes: toggling one site cannot restore another site's flowers.
export function createRemainingCarePlantClearing(meshes,layouts){
 const contains=(l,x,z)=>{const p=l.footprint;return x>=p[0][0]&&x<=p[1][0]&&z>=p[0][1]&&z<=p[2][1];},active=new Set();
 const parts=meshes.filter(m=>m?.isInstancedMesh).map(mesh=>{const original=mesh.instanceMatrix.array.slice(),entries=[];for(let i=0;i<mesh.count;i++){const o=i*16,x=original[o+12],z=original[o+14],sites=Object.keys(layouts).filter(k=>contains(layouts[k],x,z));if(sites.length)entries.push({o,sites});}return{mesh,original,entries};});
 return{setActive(kind,value){if(active.has(kind)===!!value)return;if(value)active.add(kind);else active.delete(kind);for(const{mesh,original,entries}of parts){const a=mesh.instanceMatrix.array;for(const{o,sites}of entries){a.set(original.subarray(o,o+16),o);if(sites.some(k=>active.has(k)))for(const j of [0,1,2,4,5,6,8,9,10])a[o+j]=0;}mesh.instanceMatrix.needsUpdate=true;}}};
}

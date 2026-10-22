import {createPenPlantClearing} from './animal-pen-scenery.js?v=1';
import {PEN_TEMPLATES} from './animal-pen-templates.js?v=1';
import {rememberPenPrimitive,markPenBatch,penComponentVolumes} from './animal-pen-model.js?v=1';
import * as T from './lib/three.module.min.js';
import {mergeGeometries} from './lib/addons/utils/BufferGeometryUtils.js';
import {remainingCareLayouts} from './remaining-care-layout.js?v=3';
export function createRemainingCareYards({layouts:resolvedLayouts=null}={}){
 return Object.fromEntries(Object.values(remainingCareLayouts({layouts:resolvedLayouts})).map(layout=>{
  const {kind}=layout,resolved=resolvedLayouts?.[kind]||null,group=new T.Group();group.name=kind+'-physical-care';
  const component=layout.polygon?'shelter':'nook',unit=new T.Group(),fenceGroup=new T.Group();unit.name=kind+'-care-assembly';fenceGroup.name=kind+'-pen-fence';group.add(unit,fenceGroup);let owner=component;
  const colors={wood:kind==='horse'?0x99754e:0xc7bda4,roof:kind==='horse'?0x79524b:0x667e6e,straw:0xc8ad65,feed:0xb39a51,water:0x578f9a,fabric:kind==='dog'?0x6e8792:0xb98c79};
  const materials=Object.fromEntries(Object.entries(colors).map(([k,color])=>[k,new T.MeshStandardMaterial({color,roughness:k==='water'?.12:.88})])),parts=new Map(),beds=[],surfaces=[],obstacles=[],fences=[];
  function box(mat,w,h,d,x,y,z,ry=0,individual=false){const geometry=new T.BoxGeometry(w,h,d),m=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromAxisAngle(T.Object3D.DEFAULT_UP,ry),new T.Vector3(1,1,1));geometry.applyMatrix4(m);if(individual){const mesh=new T.Mesh(geometry,materials[mat]);mesh.castShadow=mesh.receiveShadow=true;unit.add(mesh);return mesh;}rememberPenPrimitive(owner==='fence'?fenceGroup:unit,geometry);const key=resolved?owner+'|'+mat:mat;if(!parts.has(key))parts.set(key,[]);parts.get(key).push(geometry);}
  const rail=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),yaw=Math.atan2(-dz,dx),n=Math.ceil(length/2.2);fences.push([...a,...b]);for(let i=0;i<=n;i++)box('wood',.10,1.35,.10,a[0]+dx*i/n,.50,a[1]+dz*i/n);for(const y of [.48,.92])box('wood',length,.10,.09,(a[0]+b[0])/2,y,(a[1]+b[1])/2,yaw);};
  if(layout.polygon){
   const p=layout.polygon,gate=layout.gates[0];
   owner='fence';if(resolved)for(const f of layout.fenceSegments)rail(f.slice(0,2),f.slice(2));else for(let i=0;i<4;i++){if(i===2){rail(p[2],gate.b);rail(gate.a,p[3]);}else rail(p[i],p[(i+1)%4]);}owner=component;
   const s=layout.shelter;box('roof',s.width+.3,.15,s.depth+.25,s.x,s.height,s.z);box('wood',s.width,1.75,.12,s.x,.875,s.z-s.depth/2);
   obstacles.push([s.x,s.z-s.depth/2,s.width/2,.06]);
   const old=PEN_TEMPLATES[kind].baseline.polygon,delta=resolved?.components[component].delta||[0,0];
   for(const x of (resolved?[old[0][0]+.12+delta[0],old[1][0]-.12+delta[0]]:[p[0][0]+.12,p[1][0]-.12]))for(const z of [s.z-s.depth/2+.12,s.z+s.depth/2-.12]){box('wood',.13,s.height,.13,x,s.height/2,z);obstacles.push([x,z,.065,.065]);}
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
  for(const [key,geos]of parts){const [tag,mat]=resolved?key.split('|'):[null,key];const geometry=mergeGeometries(geos);geos.forEach(g=>g.dispose());const mesh=new T.Mesh(geometry,materials[mat]);mesh.castShadow=mesh.receiveShadow=true;mesh.name=kind+'-'+mat;(resolved?(tag==='fence'?fenceGroup:unit):group).add(markPenBatch(mesh));}
  let disposed=false;const componentGroups={[component]:[unit]};return [kind,{layout,group,beds,surfaces,obstacles,fences,components:componentGroups,componentVolumes:()=>penComponentVolumes(componentGroups),dispose(){if(disposed)return;disposed=true;group.removeFromParent();group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});Object.values(materials).forEach(m=>m.dispose());}}];
 }));
}
// Site ownership composes: toggling one site cannot restore another site's flowers.
export function createRemainingCarePlantClearing(meshes,layouts){
 return createPenPlantClearing(meshes,layouts);
}

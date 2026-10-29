import * as T from './lib/three.module.min.js';
// Draft outlines are separate from installed geometry, hit targets and collision.
// No yard factory or live material is reused, so Cancel owns every resource here.
export function createAnimalPenPreview(scene){
 let current=null,disposed=false;
 function release(group){if(!group)return;group.removeFromParent();const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [o.material].flat().filter(Boolean))materials.add(m);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}
 function clear(){release(current);current=null;}
 function update(layout,validation){
  if(disposed)throw Error('Animal pen preview disposed');
  const sites=Object.values(layout.sites).filter(site=>site.custom);if(!sites.length){clear();return;}
  const group=new T.Group();group.name='Animal pen draft';
  try{
   for(const site of sites){
    const color=validation?.ok===true?0x5de08b:validation?.ok===false?0xff6262:0xffd45c;
    const material=new T.LineBasicMaterial({color,transparent:true,opacity:.9,depthTest:false,depthWrite:false});
    // Attach an owned empty segment object first, so every later preparation
    // fault also has a discoverable owner for this material.
    function lines(name,positions){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));const object=new T.LineSegments(geometry,material);object.name=name;object.renderOrder=1000;object.frustumCulled=false;group.add(object);return object;}
    lines(site.kind+' fence preview',site.fenceSegments.flatMap(([ax,az,bx,bz])=>[ax,.12,az,bx,.12,bz]));
    lines(site.kind+' gate approaches',site.gates.flatMap(g=>[g.inside[0],g.inside[1]+.15,g.inside[2],g.outside[0],g.outside[1]+.15,g.outside[2]]));
    for(const [id,component]of Object.entries(site.components)){
     const low=.08,high=Math.max(.5,...component.volumes.map(v=>v[4])),positions=[];
     for(let i=0;i<component.footprint.length;i++){
      const a=component.footprint[i],b=component.footprint[(i+1)%component.footprint.length];
      positions.push(a[0],low,a[1],b[0],low,b[1],a[0],high,a[1],b[0],high,b[1],a[0],low,a[1],a[0],high,a[1]);
     }
     lines(site.kind+' '+id+' preview',positions);
    }
   }
  }catch(error){release(group);throw error;}
  scene.add(group);const previous=current;current=group;release(previous);
 }
 return{update,clear,dispose(){if(disposed)return;clear();disposed=true;}};
}

// Own the exact registry entries for a yard revision. Array identities and all
// unrelated farm entries survive replacement; fence counts/order may change.
const oriented=([ax,az,bx,bz],hd=.1)=>{const angle=Math.atan2(bz-az,bx-ax);return{x:(ax+bx)/2,z:(az+bz)/2,hw:Math.hypot(bx-ax,bz-az)/2,hd,c:Math.cos(angle),s:Math.sin(angle)};};
const rectangle=([x,z,hw,hd])=>({x,z,hw,hd,c:1,s:0});
function replaceOwned(array,old,next){const owned=new Set(old);let write=0;for(const value of array)if(!owned.has(value))array[write++]=value;array.length=write;array.push(...next);}
export function createAnimalPenSceneRegistry({scene,blocks,obstacles,fences,initial,onPublish}){
 let current=initial,generation=0;
 function prepare(layout,yards,active){
  const base=generation,previous=current,bindings={},nextBlocks=[],nextObstacles=[],nextFences=[];let serial=0,state='prepared',retired=false;
  for(const [kind,site]of Object.entries(layout.sites)){
   const yard=yards[kind];if(!yard?.group||yard.group.parent)throw Error('Yard must be prepared off scene: '+kind);
   const cowLegacy=kind==='cow'&&!site.custom;
   const bounds=[...site.obstacles.map(b=>[...b]),...(cowLegacy?site.fenceSegments.map(([ax,az,bx,bz])=>[(ax+bx)/2,(az+bz)/2,Math.abs(bx-ax)/2+.05,Math.abs(bz-az)/2+.05]):[])];
   const segments=cowLegacy?[]:site.fenceSegments.map(f=>[...f]);
   const bs=bounds.map(b=>active[kind]?[...b]:[10000+serial++,10000,b[2],b[3]]),fs=segments.map(f=>active[kind]?[...f]:[10000+serial++,10000,10001+serial,10000]);
   const blockObstacles=bs.map(rectangle),fenceObstacles=fs.map(f=>oriented(f,kind==='cow'?.05:.1)),os=[...blockObstacles,...fenceObstacles];
   bindings[kind]={bounds,segments,blocks:bs,fences:fs,obstacles:os,blockObstacles,fenceObstacles};nextBlocks.push(...bs);nextFences.push(...fs);nextObstacles.push(...os);
  }
  const publication={layout,yards,bindings,active:{...active}};
  return{
   publish(){
    if(state==='published')return;if(state!=='prepared')throw Error('Animal pen scene revision '+state);if(generation!==base)throw Error('Stale animal pen scene revision');state='publishing';
    // After this point a thrown callback needs persisted-save recovery, never a
    // rollback to stale registries or disposal of possibly installed resources.
    replaceOwned(blocks,previous.blocks,nextBlocks);replaceOwned(obstacles,previous.obstacles,nextObstacles);replaceOwned(fences,previous.fences,nextFences);
    for(const yard of Object.values(previous.yards))yard.group.removeFromParent();
    for(const [kind,yard]of Object.entries(yards)){yard.group.visible=!!active[kind];scene.add(yard.group);}
    current={yards,blocks:nextBlocks,obstacles:nextObstacles,fences:nextFences};generation++;
    onPublish(publication);state='published';
   },
   retire(){if(retired)return;if(state!=='published')throw Error('Cannot retire before complete scene publication');retired=true;for(const yard of Object.values(previous.yards))yard.dispose();},
   // Nothing is installed before publish; the new yards stay owned by the runtime helper.
   dispose(){if(state==='prepared')state='disposed';}
  };
 }
 return{prepare,ownsBlock:block=>current.blocks.includes(block),ownsObstacle:obstacle=>current.obstacles.includes(obstacle),ownsFence:fence=>current.fences.includes(fence)};
}

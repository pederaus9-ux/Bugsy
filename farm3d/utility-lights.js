// Farm utility decoration and a fixed-size pool of real, unshadowed lights.
// The mesh owns its resources; the pool owns only its four reusable PointLights.
import * as T from './lib/three.module.min.js';

export function createUtilityLamp(){
 const g=new T.Group();g.name='Farm utility light';g.userData.decorId='utilitylamp';
 const wood=new T.MeshStandardMaterial({color:0x785338,roughness:.95});
 const metal=new T.MeshStandardMaterial({color:0x7d9693,roughness:.58,metalness:.65,side:T.DoubleSide});
 const iron=new T.MeshStandardMaterial({color:0x41494a,roughness:.7,metalness:.55});
 const bulb=new T.MeshStandardMaterial({color:0xfff0d0,emissive:0xffd59a,emissiveIntensity:.08,roughness:.4});
 const owned=new Set([wood,metal,iron,bulb]);
 const add=(geometry,material,x,y,z=0)=>{const mesh=new T.Mesh(geometry,material);owned.add(geometry);mesh.position.set(x,y,z);mesh.castShadow=material!==bulb;mesh.receiveShadow=true;g.add(mesh);return mesh;};
 add(new T.CylinderGeometry(.075,.105,3.4,8),wood,-.25,1.7);
 add(new T.BoxGeometry(.24,.25,.24),iron,-.25,.125);
 add(new T.BoxGeometry(.18,.42,.16),iron,-.25,3.12);
 const arm=new T.CatmullRomCurve3([new T.Vector3(-.25,3.15,0),new T.Vector3(-.25,3.43,0),new T.Vector3(.12,3.53,0),new T.Vector3(.23,3.37,0)]);
 add(new T.TubeGeometry(arm,12,.035,6,false),metal,0,0);
 const profile=[[0,.25],[.06,.25],[.11,.22],[.17,.14],[.23,.06],[.25,.025],[.25,0],[.22,0],[.21,.05],[.15,.13],[.095,.20],[.04,.22],[0,.22]].map(([x,y])=>new T.Vector2(x,y));
 add(new T.LatheGeometry(profile,16),metal,.23,3.14);
 add(new T.SphereGeometry(.105,12,8),bulb,.23,3.145);
 const bolt=new T.CylinderGeometry(.027,.027,.185,6);for(const y of [3.02,3.22]){const b=add(bolt,metal,-.25,y,.025);b.rotation.x=Math.PI/2;}
 const anchor=new T.Object3D();anchor.position.set(.23,3.12,0);g.add(anchor);
 let night=false;const data=g.userData.utilityLamp={anchor,disposed:false,setNight(on){if(night===on)return;night=on;bulb.emissiveIntensity=on?4:.08;}};
 g.userData.dispose=()=>{if(data.disposed)return;data.disposed=true;for(const resource of owned)resource.dispose();};
 return g;
}

export function installUtilityLights(scene){
 const lights=Array.from({length:4},()=>{const l=new T.PointLight(0xffd59a,0,10,2);l.name='Placed utility illumination';l.castShadow=false;return l;});
 let sources=[],disposed=false;const candidates=[],world=new T.Vector3();
 return {lights,
  setLamps(objects){sources=objects.filter(o=>o.userData.utilityLamp&&!o.userData.utilityLamp.disposed).map(o=>({object:o,data:o.userData.utilityLamp,position:new T.Vector3(),distance:0}));for(const light of lights){light.intensity=0;if(sources.length)scene.add(light);else scene.remove(light);}},
  update(focus,night){
   if(disposed)return;candidates.length=0;
   for(const source of sources){if(source.data.disposed)continue;source.data.setNight(!!night);if(!night||!source.object.visible)continue;
    source.data.anchor.getWorldPosition(world);source.position.copy(world);source.distance=(world.x-focus.x)**2+(world.z-focus.z)**2;candidates.push(source);
   }
   candidates.sort((a,b)=>a.distance-b.distance);
   for(let i=0;i<lights.length;i++){const source=candidates[i],light=lights[i];light.intensity=source?38:0;if(source)light.position.copy(source.position);}
  },
  dispose(){if(disposed)return;disposed=true;for(const light of lights){scene.remove(light);light.dispose();}sources=[];candidates.length=0;}
 };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,writeSync} from 'node:fs';
import * as THREE from '../lib/three.module.min.js';
import {createCow3D,updateCow3D} from '../cow3d.js';
import {createLiveAnimal,updateLiveAnimal} from '../live3d.js';
const kinds=['cow','sheep','horse','dog','cat','chicken'];
// Temporary synchronous diagnostics: visible even when GitHub terminates a test worker.
const rayProbe=(kind,stage)=>{const m=process.memoryUsage();writeSync(2,`[RAY-DIAG] ${kind} ${stage} rss=${Math.round(m.rss/1048576)}MiB heap=${Math.round(m.heapUsed/1048576)}MiB external=${Math.round(m.external/1048576)}MiB\n`);};
const height={cow:1.7,sheep:1.2,horse:2.3,dog:1.15,cat:.85,chicken:.72};
const create=kind=>kind==='cow'?createCow3D(height[kind]):createLiveAnimal(kind,height[kind],0,0);
function update(kind,r,dz,dt,run=false){
  if(kind==='cow')updateCow3D(r,0,dz,dt,r.state.time,'moving');
  else updateLiveAnimal(r,0,dz,dt,'moving',run);
}
test('all six have an exposed connected neck and a pickable head, not just head bones',()=>{
  for(const kind of kinds){
    rayProbe(kind,'before-create');
    const r=create(kind);r.g.updateMatrixWorld(true);
    rayProbe(kind,`created vertices=${r.card.geometry.attributes.position.count}`);
    const target=r.neck.getWorldPosition(new THREE.Vector3());
    const local=kind==='cow'?[0,.03,-.06]:kind==='sheep'?[0,.08,-.04]:kind==='chicken'?[0,-.015,0]:[0,(-r.spec.neck[1]*.8+r.spec.head[1])/2,(-r.spec.neck[2]*.22+r.spec.head[2])/2];
    target.add(new THREE.Vector3(...local).multiplyScalar(r.model.scale.x));
    const ray=new THREE.Raycaster(target.clone().add(new THREE.Vector3(3,0,0)),new THREE.Vector3(-1,0,0));
    rayProbe(kind,'before-neck-raycast');
    const hits=ray.intersectObject(r.card);
    rayProbe(kind,`after-neck-raycast hits=${hits.length}`);
    assert.ok(hits.length,kind+' visible neck geometry');
    const skin=r.card.geometry.attributes.skinIndex;
    const bone=r.card.skeleton.bones[skin.getX(hits[0].face.a)];
    // Preserve identity assertion; avoid recursively formatting the entire skinned scene graph on failure.
    assert.ok(bone===r.neck,`${kind} neck is first visible surface at its bridge: got ${bone?.name??'<none>'}, expected ${r.neck.name}`);
    const head=r.head.getWorldPosition(new THREE.Vector3());
    ray.set(head.clone().add(new THREE.Vector3(0,0,-3)),new THREE.Vector3(0,0,1));
    rayProbe(kind,'before-head-raycast');
    const face=ray.intersectObject(r.card)[0];
    rayProbe(kind,'after-head-raycast');
    assert.ok(face,kind+' head is pickable from front');
    const hitBone=r.card.skeleton.bones[skin.getX(face.face.a)];
    assert.match(hitBone.name,/head|jaw|eye|ear/,kind+' front ray reaches face instead of torso');
    r.dispose();
    rayProbe(kind,'disposed');
  }
});
test('six species keep flat feet above ground and planted feet steady at 30/60Hz',()=>{
  const contact=[];
  for(const kind of kinds)for(const hz of [30,60])for(const run of [false,true]){
    const r=create(kind),dt=1/hz,speed=height[kind]*(run?1.4:.65),previous=new Map();let samples=0,worst=0,minSole=Infinity,maxPlantedSole=-Infinity;
    for(let n=0;n<hz*3;n++){
      const dz=-speed*dt;r.g.position.z+=dz;update(kind,r,dz,dt,run);r.g.updateMatrixWorld(true);
      for(const l of r.legs){
        const foot=l.foot.getWorldPosition(new THREE.Vector3());
        const up=new THREE.Vector3(0,1,0).applyQuaternion(l.foot.getWorldQuaternion(new THREE.Quaternion()));
        assert.ok(up.y>.99999,kind+' flat foot');
        const prior=previous.get(l);
        if(n>hz&&l.planted&&prior?.planted&&prior.ax===l.ax&&prior.az===l.az){worst=Math.max(worst,foot.distanceTo(prior.foot));samples++;}
        previous.set(l,{foot,planted:l.planted,ax:l.ax,az:l.az});
      }
      // Check the actual skinned sole vertices, not just ankle heights.
      if(n%5===0){
        const geom=r.card.geometry,feet=new Set(r.legs.map(l=>r.card.skeleton.bones.indexOf(l.foot)));
        let sole=Infinity;
        for(let v=0;v<geom.attributes.position.count;v++)if(feet.has(geom.attributes.skinIndex.getX(v))){
          const p=r.card.getVertexPosition(v,new THREE.Vector3()).applyMatrix4(r.card.matrixWorld);sole=Math.min(sole,p.y);
        }
        // Two millimetres is the contact tolerance; a running gait can have a flight phase.
        minSole=Math.min(minSole,sole);
        assert.ok(sole>=-.002,`${kind} rendered sole contact ${sole}; hz=${hz}; mode=${run?'run':'walk'}; frame=${n}; phase=${r.state.phase}; torsoPitch=${r.body.rotation.x}`);
        if(r.legs.some(l=>l.planted)){maxPlantedSole=Math.max(maxPlantedSole,sole);assert.ok(sole<.002,kind+' planted rendered sole touches ground '+sole);}
      }
    }
    assert.ok(samples>hz,kind+' planted samples');assert.ok(worst<.002,kind+' planted slip '+worst);
    contact.push({kind,hz,mode:run?'run':'walk',samples,worstSlipM:worst,minSoleM:minSole,maxPlantedSoleM:maxPlantedSole});
    r.dispose();
  }
  mkdirSync(new URL('./artifacts/',import.meta.url),{recursive:true});
  writeFileSync(new URL('./artifacts/animal-visual-contact.json',import.meta.url),JSON.stringify(contact,null,2));
});
test('new rigs preserve distance cadence, turn with travel, and release teleported feet',()=>{
  for(const kind of kinds.filter(k=>k!=='cow')){
    const phases=[];
    for(const hz of [30,60,120]){
      const r=create(kind);for(let i=0;i<hz;i++){r.g.position.z-=height[kind]/hz;update(kind,r,-height[kind]/hz,1/hz);}
      phases.push(r.state.phase);
      for(let i=0;i<hz;i++)updateLiveAnimal(r,height[kind]/hz,0,1/hz,'moving',false);
      assert.ok(Math.abs(r.model.rotation.y+Math.PI/2)<.01,kind+' faces rightward travel');
      const phase=r.state.phase;updateLiveAnimal(r,10,0,1/hz,'moving',false);
      assert.equal(r.state.phase,phase,kind+' teleport is not a stride');
      assert.ok(r.legs.every(l=>!l.planted),kind+' teleport releases planted feet');r.dispose();
    }
    assert.ok(Math.max(...phases)-Math.min(...phases)<1e-9,kind+' equal distance cadence');
  }
});
test('actual shin geometry reaches the feet with no floating sole pieces',()=>{
  for(const kind of kinds){
    const r=create(kind);r.g.updateMatrixWorld(true);
    for(const l of r.legs){
      const knee=l.knee.getWorldPosition(new THREE.Vector3()),foot=l.foot.getWorldPosition(new THREE.Vector3());
      for(const t of [.88,.93,.97,1]){
        const target=knee.clone().lerp(foot,t),ray=new THREE.Raycaster(target.clone().add(new THREE.Vector3(3,0,0)),new THREE.Vector3(-1,0,0));
        const hit=ray.intersectObject(r.card)[0];assert.ok(hit,kind+' connected shin/foot at '+t);
        const bone=r.card.skeleton.bones[r.card.geometry.attributes.skinIndex.getX(hit.face.a)];
        assert.match(bone.name,/knee|hoof|foot/,kind+' shin-to-foot surface at '+t);
      }
    }
    r.dispose();
  }
});

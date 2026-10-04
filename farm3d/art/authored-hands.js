import * as THREE from '../lib/three.module.min.js';
import {GLTFLoader} from '../lib/addons/loaders/GLTFLoader.js';

const names=['idle','harvest','plant','water','pet','feed'];
const asset=new URL('../assets/hands/hands-candidate.glb?v=2',import.meta.url);

function release(scene) {
  const geometries=new Set(),materials=new Set(),skeletons=new Set();
  scene.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);
    if(!o.userData.borrowedWardrobeMaterial)materials.add(o.material);
    if(o.isSkinnedMesh)skeletons.add(o.skeleton);}});
  geometries.forEach(o=>o.dispose());materials.forEach(o=>o.dispose());
  skeletons.forEach(o=>o.dispose());scene.removeFromParent();
}

// The adapter owns the complete exported scene and borrows the existing
// wardrobe materials. The legacy hands remain available during load/failure.
export function installAuthoredHands(camera, fallback, {load=()=>new GLTFLoader().loadAsync(asset.href)}={}) {
  let scene=null,clips=null,arms=null,disposed=false;
  const state={status:'loading',error:null};
  const controller={state,
    update({visible,kind,phase=0,time=0,sway=0,bob=0,reducedMotion=false}) {
      if(!scene||disposed)return false;
      scene.visible=visible;
      if(!visible)return true;
      const name=names.includes(kind)?kind:'idle';
      const clip=clips[name],duration=clip.duration;
      const sampleTime=name==='idle'?(reducedMotion?0:time%duration):THREE.MathUtils.clamp(phase,0,1)*duration;
      // Evaluate the exported channels absolutely on every frame. A paused
      // LoopOnce mixer can retain its last pose; cached constant translations
      // also must not accumulate the camera bob added below.
      for(const {target,interpolant} of clip.channels)target.fromArray(interpolant.evaluate(sampleTime));
      // Bone translations move the actual weighted sleeve and skin together.
      for(const [side,arm] of arms){arm.position.x+=side*sway;arm.position.y+=bob;
        if(!reducedMotion)arm.position.y+=Math.sin(time*1.6+side)*.004;}
      return true;
    },
    dispose(){if(disposed)return;disposed=true;state.status='disposed';
      if(scene){release(scene);scene=null;clips=null;}}
  };
  controller.ready=Promise.resolve().then(load).then(gltf=>{
    if(disposed){release(gltf.scene);return false;}
    try{
      for(const name of names)if(!gltf.animations.some(a=>a.name===name))throw Error('Missing hand clip: '+name);
      const nextArms=[[-1,gltf.scene.getObjectByName('L_arm')],[1,gltf.scene.getObjectByName('R_arm')]];
      if(nextArms.some(([,o])=>!o?.isBone))throw Error('Missing weighted hand arm');
      const originalMaterials=new Set();
      gltf.scene.traverse(o=>{if(!o.isMesh)return;
        originalMaterials.add(o.material);
        o.material=o.material.name==='WardrobeSkin'?fallback.userData.skin:fallback.userData.sleeve;
        o.userData.borrowedWardrobeMaterial=true;o.castShadow=false;o.renderOrder=10;
        // Deformed fingers must not inherit a static bind-pose culling box.
        o.frustumCulled=false;});
      originalMaterials.forEach(o=>o.dispose());
      scene=gltf.scene;arms=nextArms;scene.name='Authored first-person hands';scene.visible=false;
      scene.userData.authoredHands=controller;
      clips=Object.fromEntries(names.map(name=>{
        const clip=gltf.animations.find(a=>a.name===name);
        const channels=clip.tracks.map(track=>{const binding=THREE.PropertyBinding.parseTrackName(track.name);
          const bone=scene.getObjectByName(binding.nodeName);
          if(!bone?.isBone||!['position','quaternion'].includes(binding.propertyName))throw Error('Invalid hand channel');
          return {target:bone[binding.propertyName],interpolant:track.createInterpolant()};});
        return [name,{duration:clip.duration,channels}];}));
      camera.add(scene);state.status='ready';return true;
    }catch(error){release(gltf.scene);scene=null;clips=null;arms=null;throw error;}
  }).catch(error=>{if(!disposed){state.status='fallback';state.error=String(error.message||error);}return false;});
  return controller;
}

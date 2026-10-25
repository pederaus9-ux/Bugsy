// Test-only, detached shadow. Never publish this graph to a renderer or scene.
import * as T from '../../lib/three.module.min.js';
import {updateCow3D} from '../../cow3d.js';
import {applyCowPenSupport} from '../../animal-pen-cow-support.js';
import {getAnimalCarePose} from '../../animal-care-poses.js';

function copyValue(v, nodes) {
  if (v === null || typeof v !== 'object') return v;
  if (v.isObject3D) {
    if (!nodes.has(v)) throw Error('External object reference in cow shadow');
    return nodes.get(v);
  }
  if (ArrayBuffer.isView(v)) return v.slice();
  if (Array.isArray(v)) return v.map(x => copyValue(x, nodes));
  if (v.isVector2 || v.isVector3 || v.isVector4 || v.isQuaternion || v.isEuler || v.isMatrix3 || v.isMatrix4 || v.isBox3 || v.isSphere || v.isColor) return v.clone();
  if (v instanceof T.Layers) { const l = new T.Layers(); l.mask = v.mask; return l; }
  if (Object.getPrototypeOf(v) !== Object.prototype) throw Error('Unsupported cow shadow value');
  return Object.fromEntries(Object.entries(v).map(([k,x]) => [k,copyValue(x,nodes)]));
}

export function copyCowRig(r) {
  if (!r?.g || r.disposed || !r.card?.isSkinnedMesh) throw Error('Unavailable cow rig');
  const sources = [], nodes = new Map();
  r.g.traverse(n => sources.push(n));
  for (let p = r.g.parent; p; p = p.parent) sources.push(p);
  // Constructors/clone() of Object3D and Skeleton consume random UUIDs. Bare
  // prototype instances retain diagnostic IDs but are never registered live.
  for (const n of sources) nodes.set(n,Object.create(Object.getPrototypeOf(n)));
  for (const n of sources) {
    const out = nodes.get(n);
    for (const key of Reflect.ownKeys(n)) {
      if (key === 'skeleton' || key === '_listeners') continue;
      const d = Object.getOwnPropertyDescriptor(n,key);
      if (!('value' in d)) throw Error('Unsupported node accessor');
      let value;
      if (key === 'geometry' || key === 'material' || key === 'customDepthMaterial' || key === 'customDistanceMaterial') value = d.value;
      else if (key === 'children') value = d.value.filter(c => nodes.has(c)).map(c => nodes.get(c));
      else value = copyValue(d.value,nodes);
      Object.defineProperty(out,key,{...d,value});
    }
    out.rotation._onChange(() => out.quaternion.setFromEuler(out.rotation,false));
    out.quaternion._onChange(() => out.rotation.setFromQuaternion(out.quaternion,undefined,false));
  }
  const skeleton = Object.create(Object.getPrototypeOf(r.card.skeleton));
  for (const [key,value] of Object.entries(r.card.skeleton)) skeleton[key] = key === 'boneTexture' ? null : copyValue(value,nodes);
  nodes.get(r.card).skeleton = skeleton;
  const out = {};
  for (const [key,value] of Object.entries(r)) if (key !== 'dispose') out[key] = copyValue(value,nodes);
  out.dispose = () => { out.disposed = true; }; // no shared GPU/geometry disposal
  return out;
}

export function captureCowPreviewBase(r, {overlayState} = {}) {
  if (overlayState !== 'reset') throw Error('Explicit pre-overlay/reset base required; hidden care closure cannot be recovered');
  return {kind:'cow-pre-overlay-base', rig:copyCowRig(r)};
}

export function previewCowFrame(base, request) {
  if (base?.kind !== 'cow-pre-overlay-base') throw Error('Missing cow preview provenance');
  const {dx=0,dy=0,dz=0,dt,time=0,act='idle',hop=0,alignYaw,support,care} = request;
  if (![dx,dy,dz,dt,time,hop].every(Number.isFinite) || !(dt>0)) throw Error('Invalid cow preview motion');
  if (alignYaw !== undefined && !Number.isFinite(alignYaw)) throw Error('Invalid heading');
  if (support && (support.kind !== 'plane' || !Number.isFinite(support.height))) throw Error('Unsupported support domain');
  if (care && (!['lie','feed','drink'].includes(care.mode) || !Number.isFinite(care.weight) || care.weight<0 || care.weight>1 || (care.mode!=='lie' && (!Array.isArray(care.target) || care.target.length!==3 || !care.target.every(Number.isFinite))))) throw Error('Invalid care overlay');
  const r = copyCowRig(base.rig);
  r.g.position.x += dx; r.g.position.y += dy; r.g.position.z += dz;
  if (alignYaw !== undefined) r.model.rotation.y = alignYaw;
  updateCow3D(r,dx,dz,dt,time,act,hop);
  if (support) applyCowPenSupport(r,() => support.height);
  const overlay = getAnimalCarePose('cow',r);
  if (care) overlay.apply({...care,target:care.target&&new T.Vector3(...care.target)});
  r.g.updateMatrixWorld(true);
  r.card.skeleton.update();
  const displayed = copyCowRig(r);
  // Execute the real reset on the shadow. Its quaternion.copy invokes Euler
  // synchronization (including signed zeros), and its cached world matrices
  // remain those of the displayed pose. A pre-apply copy missed these effects.
  overlay.reset();
  const nextBase = captureCowPreviewBase(r,{overlayState:'reset'});
  r.dispose();
  return {rig:displayed,nextBase};
}
export const previewCowPose = (base,request) => previewCowFrame(base,request).rig;

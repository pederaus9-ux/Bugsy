// Single bounded replay to discriminate the recovery-timer hypothesis. All
// modified states are detached disposable controls, never a runtime candidate.
import fs from 'node:fs';import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';import {createCow3D,updateCow3D} from '../cow3d.js';import {copyCowRig,captureCowPreviewBase,previewCowFrame} from './helpers/cow-pose-preview.mjs';
const dir=new URL('./evidence/pen-editing-implementation/task8-codex-cow-continuous-feasibility-20261025/',import.meta.url),raw=JSON.parse(fs.readFileSync(new URL('actual-transition-probes.json',dir))),file=new URL('causal-controls.json',dir);if(fs.existsSync(file))throw Error('Preserve evidence');
const r=createCow3D(1.7,0,0,0);let before;
for(let i=0;i<=raw.recoveryFrame;i++){before=r.legs.map(l=>({rt:l.rt,planted:l.planted}));const dx=i>=60?.8/30:0,dz=i>=60?0:-.8/30;r.g.position.x+=dx;r.g.position.z+=dz;updateCow3D(r,dx,dz,1/30,r.state.time+1/30,'moving');}
r.g.updateMatrixWorld(true);const witness=raw.cases.find(c=>c.name==='real_turn_recovery').rows.at(-1).index,base=captureCowPreviewBase(r,{overlayState:'reset'}),corrected=captureCowPreviewBase(r,{overlayState:'reset'}),renderedRt=[];
for(let i=0;i<4;i++){const l=corrected.rig.legs[i],value=l.planted?l.rt:before[i].planted?0:before[i].rt;renderedRt.push({leg:i,before:before[i],storedRt:l.rt,renderedRt:value});if(!l.planted)l.rt=value;}
const point=(rig,index)=>{rig.g.updateMatrixWorld(true);return rig.card.getVertexPosition(index,new T.Vector3()).applyMatrix4(rig.card.matrixWorld);};
const dt=1e-9,request={dx:.8*dt,dt,act:'moving'},a=previewCowFrame(base,request),b=previewCowFrame(corrected,request),p=point(r,witness),recovery={vertex:witness,originalDelta:point(a.rig,witness).distanceTo(p),timerControlDelta:point(b.rig,witness).distanceTo(p),renderedRt};
assert(recovery.originalDelta>1e-3&&recovery.timerControlDelta<1e-8,'timer control must isolate the retained zero-time recovery gap');
const noLie=previewCowFrame(base,{dt,act:'sleeping'}),lie=previewCowFrame(base,{dt,act:'sleeping',care:{mode:'lie',weight:dt/1.1}}),legWitness=raw.cases.find(c=>c.name==='first_positive_lie_weight_after_motion').rows.at(-1).index;
const onset={vertex:legWitness,weight:dt/1.1,sameSleepingModeDelta:point(lie.rig,legWitness).distanceTo(point(noLie.rig,legWitness))};assert(onset.sameSleepingModeDelta>.1,'care branch, not quiet-mode alone, must explain leg replacement');
const output={source:raw.source,status:'CAUSAL_DIAGNOSTIC_ONLY',recovery,onset,limitations:'Restoring the evaluated timer is a disposable causal control, not an approved rig correction. The first-positive lie fixture does not establish a live-controller arrival in that state. Existing accepted frame-rate tests and tolerances unchanged.'};fs.writeFileSync(file,JSON.stringify(output,null,2));console.log(JSON.stringify(output));
for(const x of[r,base.rig,corrected.rig,a.rig,a.nextBase.rig,b.rig,b.nextBase.rig,noLie.rig,noLie.nextBase.rig,lie.rig,lie.nextBase.rig])x.dispose();

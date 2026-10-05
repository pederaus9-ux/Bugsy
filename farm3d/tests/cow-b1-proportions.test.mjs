import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const specPath=resolve(here,'../evidence/cow-reconstruction/b1/cow-b1-targets.json');
const spec=JSON.parse(readFileSync(specPath,'utf8'));
const eps=1e-9;

function inside(v,range){return v>=range[0]-eps&&v<=range[1]+eps;}

test('B1 target envelope stays inside frozen B0 actor envelope',()=>{
  for(const axis of ['x','y','z']){
    const b=spec.baseline.actorEnvelope[axis],t=spec.targetEnvelope[axis];
    assert.ok(t[0]>=b[0]-eps,`${axis} min escaped B0`);
    assert.ok(t[1]<=b[1]+eps,`${axis} max escaped B0`);
  }
});

test('every B1 landmark stays inside both target and B0 envelope',()=>{
  for(const [name,p] of Object.entries(spec.landmarks)){
    for(const [i,axis] of ['x','y','z'].entries()){
      assert.ok(inside(p[i],spec.targetEnvelope[axis]),`${name} ${axis} escaped target envelope`);
      assert.ok(inside(p[i],spec.baseline.actorEnvelope[axis]),`${name} ${axis} escaped B0 envelope`);
    }
  }
});

test('official Holstein anchor dimensions are represented exactly',()=>{
  const a=spec.biologicalAnchors,d=spec.targetDimensions,l=spec.landmarks;
  assert.equal(a.idealHipHeight,1.524);
  assert.ok(Math.abs(d.hookHeight-a.idealHipHeight)<eps);
  assert.ok(Math.abs((l.hookL[1]-l.pinL[1])-a.rumpDropHooksToPins)<eps);
  assert.ok(Math.abs((l.pinR[0]-l.pinL[0])-a.pinBoneSpacing)<eps);
  assert.equal(a.footAngleDegrees,45);
  assert.ok(Math.abs(a.udderFloorAboveHock-(l.udderFloor[1]-l.hindHockL[1]))<1e-4);
});

test('proposed static silhouette preserves explicit safety margins',()=>{
  const b=spec.baseline.actorEnvelope,t=spec.targetEnvelope,m=spec.envelopeSafetyMargins;
  assert.ok(Math.abs((t.x[0]-b.x[0])-m.xEachSide)<1e-4);
  assert.ok(Math.abs((b.x[1]-t.x[1])-m.xEachSide)<1e-4);
  assert.ok(Math.abs((t.y[0]-b.y[0])-m.yBelow)<1e-4);
  assert.ok(Math.abs((b.y[1]-t.y[1])-m.yAbove)<1e-4);
  assert.ok(Math.abs((t.z[0]-b.z[0])-m.zFront)<1e-4);
  assert.ok(Math.abs((b.z[1]-t.z[1])-m.zRear)<1e-4);
});

test('major target measurements remain anatomically coherent',()=>{
  const d=spec.targetDimensions;
  assert.ok(d.bodyDepthAtHeart/d.hookHeight>0.50&&d.bodyDepthAtHeart/d.hookHeight<0.60);
  assert.ok(d.bodyLengthWithersToPins/d.hookHeight>0.90&&d.bodyLengthWithersToPins/d.hookHeight<1.05);
  assert.ok(d.barrelOuterWidth/d.hookHeight>0.40&&d.barrelOuterWidth/d.hookHeight<0.50);
  assert.ok(d.headLengthPollToMuzzle/d.hookHeight>0.25&&d.headLengthPollToMuzzle/d.hookHeight<0.32);
  assert.ok(d.hookOuterWidth>d.muzzleWidth);
});

test('controlled front side rear targets are committed',()=>{
  for(const file of ['holstein-front-target.svg','holstein-side-target.svg','holstein-rear-target.svg']){
    const path=resolve(here,'../evidence/cow-reconstruction/b1',file);
    assert.ok(existsSync(path),`${file} missing`);
    const svg=readFileSync(path,'utf8');
    assert.match(svg,/B1/);
    assert.match(svg,/<svg/);
  }
});

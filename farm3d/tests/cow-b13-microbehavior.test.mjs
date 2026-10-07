import fs from 'node:fs';
import assert from 'node:assert/strict';

const src=fs.readFileSync(new URL('../cow3d.js',import.meta.url),'utf8');

function must(pattern,label){assert.match(src,pattern,label);}

// B13 is intentionally deterministic: no Math.random and no new geometry/material allocation in update.
must(/attention:0/,'B13 attention state missing');
must(/chewPhase:seed%TAU/,'seeded chew phase missing');
must(/s\.attention=mix\(s\.attention,alertTarget,ease\(dt,feeding\?2\.2:3\.2\)\)/,'attention smoothing missing');
must(/s\.chewAmount=mix\(s\.chewAmount,feeding\?1:0,ease\(dt,feeding\?4\.5:3\)\)/,'chew fade missing');
must(/s\.chewPhase=\(s\.chewPhase\+dt\*\(3\.1\+\.35\*Math\.sin\(s\.seed\*1\.7\)\)\)%TAU/,'deterministic chew clock missing');
must(/r\.jaw\.rotation\.y=\.018\*grind\*s\.chewAmount/,'lateral rumination missing');
must(/s\.tailAlert=mix\(s\.tailAlert,clamp\(s\.attention\*\(1-active\*\.65\),0,1\),ease\(dt,2\.6\)\)/,'attention/tail coordination missing');

const update=src.slice(src.indexOf('export function updateCow3D'));
assert.ok(!/Math\.random\s*\(/.test(update),'updateCow3D must remain deterministic');
assert.ok(!/new THREE\.(?:BufferGeometry|MeshStandardMaterial|SphereGeometry)\s*\(/.test(update),'updateCow3D must not allocate geometry/materials');

console.log('cow-b13-microbehavior: PASS');

import fs from 'node:fs';
import assert from 'node:assert/strict';

const src=fs.readFileSync(new URL('../cow3d.js',import.meta.url),'utf8');

assert.match(src,/chewDrive:0/,'B14 chew drive state missing');
assert.match(src,/earFocus:0/,'B14 ear focus state missing');
assert.match(src,/const chewDrive=feeding\?clamp\(/,'deterministic rumination drive missing');
assert.match(src,/Math\.sin\(s\.time\*\.43\+s\.seed\*2\.3\)/,'slow seeded chew variation missing');
assert.match(src,/s\.chewDrive=mix\(s\.chewDrive,chewDrive,ease\(dt,1\.8\)\)/,'chew drive smoothing missing');
assert.match(src,/s\.earFocus=mix\(s\.earFocus,s\.attention\*quiet,ease\(dt,4\)\)/,'attention/ear coordination missing');
assert.match(src,/focus=side\*s\.look\*\(\.18\+\.12\*s\.earFocus\)/,'ear/head focus coupling missing');

const update=src.slice(src.indexOf('export function updateCow3D'));
assert.ok(!/Math\.random\s*\(/.test(update),'runtime randomness is forbidden');
assert.ok(!/new THREE\.(?:BufferGeometry|MeshStandardMaterial|SphereGeometry)\s*\(/.test(update),'per-frame geometry/material allocation detected');

console.log('cow-b14-microbehavior-refinement: PASS');

import test from 'node:test';
import assert from 'node:assert/strict';
import * as land from '../farm-land.js';
import {penEditableLand,penEditableLandContains} from '../animal-pen-validation.js';

test('new level ground opens for a whole workshop without altering old farm limits',()=>{
 assert.equal(land.onFarm(20,-40,23),false,'retain the old farm membership for unrelated systems');
 assert.equal(land.farmGroundY(20,-40),0);
 assert.equal(typeof land.onBuildableLand,'function');
 assert.equal(land.onBuildableLand(20,-40,1.9,1.7),true);
 assert.equal(land.onBuildableLand(24,-40,1.9,1.7),false,'footprint reaches the sloping outside edge');
 assert.equal(land.onBuildableLand(20,-47,1.9,1.7),false,'north boundary stays finite');
 assert.equal(land.onBuildableLand(30,-40,1.9,1.7),false,'other hills are not implicitly buildable');
 assert.equal(land.farmGroundY(24,-40),0);
});

test('pen land includes the same tract but rejects a footprint that crosses its edge',()=>{
 const world={land:penEditableLand()},inside=[[18.1,-41.7],[21.9,-41.7],[21.9,-38.3],[18.1,-38.3]],outside=[[23,-41.7],[26,-41.7],[26,-38.3],[23,-38.3]];
 assert.equal(penEditableLandContains(inside,world),true);
 assert.equal(penEditableLandContains(outside,world),false);
});

test('the complete existing level north clearing is available to full workshop footprints',()=>{
 for(const [x,z] of [[-33,-46],[-33,-25],[25,-46],[25,-25]])assert.equal(land.farmGroundY(x,z),0,`clearing corner ${x},${z}`);
 for(let x=-33;x<=25;x+=.5)for(let z=-46;z<=-25;z+=.5)assert.equal(land.farmGroundY(x,z),0,`ground support at ${x},${z}`);
 for(const [x,z] of [[-28,-40],[-30,-44],[-24,-37]]){
  assert.equal(land.onFarm(x,z,23),false,'the old land rule still excludes this ground');
  assert.equal(land.onBuildableLand(x,z,1.9,1.7),true,`whole workshop at ${x},${z}`);
 }
 assert.equal(land.onBuildableLand(-34,-40,1.9,1.7),false,'west slope is outside the level boundary');
 assert.equal(land.onBuildableLand(-30,-47,1.9,1.7),false,'north fade is outside the level boundary');
});

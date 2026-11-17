'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const source=fs.readFileSync(require('node:path').join(__dirname,'fixtures/a52-boundary-main-index.txt'),'utf8'),yard=fs.readFileSync(require('node:path').join(__dirname,'fixtures/a52-care-yard-source.txt'),'utf8');
class V{constructor(x,y){this.x=x;this.y=y;}}
const ctx={structuredClone,THREE:{Vector2:V}};vm.createContext(ctx);vm.runInContext(yard.replace(/export /g,'')+'\nglobalThis.layout=cowYardLayout(25);',ctx);
const helpers=source.slice(source.indexOf('const toLocal ='),source.indexOf('function hitsBlock'));vm.runInContext(helpers+'\nglobalThis.contains=insideObst;',ctx);
const obstacles=ctx.layout.obstacles.map(([x,z,hw,hd])=>({x,z,hw,hd,c:1,s:0}));
const goals=[[2.805,-35.845000000000006],[-6.404999999999999,-35.845000000000006]];
test('recorded intermediate points are current source post corners with route clearance',()=>{for(const [i,postX]of [[0,2.2],[1,-5.8]]){const offset=.065+.42+.12,expected=[postX+(i?-offset:offset),-36.45+offset];assert(Math.hypot(expected[0]-goals[i][0],expected[1]-goals[i][1])<1e-12);assert.equal(obstacles.filter(o=>ctx.contains(o,new V(...goals[i]),.42)).length,0);}});
test('full registry route insertion rejects overlapping intermediate nodes, unlike endpoint skip exemptions',()=>{assert(source.includes('if (!obstacles.some(q => insideObst(q, c, pad)) &&'));assert(source.includes('const nodes = [from, to];'));assert(source.includes('const both = new Set([...skipA, ...skipB]);'));});
test('existing helper envelope gap and earlier wall entry are explicit',()=>{const wall=obstacles.find(o=>o.x===-3.6&&Math.abs(o.z+40.1)<1e-9);assert(wall);assert.equal(ctx.contains(wall,new V(0,-39.60),.42),true);assert.equal(ctx.contains(wall,new V(0,-39.57),.42),false);assert(Math.abs((wall.z+wall.hd+.42)-(-39.58))<1e-12);});
module.exports={goals,obstacles};

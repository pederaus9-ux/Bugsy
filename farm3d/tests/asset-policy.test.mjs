import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectGLB} from '../tools/validate-asset.mjs';
const policy={rootName:'SunnyBarn',maxBytes:4096,maxTriangles:10,maxPrimitives:2,maxMaterials:1,extensions:[]};
function fixture(change=()=>{}) {
 const d={asset:{version:'2.0'},buffers:[{byteLength:72}],bufferViews:[{buffer:0,byteOffset:0,byteLength:72}],accessors:[{type:'VEC3',count:3}],nodes:[{name:'SunnyBarn'}],materials:[{}],meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:0},material:0}]}]};change(d);
 const text=Buffer.from(JSON.stringify(d));const json=Buffer.alloc(Math.ceil(text.length/4)*4,32);text.copy(json);
 const b=Buffer.alloc(12+8+json.length+8+72);b.writeUInt32LE(0x46546c67,0);b.writeUInt32LE(2,4);b.writeUInt32LE(b.length,8);b.writeUInt32LE(json.length,12);b.writeUInt32LE(0x4e4f534a,16);json.copy(b,20);b.writeUInt32LE(72,20+json.length);b.writeUInt32LE(0x004e4942,24+json.length);return b;
}
test('embedded untextured production-policy fixture passes',()=>{const r=inspectGLB(fixture(),policy);assert.deepEqual(r.errors,[]);assert.equal(r.stats.triangles,1);});
test('truncated and malformed containers fail closed',()=>{for(const n of [0,12,19,30]) assert.ok(inspectGLB(fixture().subarray(0,n),policy).errors.length);const b=fixture();b.writeUInt32LE(3,4);assert.ok(inspectGLB(b,policy).errors.length);});
test('external dependencies, unsupported extensions and uncompressed images rejected',()=>{const r=inspectGLB(fixture(d=>{d.buffers[0].uri='remote.bin';d.extensionsRequired=['KHR_draco_mesh_compression'];d.images=[{uri:'remote.png',mimeType:'image/png'}];}),policy);assert.ok(r.errors.some(e=>e.includes('embedded GLB')));assert.ok(r.errors.some(e=>e.includes('Unsupported')));assert.ok(r.errors.some(e=>e.includes('KTX2')));});
test('invalid ranges, missing normals and oversized geometry rejected',()=>{const r=inspectGLB(fixture(d=>{d.bufferViews[0].byteOffset=73;delete d.meshes[0].primitives[0].attributes.NORMAL;d.accessors[0].count= 90;}),policy);assert.ok(r.errors.some(e=>e.includes('outside')));assert.ok(r.errors.includes('Missing normals'));assert.ok(r.errors.includes('Triangle budget exceeded'));});
test('root transform and animation contract enforced',()=>{const r=inspectGLB(fixture(d=>d.nodes[0].scale=[2,2,2]),{...policy,requiredAnimations:['idle']});assert.ok(r.errors.includes('Root transform must be identity'));assert.ok(r.errors.includes('Missing animation: idle'));});
test('download, surfaces and materials are independent budgets',()=>{const r=inspectGLB(fixture(),{...policy,maxBytes:10,maxPrimitives:0,maxMaterials:0});assert.ok(r.errors.includes('Download budget exceeded'));assert.ok(r.errors.includes('Primitive budget exceeded'));assert.ok(r.errors.includes('Material budget exceeded'));});

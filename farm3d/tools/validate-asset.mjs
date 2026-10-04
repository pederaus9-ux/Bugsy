import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// Production-policy preflight. Khronos validation and visual review remain required.
export function inspectGLB(bytes, policy) {
  const errors = [], fail = message => errors.push(message);
  if (bytes.length < 20) return {errors:['Truncated GLB']};
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0,true)!==0x46546c67 || view.getUint32(4,true)!==2)
    return {errors:['Expected GLB 2.0']};
  if (view.getUint32(8,true)!==bytes.length) fail('GLB byte length mismatch');
  let offset=12, document, binBytes=0, chunks=0;
  while(offset<bytes.length) {
    if(offset+8>bytes.length) {fail('Truncated chunk header');break;}
    const length=view.getUint32(offset,true), type=view.getUint32(offset+4,true);offset+=8;
    if(length%4 || offset+length>bytes.length) {fail('Invalid chunk length');break;}
    if(chunks===0 && type!==0x4e4f534a) fail('JSON must be the first chunk');
    if(type===0x4e4f534a) {
      if(document) fail('Duplicate JSON chunk');
      try {document=JSON.parse(new TextDecoder().decode(bytes.subarray(offset,offset+length)));}
      catch {fail('Invalid JSON chunk');}
    } else if(type===0x004e4942) {binBytes+=length;}
    else fail('Unexpected GLB chunk');
    offset+=length;chunks++;
  }
  if(!document) return {errors:[...errors,'Missing JSON document']};
  if(document.asset?.version!=='2.0') fail('Expected glTF asset version 2.0');
  if(bytes.length>policy.maxBytes) fail('Download budget exceeded');
  for(const extension of new Set([...(document.extensionsUsed||[]),...(document.extensionsRequired||[])]))
    if(!policy.extensions.includes(extension)) fail(`Unsupported extension: ${extension}`);
  const buffers=document.buffers||[];
  if(buffers.length!==1 || buffers[0].uri) fail('Require one embedded GLB buffer');
  if(!Number.isInteger(buffers[0]?.byteLength) || buffers[0].byteLength>binBytes) fail('Invalid embedded buffer length');
  for(const b of document.bufferViews||[]) {
    if(b.buffer!==0 || !Number.isInteger(b.byteLength) || b.byteLength<0 ||
       !Number.isInteger(b.byteOffset??0) || (b.byteOffset??0)<0 ||
       (b.byteOffset??0)+b.byteLength>buffers[0]?.byteLength) fail('Buffer view outside embedded buffer');
  }
  let triangles=0, primitives=0;
  for(const mesh of document.meshes||[]) for(const p of mesh.primitives||[]) {
    primitives++;
    if((p.mode??4)!==4) {fail('Require triangle primitives');continue;}
    const position=document.accessors?.[p.attributes?.POSITION];
    if(!position || position.type!=='VEC3' || !Number.isInteger(position.count) || position.count<=0) fail('Invalid POSITION accessor');
    if(p.attributes?.NORMAL===undefined) fail('Missing normals');
    const count=p.indices===undefined?position?.count:document.accessors?.[p.indices]?.count;
    if(!Number.isInteger(count) || count<=0 || count%3) fail('Invalid triangle count');
    else triangles+=count/3;
    if(p.material===undefined || !document.materials?.[p.material]) fail('Missing material');
  }
  if(!primitives) fail('No renderable mesh');
  if(triangles>policy.maxTriangles) fail('Triangle budget exceeded');
  if(primitives>policy.maxPrimitives) fail('Primitive budget exceeded');
  if((document.materials||[]).length>policy.maxMaterials) fail('Material budget exceeded');
  for(const image of document.images||[]) {
    if(image.uri || image.bufferView===undefined || !document.bufferViews?.[image.bufferView]) fail('Require embedded images');
    if(image.mimeType!=='image/ktx2') fail('Require KTX2 production textures');
  }
  const root=(document.nodes||[]).find(n=>n.name===policy.rootName);
  if(!root) fail(`Missing named root: ${policy.rootName}`);
  else if(root.matrix || (root.translation||[0,0,0]).some(v=>v!==0) ||
      (root.scale||[1,1,1]).some(v=>v!==1) ||
      JSON.stringify(root.rotation||[0,0,0,1])!=='[0,0,0,1]') fail('Root transform must be identity');
  if(policy.requiredAnimations) for(const name of policy.requiredAnimations)
    if(!(document.animations||[]).some(a=>a.name===name)) fail(`Missing animation: ${name}`);
  return {errors,stats:{bytes:bytes.length,triangles,primitives,materials:(document.materials||[]).length,images:(document.images||[]).length}};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    const [asset,contract,profile]=process.argv.slice(2);
    if(!asset||!contract||!profile) throw Error('Usage: node validate-asset.mjs ASSET.glb CONTRACT.json PROFILE');
    const policy=JSON.parse(readFileSync(contract,'utf8')).profiles[profile];
    if(!policy) throw Error(`Unknown profile: ${profile}`);
    const result=inspectGLB(readFileSync(asset),policy);console.log(JSON.stringify(result,null,2));
    if(result.errors.length) process.exitCode=1;
  } catch(error) {console.error(error.message);process.exitCode=1;}
}

// Publication-only test source resolver. Registered historical snapshots are
// exact immutable inputs, not replacement runtime or a claim of Git ancestry.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const sha=(kind,b)=>crypto.createHash(kind).update(b).digest('hex');
function createReader(directory,readGit=(ref,file)=>execFileSync('git',['show',ref+':'+file],{cwd:root,maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']})){
  const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'),'utf8'));
  if(manifest.v!==1||!manifest.snapshots)throw Error('Invalid snapshot manifest');
  const cache=new Map();
  return function readSource(ref,file){
    if(typeof ref!=='string'||!ref||!/^[-a-zA-Z0-9_/.]+$/.test(ref))throw Error('Invalid source ref');
    if(typeof file!=='string'||file.startsWith('/')||file.includes('\\')||file.includes('\0')||file.split('/').some(p=>p==='..'||p===''))throw Error('Invalid source path');
    if(!Object.hasOwn(manifest.snapshots,ref))return readGit(ref,file);
    const snapshot=manifest.snapshots[ref];
    if(snapshot.commit!==ref)throw Error('Snapshot identity mismatch');
    const entry=snapshot.files[file];
    if(!entry)throw Error('File absent from registered snapshot: '+ref+':'+file);
    if(!/^[a-f0-9]{64}$/.test(entry.sha256)||!/^[a-f0-9]{40}$/.test(entry.blob)||!Number.isSafeInteger(entry.bytes)||entry.bytes<0)throw Error('Invalid snapshot entry');
    const key=ref+':'+file;
    if(!cache.has(key)){
      const bytes=zlib.gunzipSync(fs.readFileSync(path.join(directory,'blobs',entry.sha256+'.gz')));
      if(bytes.length!==entry.bytes||sha('sha256',bytes)!==entry.sha256||sha('sha1',Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes]))!==entry.blob)throw Error('Snapshot integrity mismatch: '+key);
      cache.set(key,bytes);
    }
    return Buffer.from(cache.get(key));
  };
}
const readSource=createReader(path.join(__dirname,'fixtures/cache-source-snapshots'));
module.exports={createReader,readSource};

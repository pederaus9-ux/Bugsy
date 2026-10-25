const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const {createReader,readSource}=require('./qualification-source.cjs');
const dir=path.join(__dirname,'fixtures/cache-source-snapshots'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('all three frozen snapshots verify every byte without historical Git objects',()=>{
  const read=createReader(dir,()=>assert.fail('historical snapshot fell back to Git'));
  for(const [ref,s]of Object.entries(manifest.snapshots))for(const [file,e]of Object.entries(s.files)){const b=read(ref,file);assert.equal(b.length,e.bytes);assert.equal(sha(b),e.sha256);}
});
test('returned buffers cannot mutate the frozen cache',()=>{const ref=Object.keys(manifest.snapshots)[0],file='farm3d/sw.js',b=readSource(ref,file),hash=sha(b);b.fill(0);assert.equal(sha(readSource(ref,file)),hash);});
test('unknown files and path traversal fail instead of substituting current code',()=>{const ref=Object.keys(manifest.snapshots)[0],read=createReader(dir,()=>assert.fail('unexpected Git fallback'));for(const f of ['farm3d/missing.js','../game.js','/game.js','farm3d\\game.js','farm3d/../game.js'])assert.throws(()=>read(ref,f));});
test('unregistered current refs use exactly the requested Git ref and path',()=>{const calls=[],read=createReader(dir,(...args)=>{calls.push(args);return Buffer.from('current');});assert.equal(read('HEAD','farm3d/game.js').toString(),'current');assert.deepEqual(calls,[['HEAD','farm3d/game.js']]);});
test('corrupt bytes, length, Git blob or source identity fail closed',()=>{
  const ref=Object.keys(manifest.snapshots)[0],file='farm3d/sw.js',e=manifest.snapshots[ref].files[file],source=fs.readFileSync(path.join(dir,'blobs',e.sha256+'.gz'));
  for(const mode of ['bytes','length','blob','identity']){
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sa3d-snapshot-control-'));fs.mkdirSync(path.join(temp,'blobs'));
    const entry={...e},snapshot={commit:ref,files:{[file]:entry}};
    if(mode==='length')entry.bytes++;if(mode==='blob')entry.blob='0'.repeat(40);if(mode==='identity')snapshot.commit='0'.repeat(40);
    fs.writeFileSync(path.join(temp,'manifest.json'),JSON.stringify({v:1,snapshots:{[ref]:snapshot}}));
    fs.writeFileSync(path.join(temp,'blobs',e.sha256+'.gz'),mode==='bytes'?zlib.gzipSync(Buffer.from('wrong bytes')):source);
    assert.throws(()=>createReader(temp,()=>assert.fail('corrupt snapshot fallback'))(ref,file),/mismatch/);
  }
});

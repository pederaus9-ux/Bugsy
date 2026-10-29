'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const EXPECTED_MANIFEST_SHA256='073cd53e911a6c13ff2979eb2e755c0bc8e28611324072c8ab8ebd1130b0a3a6';
function verifyManifest(bytes){if(crypto.createHash('sha256').update(bytes).digest('hex')!==EXPECTED_MANIFEST_SHA256)throw Error('MANIFEST_DIGEST');return JSON.parse(bytes);}
const root=path.join(__dirname,'dist'),m=verifyManifest(fs.readFileSync(path.join(root,'source-manifest.json'))),actual=[];
function visit(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const n=prefix+e.name;if(e.isDirectory())visit(path.join(dir,e.name),n+'/');else actual.push(n);}}visit(root);
if(m.source!=='a5c0033a08280fd455d615bb802c03ba694325f9'||m.qualified!=='722a4b252500ba1d83e57f81ac4a2d28d7e3db3d')throw Error('SOURCE_IDENTITY');
const expected=m.assets.map(a=>a.path).concat('source-manifest.json').sort();if(JSON.stringify(actual.sort())!==JSON.stringify(expected))throw Error('UNEXPECTED_DIST_FILE');
for(const a of m.assets){if(!/^(?:farm3d|farm)\/|^(?:index\.html|admission\.js|bootstrap\.js|measurement\.js)$/.test(a.path)||a.path.includes('..')||/sw\.js$/.test(a.path))throw Error('ASSET_PATH');const b=fs.readFileSync(path.join(root,a.path));if(b.length!==a.bytes||crypto.createHash('sha256').update(b).digest('hex')!==a.sha256)throw Error('ASSET_HASH');}
for(const n of ['farm3d/auth.js','farm3d/game.js','farm3d/restore-recovery.js']){const a=m.assets.find(x=>x.path===n);if(!a||a.sha256!==a.originalSha256)throw Error('PROTECTED_SOURCE_CHANGED');}
for(const n of ['index.html','farm3d/index.html'])if(!fs.readFileSync(path.join(root,n),'utf8').includes('Content-Security-Policy'))throw Error('CSP_MISSING');
console.log(JSON.stringify({status:'STATIC_HASH_VERIFIED',assets:m.assets.length,source:m.source,browserTested:false,published:false}));
module.exports={verifyManifest};

'use strict';
const {collect}=require('./a53-legacy-evidence.cjs'),gate=require('./a53-boundary-source.cjs');
function run(root,head,source,output){return collect(root,head,'characters',source,output,(r,h)=>{gate.verify(r,h);return{parent:gate.PARENT,sourceManifestSha256:gate.MANIFEST};});}
module.exports={run};if(require.main===module){try{if(process.argv.length!==5)throw Error('Arguments');run(process.cwd(),...process.argv.slice(2));}catch{process.stderr.write('Boundary execution evidence rejected\n');process.exitCode=1;}}

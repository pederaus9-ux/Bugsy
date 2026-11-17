'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const PARENT='4b181cfc533975a644191edac1178038e001d35e';
const CHANGES=["M\tfarm3d/tests/analytics.browser.cjs", "A\tfarm3d/tests/helpers/a53-analytics-setup-diagnostic.cjs", "A\tfarm3d/tests/a53-analytics-setup-diagnostic.test.cjs", "A\tfarm3d/tests/fixtures/a53-analytics-setup-diagnostic.json", "A\tfarm3d/tests/helpers/a53-analytics-source.cjs", "A\t.github/workflows/a53-analytics-setup-diagnostic.yml", "A\tfarm3d/tests/fixtures/a53-analytics-setup-source.sha256"];
function verify(root,head){
 if(!/^[a-f0-9]{40}$/.test(head||''))throw Error('Head rejected');
 const git=(...a)=>cp.execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
 if(git('rev-parse','HEAD')!==head||git('rev-parse','HEAD^')!==PARENT)throw Error('Parent rejected');
 const actual=git('diff','--no-renames','--name-status',PARENT,head).split('\n').sort();
 if(JSON.stringify(actual)!==JSON.stringify(CHANGES.slice().sort()))throw Error('Scope rejected');
 if(git('diff','--name-only','HEAD','--')||git('diff','--cached','--name-only','--'))throw Error('Tracked writes rejected');
 const lines=fs.readFileSync(path.join(root,'farm3d/tests/fixtures/a53-analytics-setup-source.sha256'),'utf8').trim().split('\n');
 const seen=new Set();for(const line of lines){const m=/^([a-f0-9]{64})  ([A-Za-z0-9_.\/-]+)$/.exec(line);if(!m||m[2].split('/').includes('..')||seen.has(m[2]))throw Error('Pin rejected');seen.add(m[2]);const p=path.resolve(root,m[2]),s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||fs.realpathSync(p)!==p||crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==m[1])throw Error('Bytes rejected');}
 if(CHANGES.some(x=>!x.endsWith('farm3d/tests/fixtures/a53-analytics-setup-source.sha256')&&!seen.has(x.slice(2))))throw Error('Missing change pin');
 if(JSON.parse(fs.readFileSync(path.join(root,'farm3d/tests/package.json'))).scripts['test:analytics']!=='node --test analytics.test.mjs && node analytics.browser.cjs')throw Error('Command changed');
 return {schema:1,head,parent:PARENT,sourceVerified:true,runtimeChanged:false};
}
module.exports={verify,PARENT,CHANGES};if(require.main===module){try{const v=verify(process.cwd(),process.argv[2]);if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(v)+'\n',{flag:'wx',mode:0o600});}catch{process.stderr.write('Analytics diagnostic source rejected\n');process.exitCode=1;}}

// Execute the existing assertions verbatim through the experimental wrapper.
// Only the helper import changes; original sources and evidence remain intact.
import fs from 'node:fs';
const name=process.argv[2];if(!['controls','containment'].includes(name))throw Error('Explicit existing suite required');
const url=new URL(name==='controls'?'./cow-hierarchical-controls.mjs':'./cow-hierarchical-sweep-probe.mjs',import.meta.url);
process.argv[2]='envelope-preserved-'+name;
let source=fs.readFileSync(url,'utf8').replaceAll('import.meta.url',JSON.stringify(url.href));
source=source.replace(/from '([^']+)'/g,(_,p)=>`from '${new URL(p==='./helpers/cow-hierarchical-sweep.mjs'?'./helpers/cow-envelope-fast-path.mjs':p,url).href}'`);
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

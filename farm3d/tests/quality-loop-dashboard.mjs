import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lstat, realpath, readdir, open } from 'node:fs/promises';

const DEFAULT_ROOT = fileURLToPath(new URL('./artifacts/quality-loops/', import.meta.url));
const TYPES = { '.log': 'text/plain', '.txt': 'text/plain', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.zip': 'application/zip', '.mp4': 'video/mp4' };
const fail = (status) => Object.assign(new Error('Unavailable'), { status });

// Reject links at every component, including the configured root's ancestors.
async function checkedPath(root, relative = '') {
  const parts = relative.split('/');
  if (relative && parts.some(p => !p || p === '.' || p === '..' || /[\\:%\x00-\x1f]/.test(p) || /[. ]$/.test(p))) throw fail(403);
  const target = path.resolve(root, ...parts);
  if (target !== root && !target.startsWith(root + path.sep)) throw fail(403);
  const parsed = path.parse(target);
  let current = parsed.root;
  for (const part of target.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if ((await lstat(current)).isSymbolicLink()) throw fail(403);
  }
  const actual = await realpath(target);
  const actualRoot = await realpath(root);
  if (actual !== actualRoot && !actual.startsWith(actualRoot + path.sep)) throw fail(403);
  return target;
}

async function readSafe(root, relative, maxBytes = Infinity) {
  const target = await checkedPath(root, relative);
  const handle = await open(target, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.nlink !== 1 || stat.size > maxBytes) throw fail(403);
    await checkedPath(root, relative);
    return await handle.readFile();
  } finally { await handle.close(); }
}

const PAGE = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sunny Acres quality loops</title>
<style>body{background:#101b20;color:#edf4ef;font:16px system-ui;margin:0 auto;padding:28px;max-width:1150px}h1{margin-bottom:8px}p{line-height:1.6}small,.muted{color:#bac9c5}#summary,.lane{background:#1b2b30;border:1px solid #40565b;border-radius:12px;padding:18px;margin:16px 0}#lanes{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}.lane{margin:0;overflow-wrap:anywhere}.badge{display:inline-block;padding:4px 10px;border-radius:20px;background:#435860;font-weight:bold}.passed,.completed{background:#246446}.failed,.error,.timed_out{background:#923e40}.running{background:#705b21}.pending,.skipped,.blocked,.interrupted{background:#485463}a{color:#8ed5ff}pre{white-space:pre-wrap;overflow-wrap:anywhere}select{padding:8px;max-width:100%}li{margin:10px 0}.warning{color:#ffd287}</style>
<h1>Sunny Acres quality loops</h1><p class="muted">Local evidence viewer · Refreshes every 2 seconds · Read-only</p><p>This page watches recorded test runs. It does not fix code, approve visuals, merge changes, or certify a release.</p><label>Run <select id="runs"><option value="">Latest run</option></select></label><p id="connection" role="status">Loading evidence…</p><section id="summary"></section><div id="lanes"></div>
<script>
const $ = id => document.getElementById(id);
const el = (tag,text,cls) => {const n=document.createElement(tag);n.textContent=text ?? '';if(cls)n.className=cls;return n};
const badge = s => el('span',s || 'unknown','badge '+(['passed','completed','failed','error','running','pending','skipped','blocked','timed_out','interrupted'].includes(s)?s:''));
function link(run,value,label){if(typeof value!=='string')return null;let p=value.replaceAll('\\\\','/');if(!p.startsWith(run.id+'/'))p=run.id+'/'+p;if(p.split('/').some(x=>!x||x==='.'||x==='..'||/[:%]/.test(x)))return null;const a=el('a',label);a.href='/files/'+p.split('/').map(encodeURIComponent).join('/');a.target='_blank';a.rel='noopener';return a;}
function draw(r){$('summary').replaceChildren();$('lanes').replaceChildren();if(!r){$('summary').append(el('p','No run evidence yet. Start the quality-loop runner separately.'));return;}
$('summary').append(el('h2',r.id),badge(r.status),el('p','Source SHA: '+(r.head||'unknown')),el('p','Branch: '+(r.branch||'unknown')+' · Started: '+(r.startedAt||'unknown')+' · Finished: '+(r.finishedAt||'not finished')));
if(r.dirty)$('summary').append(el('p','Uncommitted changes were present. This evidence is not a clean-commit qualification.','warning'));
$('summary').append(el('p','Manifest: '+(r.manifestHash||'unknown')));
if(r.comparison){$('summary').append(el('h3','Comparison with prior evidence'),el('pre',JSON.stringify(r.comparison,null,2)));}
for(const lane of r.lanes||[]){const card=el('section','','lane');card.append(el('h2',lane.title||lane.id),badge(lane.status),el('p',lane.kind||''));if(lane.reason)card.append(el('p',lane.reason));const list=el('ul');for(const step of lane.steps||[]){const li=el('li');li.append(el('span',(step.file||'Step')+' '),badge(step.status));if(Number.isFinite(step.durationMs))li.append(el('p',(step.durationMs/1000).toFixed(1)+' seconds'));const log=link(r,step.log,'Open log');if(log)li.append(log);if(typeof step.artifacts==='string')li.append(el('p','Artifact folder: '+step.artifacts));for(const artifact of Array.isArray(step.artifacts)?step.artifacts:[]){const a=link(r,typeof artifact==='string'?artifact:artifact?.path,'View artifact');if(a)li.append(el('span',' · '),a);}list.append(li);}card.append(list);$('lanes').append(card);}}
async function refresh(){try{const response=await fetch('/api/runs',{cache:'no-store'});if(!response.ok)throw Error('Evidence temporarily unavailable');const runs=await response.json();const selected=$('runs').value;$('runs').replaceChildren(new Option('Latest run',''));for(const r of runs)$('runs').append(new Option(r.id+' · '+r.status,r.id));$('runs').value=selected;let r=runs.find(r=>r.id===selected);if(!r){const latest=await fetch('/api/latest',{cache:'no-store'});if(!latest.ok)throw Error('Latest evidence temporarily unavailable');r=await latest.json();}draw(r);$('connection').textContent='Updated '+new Date().toLocaleTimeString();}catch(e){$('connection').textContent=e.message+'; retrying. Previously displayed evidence may be stale.';}finally{setTimeout(refresh,2000);}}
$('runs').addEventListener('change',()=>{$('connection').textContent='Loading selected run…';});refresh();
</script></html>`;

export function createDashboard({ root = DEFAULT_ROOT } = {}) {
  root = path.resolve(root);
  const json = async relative => JSON.parse((await readSafe(root, relative, 8 * 1024 * 1024)).toString());
  return http.createServer(async (req, res) => {
    const send = (status, body, type = 'application/json') => { res.writeHead(status, { 'Content-Type': type + (type.startsWith('text/') || type === 'application/json' ? '; charset=utf-8' : ''), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self'; media-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'" }); res.end(body); };
    try {
      const authority = '127.0.0.1:' + res.socket.localPort;
      if (req.headers.host !== authority || (req.headers.origin && req.headers.origin !== 'http://' + authority) || (req.headers['sec-fetch-site'] && !['same-origin','none'].includes(req.headers['sec-fetch-site']))) return send(403, '{"error":"Local access only"}');
      if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(405, '{"error":"Read-only: GET required"}'); }
      const raw = req.url.split('?')[0];
      let pathname; try { pathname = decodeURIComponent(raw); } catch { throw fail(400); }
      if (pathname === '/') return send(200, PAGE, 'text/html');
      if (pathname === '/api/latest') {
        let latest; try { latest = await json('latest.json'); } catch(e) { if(e.code === 'ENOENT') return send(200, 'null'); throw e; }
        if (typeof latest.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(latest.id)) throw fail(403);
        return send(200, JSON.stringify(await json(latest.id + '/report.json')));
      }
      if (pathname === '/api/runs') {
        let entries; try { entries = await readdir(await checkedPath(root), { withFileTypes: true }); } catch(e) { if(e.code==='ENOENT') return send(200,'[]'); throw e; }
        const reports = [];
        for (const entry of entries.filter(e => e.isDirectory() && /^[A-Za-z0-9_-]+$/.test(e.name)).sort((a,b)=>b.name.localeCompare(a.name)).slice(0,50)) {
          try { reports.push(await json(entry.name + '/report.json')); } catch { /* Incomplete/unsafe evidence is never served. */ }
        }
        reports.sort((a,b)=>String(b.startedAt||'').localeCompare(String(a.startedAt||'')));
        return send(200,JSON.stringify(reports));
      }
      if (pathname.startsWith('/files/')) {
        const relative = pathname.slice(7), type = TYPES[path.extname(relative).toLowerCase()];
        if (!type) throw fail(403);
        return send(200, await readSafe(root,relative),type);
      }
      send(404,'{"error":"Not found"}');
    } catch(e) { send(e.status || (e.code === 'ENOENT' ? 404 : 503),'{"error":"Evidence unavailable"}'); }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let root = DEFAULT_ROOT, port = 4318;
  const args = process.argv.slice(2);
  for (let i=0;i<args.length;i++) {
    if(args[i]==='--root' && args[i+1]) root=args[++i];
    else if(args[i]==='--port' && /^\d+$/.test(args[i+1]||'')) port=Number(args[++i]);
    else throw new Error('Usage: node quality-loop-dashboard.mjs [--root directory] [--port 4318]');
  }
  if(port < 1 || port > 65535) throw new Error('Port must be 1–65535');
  const server=createDashboard({root});
  server.on('error', error=>{console.error(error.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log('Read-only quality dashboard: http://127.0.0.1:'+port));
}

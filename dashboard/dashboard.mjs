// Public, read-only GitHub evidence. No credentials, persistence, or write endpoints.
export const ROOT = 'https://github.com/pederaus9-ux/Bugsy';
export const API = 'https://api.github.com/repos/pederaus9-ux/Bugsy';
export const INTERVAL = 15 * 60 * 1000;
export const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const short = sha => sha ? String(sha).slice(0, 9) : 'Unknown';
export const stateOf = item => item?.status === 'completed' ? item.conclusion || 'unknown' : item?.status || 'unknown';
const FAILED = new Set(['failure', 'timed_out', 'action_required', 'startup_failure']);
const ACTIVE = new Set(['in_progress', 'queued', 'waiting', 'pending', 'requested']);
export function badge(state) {
  if (state === 'success') return ['Passed', 'label'];
  if (FAILED.has(state)) return [state === 'timed_out' ? 'Timed out' : 'Failed', 'label bad'];
  if (state === 'cancelled') return ['Cancelled', 'label warn'];
  if (state === 'in_progress') return ['Running', 'label info'];
  if (ACTIVE.has(state)) return ['Queued', 'label info'];
  if (state === 'skipped') return ['Skipped', 'label neutral'];
  return ['Unknown', 'label neutral'];
}
export function exactRuns(runs, sha, main = false) {
  return runs.filter(r => sha && r.head_sha === sha && (!main || (r.head_branch === 'main' && r.event !== 'pull_request')));
}
export function latestRuns(runs) {
  const ordered = [...runs].sort((a,b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id || (b.run_attempt || 1) - (a.run_attempt || 1));
  const seen = new Set();
  return ordered.filter(r => { const key = `${r.workflow_id ?? r.path ?? r.name}:${r.event}:${r.head_sha}`; if (seen.has(key)) return false; seen.add(key); return true; });
}
export function summarize(runs) {
  const states = latestRuns(runs).map(stateOf);
  return {total:states.length, passed:states.filter(s=>s==='success').length, active:states.filter(s=>ACTIVE.has(s)).length,
    failed:states.filter(s=>FAILED.has(s)).length, cancelled:states.filter(s=>s==='cancelled').length,
    skipped:states.filter(s=>s==='skipped').length, unknown:states.filter(s=>!ACTIVE.has(s)&&!FAILED.has(s)&&!['success','cancelled','skipped'].includes(s)).length};
}
export function verdict(runs, incomplete = false) {
  const s = summarize(runs);
  if (incomplete) return ['Incomplete evidence', 'neutral'];
  if (!s.total) return ['No runs found', 'neutral'];
  if (s.failed) return ['Failed checks need attention', 'bad'];
  if (s.active) return ['Validation in progress', 'info'];
  if (s.cancelled || s.unknown || s.skipped) return ['Review incomplete checks', 'warn'];
  return ['Observed runs passed', ''];
}
export function defaultPR(prs) {
  const ordered = [...prs].sort((a,b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  return ordered.find(p => /sunny|farm|chicken|coop|cow|horse|sheep|dog|cat|animal|dairy/i.test(p.title) && !/dashboard|command center/i.test(p.title)) || ordered[0] || null;
}
export function duration(item, now = Date.now()) {
  const start = Date.parse(item.started_at || item.run_started_at);
  const end = item.status === 'completed' ? Date.parse(item.completed_at || item.updated_at) : now;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'Duration unknown';
  const seconds = Math.max(0, Math.floor((end - start) / 1000));
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s${item.status === 'completed' ? '' : ' elapsed'}`;
}
export const stamp = time => {if(!time)return 'Never';const date=new Date(time);return Number.isFinite(date.getTime())?date.toISOString().slice(0,16).replace('T',' ')+' UTC':'Time unknown';};
export function nextPage(link) { return /<([^>]+)>;\s*rel="next"/.exec(link || '')?.[1] || null; }

export class GitHubClient {
  constructor(fetcher = globalThis.fetch, clock = Date.now) { this.fetcher=fetcher.bind(globalThis); this.clock=clock; this.calls=[]; this.blockedUntil=0; this.remaining=null; }
  async get(path) {
    const now=this.clock(); this.calls=this.calls.filter(t=>now-t<3600000);
    if (now < this.blockedUntil) throw new Error(`API paused until ${stamp(this.blockedUntil)}.`);
    if (this.calls.length >= 40) { this.blockedUntil=this.calls[0]+3600000; throw new Error(`This tab's 40-request hourly budget is used. Retry after ${stamp(this.blockedUntil)}.`); }
    const url=new URL(path, API+'/');
    if (url.origin !== 'https://api.github.com' || url.username || url.password || !url.pathname.startsWith('/repos/pederaus9-ux/Bugsy/')) throw new Error('Untrusted API page rejected.');
    this.calls.push(now);
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),15000);
    try {
      const res=await this.fetcher(url.href,{method:'GET',credentials:'omit',headers:{Accept:'application/vnd.github+json'},signal:controller.signal,cache:'no-store'});
      const remaining=res.headers.get('x-ratelimit-remaining');
      if (remaining !== null) this.remaining=Number(remaining);
      const retry=Number(res.headers.get('retry-after'));
      const reset=Number(res.headers.get('x-ratelimit-reset'))*1000;
      if (res.status===403 || res.status===429 || this.remaining===0) this.blockedUntil=Math.max(this.blockedUntil,now+(retry>0?retry*1000:INTERVAL),reset>now?reset:0);
      if (!res.ok) throw new Error(res.status===403||res.status===429 ? `GitHub limit or access restriction (HTTP ${res.status}); retry after ${stamp(this.blockedUntil)}.` : `GitHub HTTP ${res.status}.`);
      return {data:await res.json(),next:nextPage(res.headers.get('link')),at:this.clock()};
    } finally { clearTimeout(timer); }
  }
}

export function startDashboard(doc = document, win = window, client = new GitHubClient()) {
  const el=id=>doc.getElementById(id), text=(id,value)=>{el(id).textContent=value;};
  const newSource=()=>({data:null,at:0,error:'',next:null});
  const sources={main:newSource(),prs:newSource(),head:newSource(),merge:newSource(),mainRuns:newSource(),deployment:newSource()};
  const jobs=new Map();
  let selected=null, pr=null, mainSha=null, mergeSha=null, busy=false, epoch=0, failures=0, lastAttempt=0, lastComplete=0, nextDue=0, actionMessage='';
  const query=new URL(win.location.href).searchParams.get('pr');
  if (query==='main' || /^\d+$/.test(query||'')) selected=query;
  const notice=message=>{actionMessage=message; renderFreshness();};
  const link=(url,label,cls='tiny-link')=>`<a class="${cls}" href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(label)}</a>`;
  const tag=s=>{const b=badge(s);return `<span class="${b[1]}">${safe(b[0])}</span>`;};
  const sourceNote=s=>`${s.at?'Fetched '+stamp(s.at):'Not fetched'}${s.error?' · Unavailable: '+s.error:''}${s.at&&Date.now()-s.at>=INTERVAL?' · STALE':''}`;
  const runUrl=r=>`${ROOT}/actions/runs/${Number(r.id)}/attempts/${Number(r.run_attempt)||1}`;
  async function load(source,path,extract,append=false) {
    try { const result=await client.get(path); const data=extract(result.data); if (!Array.isArray(data) && (data===null || typeof data!=='object')) throw new Error('Unexpected GitHub response.'); source.data=append?[...new Map([...(source.data||[]),...data].map(item=>[item.id,item])).values()]:data; source.at=result.at; source.next=result.next; source.error=''; return true; }
    catch(e) { source.error=e.name==='AbortError'?'Request timed out.':e.message; return false; }
  }
  function allRuns() { return [...(sources.head.data||[]),...(sources.merge.data||[])]; }
  function renderFreshness() {
    const used=[...Object.values(sources),...jobs.values()].filter(s=>s.at||s.error);
    const errors=[...used.filter(s=>s.error),...(pr?.detailError?[{error:pr.detailError}]:[])], stale=used.some(s=>s.at&&Date.now()-s.at>=INTERVAL);
    const waiting=Date.now()<client.blockedUntil;
    text('connectionText',busy?'Fetching GitHub':errors.length?'Partial / unavailable':stale?'Stale evidence':lastComplete?'GitHub fetched':'Awaiting evidence');
    el('connection').dataset.state=errors.length||stale?'offline':lastComplete?'online':'loading';
    const latest=Math.max(0,...used.map(s=>s.at));
    text('checkedAt','Last successful fetch: '+stamp(latest));
    text('completeAt','Last complete refresh: '+stamp(lastComplete));
    const seconds=Math.max(0,Math.ceil((Math.max(nextDue,client.blockedUntil)-Date.now())/1000));
    text('nextCheck',doc.visibilityState!=='visible'?'Auto-refresh paused while hidden':waiting?'Rate-limit backoff until '+stamp(client.blockedUntil):`Visible-page refresh in ${Math.floor(seconds/60)}m ${seconds%60}s (15-minute cadence)`);
    text('budget',`Public API · ${client.calls.filter(t=>Date.now()-t<3600000).length}/40 requests this hour in this page session${client.remaining!==null?' · GitHub remaining: '+client.remaining:''}. Jobs and more pages use additional reads.`);
    const messages=[actionMessage,...errors.map(s=>s.error),...(stale?['Some evidence is over 15 minutes old. Check the fetch times before relying on it.']:[])].filter(Boolean);
    el('notice').textContent=[...new Set(messages)].join(' '); el('notice').classList.toggle('hidden',!messages.length);
    el('refresh').disabled=busy||waiting; el('prSelect').disabled=busy;
    text('refresh',busy?'Checking…':'Refresh');
  }
  function renderOverview() {
    const runs=selected==='main'?(sources.mainRuns.data||[]):allRuns();
    const relevant=selected==='main'?[sources.main,sources.mainRuns]:[sources.prs,sources.head,...(mergeSha?[sources.merge]:[])];
    const incomplete=busy||relevant.some(s=>!s.at||s.error||s.next||Date.now()-s.at>=INTERVAL)||Boolean(pr?.detailError);
    const [label,cls]=verdict(runs,incomplete), counts=summarize(runs);
    text('heroTitle',selected==='main'?'Main integration evidence':pr?`#${pr.number} · ${pr.title}`:'PR evidence unavailable');
    text('heroBadge',label); el('heroBadge').className='label '+cls;
    text('heroDesc','Only results for the displayed revision are included. This is observed CI evidence; required-check completeness, owner approval, and deployment are separate decisions.');
    text('heroSha',selected==='main'?'main '+short(mainSha):'PR head '+short(pr?.head?.sha));
    el('heroLink').href=pr&&selected!=='main'?`${ROOT}/pull/${pr.number}`:`${ROOT}/tree/main`; text('heroLink',pr&&selected!=='main'?'Open PR #'+pr.number:'Open main');
    text('mainSha',mainSha||'Unknown'); el('mainSha').href=mainSha?`${ROOT}/commit/${mainSha}`:`${ROOT}/commits/main`;
    text('branch',selected==='main'?'main':pr?.head?.ref||'Unknown');
    text('sha',selected==='main'?mainSha||'Unknown':pr?.head?.sha||'Unknown');
    text('mergeSha',selected==='main'?'Not applicable':mergeSha||'Unavailable / not established');
    text('selectionTime',sourceNote(selected==='main'?sources.main:sources.prs));
    text('detailError',pr?.detailError||'');
    text('passed',counts.passed); text('active',counts.active); text('failed',counts.failed);
    text('healthScore',counts.total?counts.passed+'/'+counts.total:'—');
    text('healthDesc',`Latest loaded workflow/event results · ${counts.cancelled} cancelled · ${counts.skipped} skipped · ${counts.unknown} unknown${incomplete?' · evidence incomplete':''}`);
    text('nextAction',counts.failed?'Inspect failed jobs':counts.active?'Follow running jobs':'Review evidence and manual gates');
  }
  function runCard(r,old=false,scope='PR head') {
    const attempt=Number(r.run_attempt)||1;
    const key=`${r.id}:${attempt}`, j=jobs.get(key);
    const history=attempt>1?`<div class="row-details">Attempt ${attempt} is current. ${Array.from({length:Math.min(attempt-1,5)},(_,i)=>link(`${ROOT}/actions/runs/${r.id}/attempts/${attempt-1-i}`,'Attempt '+(attempt-1-i))).join(' · ')}${attempt>6?' · earlier attempts on GitHub':''}</div>`:'';
    const jobHtml=j?`<p class="row-details">${safe(sourceNote(j))} · ${j.data?.length||0} jobs loaded${j.next?' · more available':''}</p>${(j.data||[]).map(job=>`<div class="job">${link(`${ROOT}/actions/runs/${r.id}/job/${Number(job.id)}`,job.name,'job-name')}<div>${tag(stateOf(job))}<div class="row-details">${safe(duration(job))}</div></div></div>`).join('')}${j.next?`<button class="button secondary" data-more-jobs="${key}">Load more jobs</button>`:''}`:'<p class="row-details">Load jobs for direct failure links and individual durations.</p>';
    return `<article class="run ${old?'older':''}"><div class="run-top"><div>${link(runUrl(r),r.name||'Workflow','run-title')}<div class="row-details">Run #${safe(r.run_number)} · attempt ${attempt} · ${safe(r.event)} · ${safe(duration(r))}${r.status==='completed'?' (run estimate)':''}</div></div>${tag(stateOf(r))}</div><div class="row-details mono">${scope} ${safe(short(r.head_sha))} · updated ${safe(stamp(r.updated_at))}</div>${history}<details data-job-key="${key}" ${j?.open?'open':''}><summary>Jobs for attempt ${attempt}</summary><div class="jobs-content">${jobHtml}<button class="button secondary" data-jobs="${key}">${j?.loading?'Loading…':j?'Refresh jobs':'Load jobs'}</button></div></details></article>`;
  }
  function renderRuns(key,target,sha,main=false) {
    const s=sources[key], runs=exactRuns(s.data||[],sha,main), latest=latestRuns(runs), ids=new Set(latest.map(r=>r.id)), older=runs.filter(r=>!ids.has(r.id));
    const priority=r=>FAILED.has(stateOf(r))?0:stateOf(r)==='cancelled'?1:ACTIVE.has(stateOf(r))?2:stateOf(r)==='success'?4:3;
    latest.sort((a,b)=>priority(a)-priority(b));
    const scope=main?'main':key==='merge'?'merge test':'PR head';
    el(target).innerHTML=`<p class="row-details source-note">${safe(sourceNote(s))}</p><p class="row-details">${safe(short(sha))} · ${runs.length} matching runs loaded · latest attempt per run. ${s.next?'More pages available; summary is incomplete.':s.at?'End of accessible results loaded (GitHub filtered-search cap: 1,000).':'No successful run fetch yet.'}</p>${latest.map(r=>runCard(r,false,scope)).join('')||'<p class="empty">'+(s.error?'Run evidence unavailable.':!sha?'Revision not established.':'No runs found for this revision. This does not prove checks passed.')+'</p>'}${older.length?`<details class="run-history"><summary>${older.length} older run records — excluded from summary</summary>${older.map(r=>runCard(r,true,scope)).join('')}</details>`:''}${s.next?`<button class="button secondary" data-more="${key}">Load next 50 runs</button>`:''}`;
  }
  function renderActive() {
    const s=sources.prs, prs=s.data||[];
    el('pulls').innerHTML=`<p class="row-details">${safe(sourceNote(s))} · ${prs.length} PRs loaded${s.next?' · more available':''}</p>`+prs.map(p=>`<div class="row-item"><div>${link(`${ROOT}/pull/${p.number}`,`#${p.number} · ${p.title}`,'row-title')}<div class="row-details mono">head ${safe(short(p.head?.sha))} · updated ${safe(stamp(p.updated_at))}</div></div><button class="button secondary" data-select="${p.number}" ${busy?'disabled':''}>${selected===String(p.number)?'Selected':p.draft?'Track draft':'Track PR'}</button></div>`).join('')+(!prs.length?'<p class="empty">'+(s.error?'Open work unavailable.':'No open PRs returned.')+'</p>':'')+(s.next?'<button class="button secondary" data-more-prs>Load more PRs</button>':'');
    el('prSelect').innerHTML='<option value="main">Main · post-merge integration</option>'+prs.map(p=>`<option value="${p.number}">#${p.number}${p.draft?' · Draft':''} · ${safe(p.title)}</option>`).join('');
    if(selected!=='main'&&!prs.some(p=>String(p.number)===selected))el('prSelect').insertAdjacentHTML('beforeend',`<option value="${safe(selected)}">PR #${safe(selected)} · unavailable or closed</option>`);
    el('prSelect').value=selected||'main';
  }
  function renderDeployment() {
    const s=sources.deployment, d=s.data?.record, status=s.data?.status;
    el('deployment').innerHTML=`<h3>Deployment evidence</h3><span class="label ${status?.state==='success'?'':'neutral'}">${status?'API record: '+safe(status.state):'Unknown'}</span><p>${d?`Latest of up to 10 records for current main: ${safe(d.environment)} · <span class="mono">${safe(short(d.sha))}</span>. Status recorded ${safe(stamp(status?.created_at))}.`:'No deployment status was established for current main.'}</p><p class="row-details">${safe(sourceNote(s))}</p><p class="row-details">A deployment record does not verify currently served bytes or owner acceptance. Other environments/older records may exist.</p>${link(`${ROOT}/deployments`,'Inspect deployment records')}`;
  }
  function render() {
    renderActive(); renderOverview();
    el('prScopes').classList.toggle('hidden',selected==='main');
    renderRuns('head','headRuns',pr?.head?.sha); renderRuns('merge','mergeRuns',mergeSha); renderRuns('mainRuns','mainRuns',mainSha,true);
    text('mainTime',sourceNote(sources.main)); renderDeployment(); renderFreshness();
  }
  async function loadDeployment() {
    if(!mainSha) {sources.deployment.error='Main revision unavailable.';return;}
    const s=sources.deployment;
    try {const res=await client.get(`deployments?sha=${mainSha}&per_page=10`); if(!Array.isArray(res.data))throw new Error('Unexpected deployment response.');
      const record=res.data.find(d=>d.sha===mainSha)||null;
      const status=record?(await client.get(`deployments/${Number(record.id)}/statuses?per_page=1`)).data[0]||null:null;
      s.data={record,status};s.at=Date.now();s.error='';
    } catch(e) {s.error=e.message;}
  }
  async function loadRevision() {
    pr=(sources.prs.data||[]).find(p=>String(p.number)===selected)||null;
    mergeSha=null;
    if(selected!=='main'&&pr) {
      try { const detail=await client.get('pulls/'+Number(selected));
        // Detail is newer than the list: use its exact head and merge-test SHA together.
        if(detail.data.state!=='open')throw new Error('PR is no longer open; select main or refresh the list.');
        if(!/^[a-f0-9]{40}$/i.test(detail.data.head?.sha||''))throw new Error('PR head revision missing.');
        pr=detail.data; sources.prs.data=sources.prs.data.map(p=>p.number===pr.number?pr:p);
        const candidate=/^[a-f0-9]{40}$/i.test(pr.merge_commit_sha||'')?pr.merge_commit_sha:null;
        if(candidate&&candidate!==pr.head.sha){
          try {const commit=await client.get('commits/'+candidate);const parents=commit.data.parents?.map(p=>p.sha)||[];
            if(!parents.includes(pr.head.sha)||!parents.includes(pr.base?.sha))throw new Error('Merge commit parents do not match the current PR head and base.');
            mergeSha=candidate;
          }catch(e){pr={...pr,detailError:'Merge-test revision unverified: '+e.message+' Source-head evidence remains separate.'};}
        }
      } catch(e) {pr={...pr,detailError:'PR detail/merge-test revision unavailable: '+e.message};}
    }
    if(sources.head.sha!==pr?.head?.sha)sources.head={...newSource(),sha:pr?.head?.sha};
    if(sources.merge.sha!==mergeSha)sources.merge={...newSource(),sha:mergeSha};
    if(selected!=='main'&&!pr)sources.head.error='Selected PR is absent from the open PR list. Select another PR or main.';
    const tasks=[];
    if(selected!=='main'&&pr?.head?.sha) tasks.push(load(sources.head,`actions/runs?head_sha=${pr.head.sha}&per_page=50`,d=>exactRuns(d.workflow_runs,pr.head.sha)));
    if(selected!=='main'&&mergeSha&&mergeSha!==pr?.head?.sha)tasks.push(load(sources.merge,`actions/runs?head_sha=${mergeSha}&per_page=50`,d=>exactRuns(d.workflow_runs,mergeSha)));
    if(mergeSha&&mergeSha===pr?.head?.sha)mergeSha=null;
    await Promise.all(tasks);
  }
  async function refresh(manual=false) {
    if(busy)return;
    if(manual&&Date.now()-lastAttempt<45000){notice('Please allow 45 seconds between full refreshes to conserve public API reads.');return;}
    if(Date.now()<client.blockedUntil){notice('API reads are paused until '+stamp(client.blockedUntil));return;}
    busy=true;lastAttempt=Date.now();actionMessage='';epoch++;jobs.clear();renderFreshness();
    await Promise.all([load(sources.main,'branches/main',d=>{if(!/^[a-f0-9]{40}$/i.test(d.commit?.sha||''))throw new Error('Main SHA missing from response.');return d;}),load(sources.prs,'pulls?state=open&sort=updated&direction=desc&per_page=100',d=>{if(!Array.isArray(d))throw new Error('Open PR list missing from response.');return d;})]);
    const newMain=sources.main.data?.commit?.sha||null;
    if(newMain!==mainSha){sources.mainRuns=newSource();sources.deployment=newSource();}
    mainSha=newMain;
    if(selected===null)selected=String(defaultPR(sources.prs.data||[])?.number||'main');
    // A failed PR list must not silently change the tracked revision.
    const tasks=[loadRevision(),loadDeployment()];
    if(mainSha)tasks.push(load(sources.mainRuns,`actions/runs?head_sha=${mainSha}&branch=main&per_page=50`,d=>exactRuns(d.workflow_runs,mainSha,true)));
    await Promise.all(tasks);
    // One failed run is expanded automatically; further job reads are on demand.
    const failedRun=latestRuns(selected==='main'?(sources.mainRuns.data||[]):allRuns()).find(r=>FAILED.has(stateOf(r)));
    if(failedRun&&!sources.head.error&&!sources.mainRuns.error)await loadJobs(`${failedRun.id}:${Number(failedRun.run_attempt)||1}`,false,false);
    busy=false;
    const failed=[...Object.values(sources),...jobs.values()].some(s=>s.error)||Boolean(pr?.detailError);
    failures=failed?failures+1:0;if(!failed)lastComplete=Date.now();
    nextDue=Date.now()+Math.min(INTERVAL*2**failures,3600000);render();
  }
  async function select(value) {
    if(busy||value===selected)return;
    selected=value;const url=new URL(win.location.href);url.searchParams.set('pr',value);win.history.replaceState(null,'',url);busy=true;epoch++;jobs.clear();renderFreshness();
    await loadRevision();busy=false;render();
  }
  async function loadJobs(key,more=false,restoreFocus=true) {
    const run=[...allRuns(),...(sources.mainRuns.data||[])].find(r=>`${r.id}:${Number(r.run_attempt)||1}`===key);
    if(!run)return;let j=jobs.get(key);if(j?.loading)return;
    if(!j){j={...newSource(),open:true};jobs.set(key,j);}j.open=true;j.loading=true;const version=epoch;render();
    await load(j,more?j.next:`actions/runs/${run.id}/attempts/${Number(run.run_attempt)||1}/jobs?per_page=100`,d=>d.jobs,more);
    j.loading=false;if(version===epoch){render();if(restoreFocus&&doc.activeElement===doc.body)doc.querySelector(`details[data-job-key="${key}"] > summary`)?.focus({preventScroll:true});}
  }
  async function moreRuns(key) {
    const s=sources[key];if(!s?.next||busy)return;busy=true;const version=epoch;renderFreshness();
    const sha=key==='mainRuns'?mainSha:key==='merge'?mergeSha:pr?.head?.sha;
    await load(s,s.next,d=>exactRuns(d.workflow_runs,sha,key==='mainRuns'),true);busy=false;if(version===epoch)render();
  }
  function snapshot() {
    const lines=['Sunny Acres evidence · copied '+stamp(Date.now()),'Main '+(mainSha||'Unknown')+' · '+sourceNote(sources.main),selected==='main'?'Selected: main':`Selected PR #${selected} · head ${pr?.head?.sha||'Unknown'} · merge-test ${mergeSha||'Unknown'}`,`Open PR source: ${sourceNote(sources.prs)}`,`Last complete refresh: ${stamp(lastComplete)}`];
    for(const key of selected==='main'?['mainRuns']:['head','merge','mainRuns']){const s=sources[key];lines.push(`${key}: ${JSON.stringify(summarize(s.data||[]))} · ${sourceNote(s)}${s.next?' · more pages available':''}`);}
    lines.push('Counts use latest loaded workflow/event result per revision; older run records are excluded.',busy?'Refresh in progress; previous evidence may be displayed.':'','Owner approval: unknown. Deployment: '+(sources.deployment.data?.status?.state||'unknown')+' (API record only) · '+sourceNote(sources.deployment),actionMessage,pr?.detailError||'',selected==='main'?ROOT+'/tree/main':ROOT+'/pull/'+selected);
    return lines.filter(Boolean).join('\n');
  }
  el('refresh').addEventListener('click',()=>refresh(true));
  el('prSelect').addEventListener('change',e=>select(e.target.value));
  doc.addEventListener('click',async e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.select)return select(b.dataset.select);
    if(b.dataset.jobs)return loadJobs(b.dataset.jobs);
    if(b.dataset.moreJobs)return loadJobs(b.dataset.moreJobs,true);
    if(b.dataset.more)return moreRuns(b.dataset.more);
    if(b.hasAttribute('data-more-prs')&&!busy&&sources.prs.next){busy=true;renderFreshness();await load(sources.prs,sources.prs.next,d=>d,true);busy=false;render();}
  });
  doc.addEventListener('toggle',e=>{const key=e.target.dataset?.jobKey;if(!key)return;if(jobs.has(key))jobs.get(key).open=e.target.open;else if(e.target.open)loadJobs(key);},true);
  el('copyStatus').addEventListener('click',async()=>{const value=snapshot();el('copyText').value=value;el('copyFallback').classList.remove('hidden');try{await win.navigator.clipboard.writeText(value);notice('Status copied with revisions, fetch times, and evidence limits.');}catch{notice('Clipboard unavailable. Select and copy the status text below.');el('copyText').focus();el('copyText').select();}});
  function tick(){renderFreshness();if(!busy&&doc.visibilityState==='visible'&&Date.now()>=Math.max(nextDue,client.blockedUntil))refresh();}
  win.setInterval(tick,30000);doc.addEventListener('visibilitychange',tick);
  if(doc.visibilityState==='visible')refresh();else renderFreshness();
  return {refresh,select,snapshot,sources};
}
if (typeof document !== 'undefined') startDashboard();

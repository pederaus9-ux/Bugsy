import {ANALYTICS_RELEASE, decodeReport, summarizeReports, MILESTONES, FPS_LABELS, DURATIONS, utcDay} from './analytics.js?v=3';
export const PAGE_SIZE=250, READ_LIMIT=2000;
export function dateCutoff(period, now=Date.now()) { return period === 'all' ? null : utcDay(now-(Number(period)-1)*864e5); }

// Mounted only after the existing owner-only presence read succeeds. Firestore remains the authority.
// Version/platform filters are local; the sole server index is the built-in date index.
export function mountReports(root,{F,db,now=()=>Date.now()}) {
  root.innerHTML=`<h2>Progress &amp; performance</h2>
    <div class="filters">
      <label>Release<select id="reportVersion"><option value="${ANALYTICS_RELEASE}">Current (${ANALYTICS_RELEASE})</option><option value="*">All releases</option></select></label>
      <label>Period<select id="reportPeriod"><option value="7">7 days</option><option value="30">30 days</option><option value="all">All time</option></select></label>
      <label>Platform<select id="reportPlatform"><option value="*">All platforms</option><option value="android">Android</option><option value="ios">iPhone / iPad</option><option value="desktop">Desktop</option><option value="other">Other</option></select></label>
    </div>
    <p class="note" id="reportStatus" role="status" aria-live="polite"></p>
    <div id="reportResults"></div><button id="reportMore" type="button" hidden>Load more reports</button>
    <p class="note reportNote">Counts are anonymous reports, not unique players. Milestones count once per release on a browser with local storage. Returns mean exactly 1 or 7 UTC calendar days after the first observed visit on that browser.</p>
    <p class="note reportNote">Sessions are foreground visits ending when the page is hidden or left. Paused time is excluded. Abrupt browser or phone shutdowns may never report. “No reported errors” means no observed JavaScript error in the reported visit; it does not measure all crashes.</p>`;
  const $=id=>root.querySelector('#'+id), version=$('reportVersion'), period=$('reportPeriod'), platform=$('reportPlatform'), status=$('reportStatus'), results=$('reportResults'), more=$('reportMore');
  let rows=[], cursor=null, loaded=0, issued=0, activePeriod=period.value, hasMore=false, busy=false, epoch=0, dead=false, failure=false;
  const number=n=>Number(n).toLocaleString();
  const table=(title,entries)=>`<h3>${title}</h3><dl class="reportTable">${entries.map(([name,n])=>`<div><dt>${name}</dt><dd>${number(n)}</dd></div>`).join('')}</dl>`;
  function render() {
    if(dead)return;
    const s=summarizeReports(rows,{version:version.value,platform:platform.value});
    status.textContent=busy ? `Loading… ${number(loaded)} event documents read.` : failure ? `Couldn't load reports. Check your connection, then retry. Showing ${number(s.reports)} matching reports already loaded.` :
      `${number(s.reports)} matching reports loaded · ${number(loaded)} event documents read. ${hasMore ? 'Partial results: more history is available.' : 'All available reports in this period loaded.'}`;
    results.innerHTML=table('Milestone reports',MILESTONES.map(([k,label])=>[label,s.milestones[k]||0]))+
      `<h3>Reported visits</h3><p class="note"><b>${number(s.sessions)}</b> visits · <b>${number(s.clean)}</b> with no reported errors${s.sessions ? ` (${Math.round(100*s.clean/s.sessions)}%)` : ''} · <b>${number(s.bootErrors)}</b> startup error reports</p>`+
      table('Average rendered FPS',Object.entries(FPS_LABELS).map(([k,label])=>[label,s.fps[k]||0]))+
      table('Active visit length',DURATIONS.map((label,k)=>[label,s.durations[k]]))+
      table('Visit screen sizes',[['Phone',s.screens.phone||0],['Tablet',s.screens.tablet||0],['Desktop',s.screens.desktop||0],['Unknown',s.screens.unknown||0]])+
      table('Visit sign-in mode',[['Guest',s.modes.guest||0],['Account',s.modes.account||0],['Unknown',s.modes.unknown||0]]);
    more.hidden=!hasMore && !failure; more.disabled=busy || issued>=READ_LIMIT;
    more.textContent=issued>=READ_LIMIT ? 'Read limit reached for this visit' : failure ? 'Retry loading reports' : 'Load more reports';
  }
  async function load(reset=false) {
    if(dead || busy && !reset)return;
    if(issued>=READ_LIMIT){status.textContent='Read limit reached for this visit. Reload to continue.';return;}
    if(reset){epoch++;rows=[];cursor=null;loaded=0;hasMore=false;failure=false;activePeriod=period.value;}
    const request=epoch;busy=true;render();
    try {
      const clauses=[], cutoff=dateCutoff(period.value,now());
      if(cutoff)clauses.push(F.where('d','>=',cutoff));
      clauses.push(F.orderBy('d','desc'));if(cursor)clauses.push(F.startAfter(cursor));
      const size=Math.min(PAGE_SIZE,READ_LIMIT-issued);clauses.push(F.limit(size));issued+=size;
      const snap=await F.getDocs(F.query(F.collection(db,'events'),...clauses));
      if(dead || request!==epoch)return;
      loaded+=snap.docs.length;cursor=snap.docs.at(-1)||cursor;hasMore=snap.docs.length===size;failure=false;
      for(const d of snap.docs){const row=d.data();if(decodeReport(row))rows.push(row);}
      const known=new Set([...version.options].map(o=>o.value));
      for(const r of rows){const v=decodeReport(r).version;if(!known.has(v)){const o=document.createElement('option');o.value=v;o.textContent='Release '+v;version.append(o);known.add(v);}}
    } catch { if(!dead && request===epoch){failure=true;hasMore=true;} }
    finally {if(!dead && request===epoch){busy=false;render();}}
  }
  version.addEventListener('change',render);platform.addEventListener('change',render);
  // Page-lifetime cap includes failed and superseded requests and changes of period.
  period.addEventListener('change',()=>{if(issued>=READ_LIMIT){period.value=activePeriod;status.textContent='Read limit reached. Reload this page to choose another period.';return;}void load(true);});
  more.addEventListener('click',()=>void load());
  void load(true);
  return {destroy(){dead=true;epoch++;root.replaceChildren();}};
}

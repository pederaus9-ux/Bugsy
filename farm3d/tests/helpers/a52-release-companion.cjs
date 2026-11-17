'use strict';
// Inert exact-source specialization; never launches repository code or workflows.
const crypto=require('node:crypto');
const SOURCE_SHA256='2fcc9548474490daf03819395e8811c430d749c5600fd6edc845a5a5919bc78d';
const BRANCH='codex/a52-two-corner-ui-20261117';
const PLAN=Object.freeze([
 ['all_conflicts','conflicts','all',[]],
 ['all_pen_cache','pen_cache','all',[]],
 ['all_recovery_restore','recovery_restore','all',[]],
 ['a35_fixtures_integrity','a35_fixtures_integrity','a35-fixtures-integrity',['all_conflicts','all_pen_cache','all_recovery_restore']],
 ['a38_pen_cache','pen_cache','a38-cache-only',['a35_fixtures_integrity']]
]);
function specialize(source){if(crypto.createHash('sha256').update(source).digest('hex')!==SOURCE_SHA256)throw Error('Source workflow hash mismatch');const parts=source.slice(source.indexOf("jobs:\n")+6).split(/(?=^  [a-z0-9_]+:\n)/m),jobs=new Map();for(const s of parts){const m=s.match(/^  ([a-z0-9_]+):\n/);if(m)jobs.set(m[1],s);}if(jobs.size!==4)throw Error('Source job structure mismatch');let result=`name: Sunny Acres exact-command companion evidence\non:\n  push:\n    branches: ['${BRANCH}']\npermissions:\n  contents: read\nconcurrency:\n  group: a52-release-companion-\${{ github.ref }}\n  cancel-in-progress: false\njobs:\n`;
for(const [id,original,set,needs] of PLAN){let job=jobs.get(original);if(!job)throw Error('Missing source job');job=job.replace('  '+original+':\n','  '+id+':\n').replace(/^(    name: )(.*)$/m,(_,prefix,name)=>prefix+JSON.stringify('['+set+'] '+name));
// Evaluate only dispatch selection semantics; preserve status-function predicates.
job=job.replaceAll('github.event_name',"'workflow_dispatch'").replaceAll('inputs.qualification_set',"'"+set+"'").replaceAll('github.event.pull_request.head.sha || github.sha','github.sha');
job=job.replace(/^    if: \$\{\{ (.*?) \}\}$/m,(_,originalIf)=>`    if: \${{ !cancelled() && github.event_name == 'push' && github.ref == 'refs/heads/${BRANCH}' && (${originalIf}) }}`);
if(needs.length)job=job.replace('    runs-on:',`    needs: [${needs.join(', ')}]\n    runs-on:`);
// Distinct artifacts avoid collision between all and A38 pen-cache jobs.
job=job.replace(/^(          name: )(.*execution-receipts-only)$/m,(_,prefix,name)=>prefix+'companion-'+set+'-'+name);
result+=job;}return result+manualJob(jobs.get('recovery_restore'));}

const MANUAL_OMIT=Object.freeze(['Original 27 recovery checks with bounded quota diagnostic','Preserve recovery evidence before independent emulator reset']);
function manualJob(original){const parts=original.split(/(?=^      - )/m);let removed=0;let job=parts.filter(block=>{if(MANUAL_OMIT.some(name=>block.startsWith('      - name: '+name+'\n'))){removed++;return false;}return true;}).join('');if(removed!==2)throw Error('Manual source step structure mismatch');job=job.replace('  recovery_restore:\n','  independent_manual_restore:\n').replace(/^    name: .*$/m,'    name: Independent exact manual restore (fresh bounded job; not original combined status)').replace(/^    if: .*$/m,`    if: \${{ !cancelled() && github.event_name == 'push' && github.ref == 'refs/heads/${BRANCH}' }}`).replaceAll('github.event.pull_request.head.sha || github.sha','github.sha').replace('name: farm3d-a29-recovery-${{ github.run_attempt }}-execution-receipts-only','name: companion-independent-manual-${{ github.run_attempt }}-execution-receipts-only');return job;}
module.exports={SOURCE_SHA256,BRANCH,PLAN,MANUAL_OMIT,manualJob,specialize};

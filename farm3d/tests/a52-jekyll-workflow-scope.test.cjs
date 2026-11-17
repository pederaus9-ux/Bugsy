'use strict';
const {normalizeA52WorkflowPublication}=require('./helpers/a52-workflow-publication-scope.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {scope,sha,normalizeA52JekyllWorkflow}=require('./helpers/a52-jekyll-workflow-scope.cjs');
const f='.github/workflows/pages-package-validation.yml',root=path.resolve(__dirname,'../..');
test('exact Jekyll replacement normalizes to frozen A52 CI postimage',()=>{const e=scope.files[f];assert.equal(sha(e.before),e.beforeSha256);const old=`      - name: Build using the official GitHub Pages toolchain
        uses: actions/jekyll-build-pages@44a6e6beabd48582f863aeeb6cb2151cc1716697 # v1
        with:
          source: ./
          destination: ./_site
          build_revision: \${{ github.event.pull_request.head.sha }}
`;const next=`      - name: Build using the official GitHub Pages toolchain
        env:
          A52_BUILD_REVISION: \${{ github.event.pull_request.head.sha || github.sha }}
        run: |
          mkdir -p "$RUNNER_TEMP/a52-ci-safe/package"
          node "$GITHUB_WORKSPACE/farm3d/tests/helpers/a52-jekyll-build.cjs" "$GITHUB_WORKSPACE" "$A52_BUILD_REVISION" "$RUNNER_TEMP/a52-ci-safe/package/jekyll-build.json"
`;assert.equal(e.before.split(old).length,2);const exact=e.before.replace(old,next);assert.equal(sha(exact),e.afterSha256);assert.equal(normalizeA52JekyllWorkflow(f,exact),e.before);});
test('unrelated workflow bytes cannot be disguised',()=>{const s=fs.readFileSync(path.join(root,f),'utf8')+'\n# unrelated\n';assert.equal(normalizeA52JekyllWorkflow(f,s),s);assert.equal(normalizeA52JekyllWorkflow('unrelated','x'),'x');});
test('existing source/output assertions remain in preserved preimage',()=>{const s=scope.files[f].before;assert(s.includes('pages-package.verify.cjs --source-only'));assert(s.includes('pages-package.verify.cjs --output _site'));assert(s.includes('contents: read'));assert(s.includes('timeout-minutes: 15'));});

test('live Pages publication outer inverse restores exact Jekyll postimage',()=>{const now=normalizeA52WorkflowPublication(f,fs.readFileSync(path.join(root,f),'utf8'));assert.equal(sha(now),scope.files[f].afterSha256);assert.equal(normalizeA52JekyllWorkflow(f,now),scope.files[f].before);});

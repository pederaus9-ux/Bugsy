import fieldScope from './field-support-scope.cjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),raw=fs.readFileSync(new URL('../fixtures/release-blocker-scope.json',import.meta.url));
assert.equal(sha(raw),'f900182d2ed27b926b1a90d4d940e9bfc8ef48b5588e46e8ef1f8f9cf9848ee4','A38 exact approved scope receipt');const scope=JSON.parse(raw);
export function normalizeReleaseBlockerScope(file,source){source=fieldScope.normalizeFieldScope(file,source);const entry=scope.files[file];assert(entry,'A38 named file');if(sha(source)===entry.beforeSha256)return source;assert.equal(sha(source),entry.afterSha256,'A38 no unknown current edits');for(const h of entry.hunks){assert.equal(source.split(h.after).length,2,'A38 exact unique hunk');source=source.replace(h.after,h.before);}assert.equal(sha(source),entry.beforeSha256,'A38 exact prior bytes');return source;}

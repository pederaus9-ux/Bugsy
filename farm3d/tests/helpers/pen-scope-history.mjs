import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const receiptSha256 = '500bdbdcc4b5c4209d40e57b7d895a0cfed6430d209cf4ff0df9aae607273a84';

// A36 accounts for exact later approvals, never arbitrary version stripping.
export function verifyPenScopeHistory(raw) {
  assert.equal(sha(raw), receiptSha256, 'Approved scope history must remain byte-exact');
}

const raw = fs.readFileSync(new URL('../fixtures/pen-scope-history.json', import.meta.url));
verifyPenScopeHistory(raw);
const history = JSON.parse(raw);

export function normalizePenScope(amendment, source) {
  assert(['A25', 'A26'].includes(amendment), 'Only the two approved historical guards');
  const target = history.targets[amendment];
  for (const key of target.reverse) {
    const change = history.changes[key];
    const currentSha256 = sha(source);
    for (const hunk of change.hunks) {
      assert(hunk.after && hunk.after !== hunk.before, 'A real approved hunk is required');
      assert.equal(source.split(hunk.after).length, 2, 'Approved later hunk must match exactly once');
      source = source.replace(hunk.after, hunk.before);
    }
    assert.equal(currentSha256, change.afterSha256, 'No unknown edits in the accepted postimage');
    assert.equal(sha(source), change.beforeSha256, 'Reconstruction must equal the immutable preimage');
  }
  assert.equal(sha(source), target.sha256, 'Historical postimage must reconstruct byte-for-byte');
  return source;
}

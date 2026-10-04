// Phase 7H: release/cache version consistency. A release bumps "?v=" numbers by hand in several places; if they drift,
// phones keep running an old file from the offline cache. These checks fail the build instead.
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const dir = new URL("../", import.meta.url);
const read = (f) => readFileSync(new URL(f, dir), "utf8");
const html = read("index.html"), sw = read("sw.js");
const shell = JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
const versionedImports = source => [...source.matchAll(/["'(](?:\.\/)?((?:[a-z0-9-]+\/)*[a-z0-9-]+\.js)\?v=(\d+)["')]/gi)].map(m => ({file: m[1], v: +m[2]}));
const imports = versionedImports(html);

test("nested authored module versions cannot evade the cache consistency check", () => {
  const nested = versionedImports("import('./art/authored-hands.js?v=2'); import './game.js?v=25';");
  assert.deepEqual(nested, [{file:'art/authored-hands.js',v:2},{file:'game.js',v:25}]);
  const cached = 'art/authored-hands.js?v=1', [file,v] = cached.split('?v=');
  assert.notEqual(nested.find(i=>i.file===file).v,+v,'a nested stale cached version is detected');
});

test("every versioned script is imported with one version only", () => {
  const seen = {};
  for (const {file, v} of imports) { seen[file] = seen[file] || new Set(); seen[file].add(v); }
  for (const [file, vs] of Object.entries(seen)) assert.equal(vs.size, 1, `${file} is loaded with several versions: ${[...vs].join(", ")}`);
  assert.ok(seen["game.js"] && seen["auth.js"] && seen["friends.js"], "game.js, auth.js and friends.js are versioned");
});

test("window.__gameVer matches the game.js version it imports", () => {
  const m = html.match(/game\.js\?v=(\d+)"\)?;\s*window\.__gameVer = (\d+)/);
  assert.ok(m, "game.js import and __gameVer sit together");
  assert.equal(+m[1], +m[2]);
});

test("the offline shell caches the same versions the page imports", () => {
  for (const entry of shell.filter(s => /\.js\?v=\d+$/.test(s))) {
    const [file, v] = entry.split("?v=");
    const used = imports.find(i => i.file === file);
    assert.ok(used, `sw.js caches ${entry} but index.html doesn't import ${file}`);
    assert.equal(+v, used.v, `sw.js caches ${file}?v=${v} but index.html imports ?v=${used.v}`);
  }
});

test("the cache name is versioned and namespaced away from the 2D game", () => {
  assert.match(sw, /const CACHE = "sa3d-v\d+";/);
});

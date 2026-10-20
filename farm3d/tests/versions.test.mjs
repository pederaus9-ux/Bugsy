// Phase 7H: release/cache version consistency. A release bumps "?v=" numbers by hand in several places; if they drift,
// phones keep running an old file from the offline cache. These checks fail the build instead.
import {test} from "node:test";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import {readFileSync} from "node:fs";

const dir = new URL("../", import.meta.url);
const read = (f) => readFileSync(new URL(f, dir), "utf8");
const html = read("index.html"), sw = read("sw.js");
const shell = JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
const versionedImports = source => [...source.matchAll(/["'(](?:\.\/)?((?:[a-z0-9-]+\/)*[a-z0-9-]+\.js)\?v=(\d+)["')]/gi)].map(m => ({file: m[1], v: +m[2]}));
function localBootGraph(){
 const modules=[],seen=new Set();
 function visit(url){const key=fileURLToPath(url)+url.search;if(seen.has(key))return;seen.add(key);const source=readFileSync(url,'utf8'),entry=url.pathname.slice(dir.pathname.length)+url.search;modules.push({entry,source});for(const m of source.matchAll(/\b(?:from|import)\s*(?:\(\s*)?["'](\.{1,2}\/[^"']+\.js(?:\?[^"']*)?)["']/g))visit(new URL(m[1],url));}
 const page=new URL('index.html',dir);for(const m of html.matchAll(/\b(?:from|import)\s*(?:\(\s*)?["'](\.{1,2}\/[^"']+\.js(?:\?[^"']*)?)["']/g))visit(new URL(m[1],page));
 for(const m of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+\.js(?:\?[^"']*)?)["']/g))if(!/^https?:/.test(m[1]))visit(new URL(m[1],page));
 return modules;
}
const bootGraph=localBootGraph();
const imports = [...versionedImports(html), ...bootGraph.flatMap(m=>versionedImports(m.source))];

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
test('chicken dependencies of both the page and game rules are cached offline',()=>{
  for(const file of ['chicken-care.js','chicken-yard.js']){
    const used=imports.find(i=>i.file===file);assert.ok(used,file+' is used by the candidate');
    assert.ok(shell.includes(file+'?v='+used.v),file+' must be available on offline reboot');
  }
});

// A saved shell must include transitive local modules, not just top-level files.
// The native offline trace failed specifically on the omitted composer imports.
test('offline shell contains the complete local JavaScript boot graph',()=>{
 const missing=bootGraph.map(m=>m.entry).filter(entry=>!shell.includes(entry));
 assert.deepEqual(missing.sort(),[],'offline startup modules missing from installed shell');
 for(const name of ['EffectComposer','RenderPass','UnrealBloomPass','OutputPass','ShaderPass'])assert.ok(shell.includes('lib/addons/postprocessing/'+name+'.js'),name+' is required by the real offline failure trace');
});

test('native scene-polish fixture imports the same scenery version as the page',()=>{const probe=read('tests/scene-polish.browser.cjs'),runtime=imports.find(i=>i.file==='phase7m.js');const tested=versionedImports(probe).filter(i=>i.file==='phase7m.js');assert(tested.length>0);for(const x of tested)assert.equal(x.v,runtime.v,'native fixture loads a second stale scenery module');});

// Static checks for the sound-polish pass: new procedural sounds, volume settings and their hooks in game.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const probe = readFileSync(new URL('./audio-native-probe.js', import.meta.url), 'utf8');
const soundsBlock = src.slice(src.indexOf('const SOUNDS = {'), src.indexOf('const BUZZ ='));

test('new procedural sounds are defined (no audio files)', () => {
  for (const name of ['milk', 'shear', 'brush', 'egg', 'gate', 'rooster', 'owl', 'cricket'])
    assert.match(soundsBlock, new RegExp('\\n  ' + name + ':\\(\\) =>'), name);
  assert.doesNotMatch(src, /\.(mp3|ogg|wav|m4a)\b/);
});

test('volume settings default to full and old saves stay compatible', () => {
  assert.match(src, /export const snd = \{on:true, music:true, amb:true, buzz:true, vol:1, musicVol:1, ambVol:1\};/);
  assert.match(src, /for \(const k of \["vol", "musicVol", "ambVol"\]\) \{ const v = Number\(snd\[k\]\); snd\[k\] = Number\.isFinite\(v\) \? clamp\(v, 0, 1\) : 1; \}/);
  // the gains keep the original loudness at volume 1 and the hidden-tab gate
  assert.match(src, /master\.gain\.value = snd\.on && !document\.hidden \? 0\.55 \* snd\.vol : 0;/);
  assert.match(src, /musicBus\.gain\.value = snd\.music \? 0\.22 \* snd\.musicVol : 0;/);
  assert.match(src, /ambBus\.gain\.value = snd\.ambVol;/);
});

test('loader normalises bad saved volumes', () => {
  const snd = {on:true, vol:'x', musicVol:7, ambVol:-1};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  for (const k of ['vol', 'musicVol', 'ambVol']) { const v = Number(snd[k]); snd[k] = Number.isFinite(v) ? clamp(v, 0, 1) : 1; }
  assert.deepEqual([snd.vol, snd.musicVol, snd.ambVol], [1, 1, 0]);
  const old = {on:false}; for (const k of ['vol', 'musicVol', 'ambVol']) { const v = Number(old[k]); old[k] = Number.isFinite(v) ? clamp(v, 0, 1) : 1; }
  assert.equal(old.vol, 1, 'a missing key is NaN, so it falls back to 1');
});

test('settings show three volume sliders that save to the existing sound key', () => {
  for (const k of ['vol', 'musicVol', 'ambVol']) assert.match(src, new RegExp('data-vol="' + k + '"'));
  assert.match(src, /document\.addEventListener\("change", \(e\) => \{ const k = e\.target\?\.dataset\?\.vol;[^\n]*saveSound\(\)/);
});

test('new sounds are wired to existing actions', () => {
  assert.match(src, /sfx\('milk'\);sfx\('cow'\);/);
  assert.match(src, /sfx\('egg'\);sfx\('chicken'\);/);
  assert.match(src, /if \(kind === "sheep"\) sfx\("shear"\);/);
  assert.match(src, /if \(act === "brush"\) sfx\("brush"\);/);
  assert.match(src, /sfxAt\("owl"/);
  assert.match(src, /sfxAt\("rooster"/);
  assert.match(src, /surface === "stone"/);
  assert.match(src, /surface === "puddle"/);
});

test('native probe exposes bus gains and saved sound settings', () => {
  assert.match(probe, /probe\.buses=/);
  assert.match(probe, /probe\.savedSound=/);
});

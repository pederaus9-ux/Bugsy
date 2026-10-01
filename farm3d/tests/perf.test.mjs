import test from "node:test";
import assert from "node:assert/strict";
import {FrameWindow, renderMeasured, createPerfMonitor} from "../perf.js";

test("frame intervals: empty, median, nearest-rank p95 and foreground hitch", () => {
  const frames = new FrameWindow();
  assert.deepEqual(frames.summary(0), {samples:0, fps:null, median:null, p95:null, worst:null});
  [0, 10, 30, 60, 100].forEach(t => frames.add(t));
  assert.deepEqual(frames.summary(100), {samples:4, fps:40, median:25, p95:40, worst:40});
  frames.add(3100);
  assert.equal(frames.summary(3100).worst, 3000);
  assert.equal(frames.summary(3100).fps, 1000 / 3000);
});

test("rolling windows expire old frames and retain bounded ring data", () => {
  const frames = new FrameWindow(3);
  [0, 10, 30, 60, 100].forEach(t => frames.add(t));
  assert.deepEqual(frames.summary(100), {samples:3, fps:100 / 3, median:30, p95:40, worst:40});
  frames.add(5200);
  assert.deepEqual(frames.summary(5200), {samples:1, fps:1000 / 5100, median:5100, p95:5100, worst:5100});
  assert.equal(frames.summary(10201).samples, 0);
});

test("pause reset excludes resume gap; rendered intervals reflect a 30 FPS cap", () => {
  const frames = new FrameWindow();
  [0, 33, 66].forEach(t => frames.add(t));
  assert.equal(frames.summary(66).fps, 1000 / 33);
  frames.reset(); frames.add(90000);
  assert.equal(frames.summary(90000).samples, 0);
  frames.add(90016);
  assert.equal(frames.summary(90016).worst, 16);
});

test("p95 uses nearest rank across 20 distinct intervals", () => {
  const frames = new FrameWindow(); let t = 0; frames.add(t);
  for (let i = 1; i <= 20; i++) { t += i; frames.add(t); }
  assert.equal(frames.summary(t).p95, 19);
  assert.equal(frames.summary(t).median, 10.5);
});

test("composer counters include every pass and restore reset policy", () => {
  const info = {autoReset:true, render:{calls:99, triangles:99}, reset() { this.render.calls = this.render.triangles = 0; }};
  const renderer = {info};
  renderMeasured(renderer, {render() {
    for (const triangles of [1000, 2, 2, 2]) {
      if (info.autoReset) info.reset();
      info.render.calls++; info.render.triangles += triangles;
    }
  }});
  assert.deepEqual(info.render, {calls:4, triangles:1006});
  assert.equal(info.autoReset, true);
  info.autoReset = false;
  assert.throws(() => renderMeasured(renderer, {render() { throw Error("render failed"); }}));
  assert.equal(info.autoReset, false);
});

test("display throttles updates, resets visibility gaps and remains collapsible", () => {
  const elements = [], events = {}, writes = {count:0};
  const make = () => {
    let content = "";
    const el = {hidden:false, attrs:{}, listeners:{}, append() {},
      setAttribute(k,v) { this.attrs[k] = v; }, addEventListener(k,v) { this.listeners[k] = v; }};
    Object.defineProperty(el, "textContent", {get:()=>content, set:v=>{content=v; writes.count++;}});
    elements.push(el); return el;
  };
  const previous = {};
  for (const key of ["document", "innerWidth", "innerHeight", "devicePixelRatio"]) previous[key] = Object.getOwnPropertyDescriptor(globalThis,key);
  Object.assign(globalThis, {document:{hidden:false, createElement:make, head:{append() {}}, body:{append() {}}, addEventListener:(k,v)=>events[k]=v}, innerWidth:740, innerHeight:360, devicePixelRatio:3});
  try {
    const renderer = {getPixelRatio:()=>1, info:{render:{calls:32,triangles:1000},memory:{geometries:10,textures:4}}};
    const monitor = createPerfMonitor(renderer, {}, ()=>({baseDPR:2,shadow:"1024×1024",bloom:false,tilt:"off",mode:"classic"}));
    monitor.record(0); monitor.record(33); monitor.update(33);
    const body = elements.find(el=>el.id==="saPerfMetrics");
    assert.match(body.textContent,/FPS \(1s\) 30.3/);
    assert.match(body.textContent,/Scale 50% \| render DPR 1.0/);
    const count = writes.count; monitor.update(100); monitor.update(532);
    assert.equal(writes.count,count); monitor.update(533); assert.equal(writes.count,count+1);
    document.hidden=true; events.visibilitychange(); monitor.record(90000);
    document.hidden=false; events.visibilitychange(); monitor.record(100000); monitor.update(100000);
    assert.match(body.textContent,/frames \(5s\) 0/);
    monitor.record(100016); monitor.update(100500); assert.match(body.textContent,/Worst \(5s\) 16.0/);
    const toggle = elements.find(el=>el.attrs["aria-controls"]==="saPerfMetrics");
    toggle.listeners.click(); assert.equal(body.hidden,true); assert.equal(toggle.attrs["aria-expanded"],"false");
    toggle.listeners.click(); assert.equal(body.hidden,false);
    monitor.pause(); monitor.record(200000); monitor.update(200000); assert.match(body.textContent,/frames \(5s\) 0/);
  } finally {
    for (const key of Object.keys(previous)) { if (previous[key]) Object.defineProperty(globalThis,key,previous[key]); else delete globalThis[key]; }
  }
});

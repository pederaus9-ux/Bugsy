// Optional local diagnostics. Loaded only by ?perf; never saves or uploads data.
const WINDOW_MS = 5000, FPS_MS = 1000, CAPACITY = 1200;

export class FrameWindow {
  constructor(capacity = CAPACITY) {
    this.times = new Float64Array(capacity);
    this.deltas = new Float64Array(capacity);
    this.sorted = [];
    this.reset();
  }
  reset() { this.head = 0; this.count = 0; this.last = null; }
  add(now) {
    if (this.last !== null && now > this.last) {
      this.times[this.head] = now;
      this.deltas[this.head] = now - this.last;
      this.head = (this.head + 1) % this.times.length;
      this.count = Math.min(this.count + 1, this.times.length);
    }
    this.last = now;
  }
  summary(now) {
    const values = this.sorted; values.length = 0;
    let fpsCount = 0, fpsTime = 0;
    for (let i = 0; i < this.count; i++) {
      const slot = (this.head - 1 - i + this.times.length) % this.times.length;
      const age = now - this.times[slot];
      if (age > WINDOW_MS) break;
      const delta = this.deltas[slot]; values.push(delta);
      if (age <= FPS_MS) { fpsCount++; fpsTime += delta; }
    }
    values.sort((a, b) => a - b);
    const n = values.length, middle = Math.floor(n / 2);
    return {
      samples: n, fps: fpsTime ? fpsCount * 1000 / fpsTime : null,
      median: n ? (n % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2) : null,
      p95: n ? values[Math.ceil(n * .95) - 1] : null,
      worst: n ? values[n - 1] : null
    };
  }
}

// Count all composer passes (including shadow/bloom/blur draws), then restore
// three.js's normal reset policy even if rendering throws.
export function renderMeasured(renderer, composer) {
  const info = renderer.info, autoReset = info.autoReset;
  info.reset(); info.autoReset = false;
  try { composer.render(); } finally { info.autoReset = autoReset; }
}

export function createPerfMonitor(renderer, composer, readState) {
  const frames = new FrameWindow();
  const style = document.createElement("style");
  style.textContent = `
    #saPerf { position:fixed; z-index:19; top:calc(env(safe-area-inset-top, 0px) + 60px);
      left:50%; transform:translateX(-50%); width:min(310px, calc(100vw - 24px));
      color:#f6fff3; background:rgba(16,29,24,.92); border:1px solid #8ba596;
      border-radius:8px; font:12px/1.45 ui-monospace,monospace; pointer-events:none;
      padding:7px 10px; box-sizing:border-box; }
    #saPerf button { pointer-events:auto; color:inherit; background:transparent;
      border:0; font:inherit; cursor:pointer; min-height:28px; width:100%; text-align:left; }
    #saPerf pre { margin:3px 0 0; font:inherit; white-space:pre-wrap; }
    #saPerf pre[hidden] { display:none; }
  `;
  document.head.append(style);
  const panel = document.createElement("aside"); panel.id = "saPerf";
  panel.setAttribute("aria-label", "Local performance diagnostics");
  const toggle = document.createElement("button"); toggle.type = "button";
  toggle.textContent = "Performance ▾"; toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-controls", "saPerfMetrics");
  const body = document.createElement("pre"); body.id = "saPerfMetrics";
  body.textContent = "Collecting rendered frames…";
  toggle.addEventListener("click", () => {
    body.hidden = !body.hidden;
    toggle.setAttribute("aria-expanded", String(!body.hidden));
    toggle.textContent = body.hidden ? "Performance ▸" : "Performance ▾";
  });
  panel.append(toggle, body); document.body.append(panel);
  let nextUpdate = 0;
  const pause = () => { frames.reset(); nextUpdate = 0; };
  document.addEventListener("visibilitychange", pause);
  const number = (n) => n === null ? "—" : n.toFixed(1);
  return {
    pause,
    record(now) { if (document.hidden) pause(); else frames.add(now); },
    render() { renderMeasured(renderer, composer); },
    update(now) {
      if (document.hidden || now < nextUpdate) return;
      nextUpdate = now + 500;
      const s = frames.summary(now), state = readState(), info = renderer.info;
      const ratio = renderer.getPixelRatio();
      body.textContent = [
        `FPS (1s) ${number(s.fps)} | frames (5s) ${s.samples}`,
        `ms median ${number(s.median)} | p95 ${number(s.p95)}`,
        `Worst (5s) ${number(s.worst)} ms`,
        `Scale ${Math.round(ratio / state.baseDPR * 100)}% | render DPR ${number(ratio)}`,
        `Calls ${info.render.calls} | tris ${info.render.triangles.toLocaleString("en-US")}`,
        `Geometries ${info.memory.geometries} | textures ${info.memory.textures}`,
        `Shadows ${state.shadow} | bloom ${state.bloom ? "on" : "off"}`,
        `Tilt ${state.tilt} | ${state.mode}`,
        `Viewport ${innerWidth}×${innerHeight} | device DPR ${number(devicePixelRatio)}`
      ].join("\n");
    }
  };
}

const {chromium}=require('playwright'); const fs=require('fs');
const shots = {
  front_left:  [-5.0, 1.5, -6.4, 0, 0.55, 0.2, 30],
  front:       [0, 1.25, -8.2, 0, 0.6, 0, 26],
  left:        [-9.0, 1.0, 0, 0, 0.62, 0, 25],
  right:       [9.0, 1.0, 0, 0, 0.62, 0, 25],
  rear_right:  [5.2, 1.9, 6.4, 0, 0.6, -0.2, 30],
  rear:        [0, 1.6, 8.4, 0, 0.7, 0, 26],
  top:         [0, 12, 0, 0, 0, 0, 30, 1, 0, 0],
};
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1600,height:900}});
p.on('pageerror',e=>console.log('pageerror',e.message));
await p.goto('http://localhost:8765/render.html'); await p.waitForFunction(()=>window.READY,null,{timeout:180000});
const only=process.argv.slice(2);
for (const [k,v] of Object.entries(shots)) { if (only.length && !only.includes(k)) continue;
  const url=await p.evaluate(a=>window.shot(...a), v);
  fs.writeFileSync('shot_'+k+'.png', Buffer.from(url.split(',')[1],'base64')); console.log('shot',k); }
await b.close();})();

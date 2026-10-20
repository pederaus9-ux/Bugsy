import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('native page installs one connection after motion, updates after current hand poses, and precaches the dependency',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.equal((html.match(/import \{installArmAttachment\} from "\.\/player-arm-attachment\.js\?v=1";/g)||[]).length,1);
 assert.equal((html.match(/const armAttachment = installArmAttachment\(/g)||[]).length,1);
 assert.ok(html.indexOf('const armAttachment =')>html.indexOf('const playerMotion ='));
 assert.match(html,/updateHands\(dt, t, tk\); playerMotion\.update\(dt, t\); updateDoors\(dt\); armAttachment\.update\(\)/);
 const shell=JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1]);assert.equal(shell.filter(p=>p==='player-arm-attachment.js?v=1').length,1);assert.match(sw,/const CACHE = "sa3d-v53"/);
 assert.doesNotMatch(html,/__armCapture|__armHold|__playerMotion|playablePreview/);
});

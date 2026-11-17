'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {normalize:cache}=require('./a52-cache-progress-scope.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function load(name,pin){const b=fs.readFileSync(path.join(__dirname,'../fixtures',name));if(sha(b)!==pin)throw Error('Ordinary diagnostic scope mismatch');return JSON.parse(b);}
const auth=load('a52-authanalytics-progress-scope.json','020bb3241eaa7ed6277af4e657b7ee3639f22c40cb75152c0f1b456a4f20c81b'),chars=load('a52-character-script-scope.json','0a795ddb6eda572341acd637c29cbfa8dfc2576453ffaedb8a1b3629ee2befef');
function normalize(file,input){file=file.startsWith('farm3d/')?file:'farm3d/'+file;input=cache(file,input);const a=auth.files[file.replace(/^farm3d\/tests\//,'')],e=chars.files[file];let text=input.toString();if(a&&sha(input)===a.afterSha256){for(const h of [...a.additions].reverse()){if(text.split(h.after).length!==2)throw Error('Nonunique diagnostic inverse');text=text.replace(h.after,h.before);}if(text!==a.before||sha(text)!==a.beforeSha256)throw Error('Authanalytics predecessor mismatch');}else if(e&&sha(input)===e.afterSha256){if(!text.startsWith(e.prefix))throw Error('Character prefix mismatch');text=text.slice(e.prefix.length);if(sha(text)!==e.beforeSha256)throw Error('Character predecessor mismatch');}else return input;return Buffer.isBuffer(input)?Buffer.from(text):text;}
module.exports={normalize,auth,chars,sha};

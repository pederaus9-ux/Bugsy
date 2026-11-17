'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const before=fs.readFileSync(path.join(__dirname,'../fixtures/a52-boundary-main-index.txt')),after=fs.readFileSync(path.join(__dirname,'../fixtures/a53-final-runtime-index.txt'));
if(sha(before)!=='40a2bbcef45e5a29f463768937ef849a8aff53075d7820fba613d5064e5a294c'||sha(after)!=='6ed974f5d0571ef070d50fa81d0f30c8b840f5f283e5a75e46fc8d424225131b')throw Error('Exact candidate input mismatch');
function patch(b){if(!Buffer.from(b).equals(before))throw Error('preimage');return Buffer.from(after);}
function inverse(b){if(!Buffer.from(b).equals(after))throw Error('postimage');return Buffer.from(before);}
module.exports={patch,inverse};

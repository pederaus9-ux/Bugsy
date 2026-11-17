'use strict';
const crypto=require('node:crypto'),candidate=require('./social-candidate.cjs'),telemetry=require('./integration-telemetry.cjs'),recovery=require('./recovery-telemetry.cjs'),social=require('./social-telemetry.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const provenance={"path":"farm3d/index.html","preimageSha256":"40a2bbcef45e5a29f463768937ef849a8aff53075d7820fba613d5064e5a294c","candidateSha256":"95f54aaea8b9720225a444451d2262d7ab9540e8ad91de5490879c455017c9df","postimageSha256":"67bed724fc3140ed4b993671acee39bc42d93954a4c47194277e1a1ca654029e","postimageBlob":"e16687cefb849bdecb904ca293957f96917abfc3"};
function patch(b){if(sha(b)!==provenance.preimageSha256)throw Error('preimage');const c=candidate.patch(b);if(sha(c)!==provenance.candidateSha256)throw Error('candidate hash');const p=social.decorate(recovery.decorate(telemetry.decorate(c)));if(sha(p)!==provenance.postimageSha256)throw Error('instrumented hash');return p;}
function inverse(b){if(sha(b)!==provenance.postimageSha256)throw Error('postimage');return candidate.inverse(telemetry.strip(recovery.strip(social.strip(b))));}
module.exports={patch,inverse,validate:telemetry.validate,validateRecovery:recovery.validate,validateSocial:social.validate,provenance};

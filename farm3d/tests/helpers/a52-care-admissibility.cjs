'use strict';
const crypto=require('node:crypto'),candidate=require('./integration.cjs'),telemetry=require('./integration-telemetry.cjs'),recovery=require('./recovery-telemetry.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const provenance={"path":"farm3d/index.html","preimageSha256":"40a2bbcef45e5a29f463768937ef849a8aff53075d7820fba613d5064e5a294c","candidateSha256":"dd77493b8f9446bf46d5ba5af2bd036b93d8de93e750f371c0bc017ec68b5d4c","postimageSha256":"256b6d9cc527ebd0dbff11fcb743f63c48fdbb452284034004972d7aff95d4fc","postimageBlob":"4cec5d87b6418272b415dd07a2217698a87678ee"};
function patch(b){if(sha(b)!==provenance.preimageSha256)throw Error('preimage');const c=candidate.patch(b);if(sha(c)!==provenance.candidateSha256)throw Error('candidate hash');const p=recovery.decorate(telemetry.decorate(c));if(sha(p)!==provenance.postimageSha256)throw Error('instrumented hash');return p;}
function inverse(b){if(sha(b)!==provenance.postimageSha256)throw Error('postimage');return candidate.inverse(telemetry.strip(recovery.strip(b)));}
module.exports={patch,inverse,validate:telemetry.validate,validateRecovery:recovery.validate,provenance};

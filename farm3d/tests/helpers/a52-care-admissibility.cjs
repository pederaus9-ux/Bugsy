'use strict';
const crypto=require('node:crypto'),candidate=require('./candidate.cjs'),telemetry=require('./telemetry.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const provenance={path:'farm3d/index.html',preimageSha256:candidate.preimageSha256,candidateSha256:'28d210c47d6d5f71482b50a5af09b2fe8d13bc23d217401b982e4ac3f2610756',postimageSha256:'5858b7a1163eab949eead0c9ed7bb19fe0147386911170a18b052b4b87d1a8ef',postimageBlob:'1b13788808a453ede92324389922f4879d156a7b'};
function patch(b){const c=candidate.patch(b);if(sha(c)!==provenance.candidateSha256)throw Error('candidate hash');const p=telemetry.decorate(c);if(sha(p)!==provenance.postimageSha256)throw Error('instrumented hash');return p;}
function inverse(b){if(sha(b)!==provenance.postimageSha256)throw Error('postimage');return candidate.inverse(telemetry.strip(b));}
module.exports={patch,inverse,validate:telemetry.validate,provenance};

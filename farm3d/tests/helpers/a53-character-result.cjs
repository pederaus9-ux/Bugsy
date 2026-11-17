'use strict';
const fs=require('node:fs'),path=require('node:path');
const {validReceipt}=require('./ci-isolated-runner.cjs'),{validDiagnostic,validWalkDiagnostic}=require('./a52-workflow-receipts.cjs');
function validate(receipt,lifecycle,walk){
 if(!validReceipt(receipt)||!receipt.isolationVerified||!receipt.cleanupVerified||!receipt.commandStarted)throw Error('Character receipt rejected');
 if(lifecycle!==null&&!validDiagnostic('farm3d-regression/characters-polish',lifecycle))throw Error('Character lifecycle rejected');
 if(walk!==null&&!validWalkDiagnostic(walk))throw Error('Walk evidence rejected');
 if(receipt.status==='passed'){
  if(receipt.exitCode!==0||receipt.signal!==null||!receipt.commandResultAvailable||!lifecycle||lifecycle.scripts.some(s=>s.state!=='passed'||s.exitCode!==0)||!walk||walk.state!=='completed'||walk.cleanup!=='completed'||!walk.stride||walk.stride.samples<1||walk.stride.mismatches!==0)throw Error('Successful character command lacks complete phase proof');
 }
 return true;
}
function read(file,required){if(!fs.existsSync(file)){if(required)throw Error('Missing character receipt');return null;}const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>16384||fs.realpathSync(file)!==path.resolve(file))throw Error('Character file rejected');return JSON.parse(fs.readFileSync(file));}
function main(dir){dir=path.resolve(dir);if(fs.realpathSync(dir)!==dir||!fs.lstatSync(dir).isDirectory())throw Error('Character directory rejected');return validate(read(path.join(dir,'step-1.json'),true),read(path.join(dir,'diagnostic.json'),false),read(path.join(dir,'walk-phase.json'),false));}
module.exports={validate,main};if(require.main===module){try{if(process.argv.length!==3)throw Error();main(process.argv[2]);}catch{process.stderr.write('Character completion evidence rejected\n');process.exitCode=1;}}

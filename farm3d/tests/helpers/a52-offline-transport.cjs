'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-offline-transport-scope.json'));
if(sha(raw)!=='5866184ffac9cae3c09690e3998668adb51948e60859314aded8fc1300cb2d34')throw Error('Offline transport scope mismatch');
const scope=JSON.parse(raw);
function normalizeA52OfflineTransport(file,input){const e=scope.files[file];if(!e||sha(input)!==e.afterSha256)return input;if(sha(e.before)!==e.beforeSha256)throw Error('Offline transport predecessor mismatch');return Buffer.isBuffer(input)?Buffer.from(e.before):e.before;}
function createOwnedServerStop(sockets,failure){
 const stops=new WeakMap();
 return function stop(server){
  if(stops.has(server))return stops.get(server);
  const operation=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(failure()),5000);
   try{
    const closed=new Promise((yes,no)=>server.close(error=>error&&error.code!=='ERR_SERVER_NOT_RUNNING'?no(failure()):yes()));
    const socketCloses=[...(sockets.get(server)||[])].map(socket=>new Promise(yes=>{socket.once('close',yes);socket.destroy();}));
    server.closeAllConnections?.();
    Promise.all([closed,...socketCloses]).then(()=>{
     if(server.listening||(sockets.get(server)?.size||0)!==0)throw failure();
     resolve();
    },()=>{throw failure();}).catch(()=>reject(failure())).finally(()=>clearTimeout(timer));
   }catch{clearTimeout(timer);reject(failure());}
  });stops.set(server,operation);return operation;
 };
}
const sdkNames={'firebase-app.js':'firebaseApp','firebase-auth.js':'firebaseAuth','firebase-firestore.js':'firebaseFirestore'};
function sdkCategory(url){
 try{const u=new URL(url);if(u.origin==='https://www.gstatic.com'&&!u.search&&!u.hash&&u.pathname.startsWith('/firebasejs/12.19.0/'))return sdkNames[u.pathname.slice('/firebasejs/12.19.0/'.length)]||'other';}catch{}
 return 'other';
}
function createOfflineTransport(server,sockets,stop){
 let offline=false,serverClosed=false;
 const externalAborts={firebaseApp:0,firebaseAuth:0,firebaseFirestore:0,other:0};
 const observedDisconnected={firebaseApp:0,firebaseAuth:0,firebaseFirestore:0,other:0};
 return {
  active(){return offline;},
  async enter(){offline=true;await stop(server);serverClosed=!server.listening&&(sockets.get(server)?.size||0)===0;if(!serverClosed)throw Error('Offline server closure not proven');},
  async abortExternal(route,url){if(!offline)throw Error('Offline route used while online');externalAborts[sdkCategory(url)]++;return route.abort('internetdisconnected');},
  observeFailure(url,error){if(offline&&error==='net::ERR_INTERNET_DISCONNECTED')observedDisconnected[sdkCategory(url)]++;},
  snapshot(){return {serverClosed,activeOwnedSockets:sockets.get(server)?.size||0,externalAborts:{...externalAborts},observedDisconnected:{...observedDisconnected}};}
 };
}
module.exports={createOwnedServerStop,createOfflineTransport,sdkCategory,normalizeA52OfflineTransport,scope,sha};

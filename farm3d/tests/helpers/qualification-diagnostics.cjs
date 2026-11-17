'use strict';
// Diagnostic-only boundary: never format untrusted browser text, URLs or errors.
// Category labels are internal constants; suppressing details also handles encoded,
// escaped and chunk-split credentials without embedding any historical secret.
const categories=new Set(['CDP message','CDP protocol error','CDP timeout','CDP send','Runtime evaluation','Condition timeout','Chrome launch','Chrome stderr','Chrome unavailable','Runtime exception','Request isolation']);
function withheld(category){return (categories.has(category)?category:'Diagnostic')+': details withheld';}
function requestLabel(){return '[request URL withheld]';}
function localGit(ref,file,root,exec=require('node:child_process').execFileSync){
 try{return exec('git',['--no-lazy-fetch','-c','protocol.allow=never','show',ref+':'+file],{cwd:root,maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe'],env:{...process.env,GIT_ALLOW_PROTOCOL:'',GIT_NO_LAZY_FETCH:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_TERMINAL_PROMPT:'0'}});}catch{throw new Error(withheld('Git source'));}
}
// Defense in depth only. Required kernel no-egress isolation remains external.
function rejectingProxy(http){
 const server=http.createServer((_req,res)=>{res.writeHead(403);res.end();});
 server.on('connect',(_req,socket)=>socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'));
 server.on('upgrade',(_req,socket)=>socket.destroy());return server;
}
module.exports={withheld,requestLabel,localGit,rejectingProxy};

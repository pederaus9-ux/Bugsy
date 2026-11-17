'use strict';
// Test-only diagnostic boundary. Never copy browser error text, source, URLs or
// causes into a replacement Error. Successful game values and serialized page
// functions stay untouched; this is not a sanitizer for arbitrary caller data.
const apiTypes=new Set(['Browser','BrowserContext','Page','Frame','Locator','FrameLocator','JSHandle','ElementHandle','Worker','CDPSession','Keyboard','Mouse','Touchscreen','Download','Dialog','FileChooser','Request','Response','Route','ConsoleMessage','Tracing','Video','Coverage','APIRequestContext','APIResponse','Clock','WebSocketRoute','WebSocket']);
const notFound='Failed to load resource: the server responded with a status of 404 (Not Found)';
function diagnosticText(text){
 if(typeof text!=='string')return 'details withheld';
 if(text===notFound)return notFound;
 if(text==='Failed to load resource: net::ERR_INTERNET_DISCONNECTED')return 'Failed to load resource: net::ERR_INTERNET_DISCONNECTED';
 // Preserve the unchanged save7h allowlist, without copying matching input.
 for(const token of ['gstatic','firebase','Failed to load module script','net::ERR','fonts.googleapis'])if(text.toLowerCase().includes(token.toLowerCase()))return token+': details withheld';
 return 'details withheld';
}
function localRequestLabel(url,base){
 try{const u=new URL(url);if(u.origin===new URL(base).origin&&u.pathname==='/farm/icon-192.png')return 'farm/icon-192.png';}catch{}
 return '[request URL withheld]';
}
function failure(){return new Error('Playwright operation: details withheld');}
function protocolResult(result){
 if(result&&Object.hasOwn(result,'exceptionDetails')&&result.exceptionDetails!==undefined){
  return {result:{type:'error',description:'details withheld'},exceptionDetails:{text:'details withheld'}};
 }
 return result;
}
function pausedEvent(value){
 const location=p=>p&&{scriptId:/^\d+$/.test(p.scriptId)?p.scriptId:'[withheld]',lineNumber:Number.isSafeInteger(p.lineNumber)?p.lineNumber:0,columnNumber:Number.isSafeInteger(p.columnNumber)?p.columnNumber:0};
 return {reason:'details withheld',callFrames:Array.isArray(value?.callFrames)?value.callFrames.map(f=>({callFrameId:f.callFrameId,functionName:'[function name withheld]',url:'[source URL withheld]',location:location(f.location)})):[]};
}
function createBoundary(){
 const proxies=new WeakMap(),raws=new WeakMap(),callbacks=new WeakMap();
 function unwrap(value){
  if(raws.has(value))return raws.get(value);
  if(Array.isArray(value)){const items=value.map(unwrap);return items.some((v,i)=>v!==value[i])?items:value;}
  if(value&&Object.getPrototypeOf(value)===Object.prototype){let out;for(const [key,item] of Object.entries(value)){const v=unwrap(item);if(v!==item){out??={...value};out[key]=v;}}return out||value;}
  return value;
 }
 function callback(fn,event){
  if(typeof fn!=='function')return fn;
  let byEvent=callbacks.get(fn);if(!byEvent){byEvent=new Map();callbacks.set(fn,byEvent);}
  if(!byEvent.has(event))byEvent.set(event,function(...args){
   const values=event==='pageerror'?[new Error(diagnosticText(args[0]?.message))]:event==='Debugger.paused'?[pausedEvent(args[0])]:args.map(wrap);
   // User callbacks and assertions retain their own throwing/rejecting behavior.
   return fn.apply(wrap(this),values);
  });
  return byEvent.get(event);
 }
 function wrap(value){
  if(value===null||(typeof value!=='object'&&typeof value!=='function'))return value;
  if(raws.has(value))return value;
  if(Array.isArray(value))return value.map(wrap);
  const type=Object.getPrototypeOf(value)?.constructor?.name;
  if(!apiTypes.has(type))return value;
  if(proxies.has(value))return proxies.get(value);
  const methods=new Map();
  const proxy=new Proxy(value,{get(target,key){
   let member;try{member=Reflect.get(target,key,target);}catch{throw failure();}
   if(typeof member!=='function')return wrap(member);
   if(key==='constructor')return member;
   if(!methods.has(key))methods.set(key,function(...args){
    try{
     if(type==='Tracing'&&['start','startChunk'].includes(key))throw failure();
     if(type==='ConsoleMessage'&&key==='text')return diagnosticText(member.apply(target,args));
     const params=args.map(unwrap);
     if(['on','once','addListener','off','removeListener'].includes(key))params[1]=callback(args[1],args[0]);
     if(['route','unroute','routeWebSocket'].includes(key))params[1]=callback(args[1],'route');
     if(key==='waitForEvent'){
      if(typeof args[1]==='function')params[1]=callback(args[1],args[0]);
      else if(args[1]?.predicate)params[1]={...args[1],predicate:callback(args[1].predicate,args[0])};
     }
     if(['waitForRequest','waitForResponse'].includes(key)&&typeof args[0]==='function')params[0]=callback(args[0],key);
     const finish=result=>wrap(type==='CDPSession'&&key==='send'?protocolResult(result):key==='waitForEvent'&&args[0]==='Debugger.paused'?pausedEvent(result):key==='waitForEvent'&&args[0]==='pageerror'?new Error(diagnosticText(result?.message)):result);
     const result=member.apply(target,params);
     if(result&&typeof result.then==='function')return result.then(finish,()=>{throw failure();});
     return finish(result);
    }catch{throw failure();}
   });
   return methods.get(key);
  }});
  proxies.set(value,proxy);raws.set(proxy,value);return proxy;
 }
 return {wrap};
}
module.exports={createBoundary,diagnosticText,localRequestLabel,failure,protocolResult,pausedEvent};

// Deliberately minimal DOM boundary, not a browser, layout engine, or game fixture.
// Supports only the selectors/event phases used by corner-menu.js and these tests.
import vm from 'node:vm';
export const controlIds=['walkBtn','editBtn','questBtn','photoBtn','settings','soundBtn','friendsBtn','verifiedBtn','orders','barn','decor','shop'];
class Element {
  constructor(tag,doc){this.tagName=tag;this.doc=doc;this.children=[];this.parentNode=null;this.dataset={};this.attrs={};this.listeners={};this.className='';this.hidden=false;this.textContent='';this.open=false;this.classList={add:c=>{this.className+=' '+c;}};}
  append(...nodes){for(const node of nodes){if(node.parentNode)node.parentNode.children.splice(node.parentNode.children.indexOf(node),1);node.parentNode=this;this.children.push(node);}}
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return this.attrs[k]??null;}
  matches(s){if(s.includes(' ')){const parts=s.split(' ');return this.matches(parts.pop())&&!!this.parentNode?.closest(parts.join(' '));}if(s.startsWith('#'))return this.id===s.slice(1);if(s.startsWith('.'))return this.className.split(/\s+/).includes(s.slice(1));if(s.startsWith('[data-p='))return this.dataset.p===s.slice(9,-2);return this.tagName===s;}
  closest(s){return this.matches(s)?this:this.parentNode?.closest(s)||null;}
  querySelectorAll(s){return this.children.flatMap(n=>[...(n.matches(s)?[n]:[]),...n.querySelectorAll(s)]);}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  addEventListener(type,fn,options){(this.listeners[type]??=[]).push({fn,capture:options===true||options?.capture,once:options?.once});}
  emit(type,props={}){const e={type,target:this,clientX:50,clientY:50,stopped:false,defaultPrevented:false,stopPropagation(){this.stopped=true;},preventDefault(){this.defaultPrevented=true;},...props};const path=[];for(let n=this;n;n=n.parentNode)path.push(n);const invoke=(n,capture)=>{for(const l of [...(n.listeners[type]||[])])if(!!l.capture===capture){l.fn(e);if(l.once)n.listeners[type].splice(n.listeners[type].indexOf(l),1);}};for(const n of [...path].reverse()){invoke(n,true);if(e.stopped)return e;}for(const n of path){invoke(n,false);if(e.stopped)break;}return e;}
  showModal(){this.open=true;}
  close(){this.open=false;this.emit('close');}
  getBoundingClientRect(){return {left:10,right:90,top:10,bottom:90};}
}
export function fixture({missing,dialogSupport=true,readyState='loading'}={}){
 const doc=new Element('document');doc.doc=doc;doc.readyState=readyState;doc.createElement=tag=>{const n=new Element(tag,doc);if(!dialogSupport&&tag==='dialog'){n.showModal=undefined;n.close=undefined;}return n;};doc.getElementById=id=>doc.querySelector('#'+id);
 const side=doc.createElement('div'),dock=doc.createElement('div');side.className='side';dock.className='dock';if(missing!=='.side')doc.append(side);if(missing!=='.dock')doc.append(dock);
 const controls=new Map();for(const [i,id] of controlIds.entries()){if(id===missing)continue;const b=doc.createElement('button');if(['settings','orders','barn','decor','shop'].includes(id))b.dataset.p=id;else b.id=id;if(id==='verifiedBtn')b.hidden=true;(i<8?side:dock).append(b);controls.set(id,b);}
 const observers=[];class Observer{constructor(fn){this.fn=fn;}observe(target,options){observers.push({target,options,fn:this.fn});}}
 return {doc,side,dock,controls,observers,Observer,flush(){for(const o of observers)o.fn();}};
}
export function load(source,f,{automatic=false}={}){
 // Only remove the export declaration for the Node VM script boundary. No production edits.
 if(!source.includes('export function installCornerMenus'))throw Error('Unsupported module shape');
 const context=vm.createContext({MutationObserver:f.Observer,...(automatic?{document:f.doc}:{})});
 vm.runInContext(source.replace('export function installCornerMenus','function installCornerMenus')+'\nthis.install=installCornerMenus;',context,{timeout:1000});
 return ()=>context.install(f.doc);
}

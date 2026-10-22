import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnimalPenEditor} from '../animal-pen-editor.js';
import {createAnimalPenEditorView} from '../animal-pen-editor-view.js';
// Minimal event/DOM contract for the actual view. Trusted browser gestures are
// a separate release gate; this test does not claim device or rendered proof.
class Element extends EventTarget {
 constructor(tag='div'){super();this.tagName=tag.toUpperCase();this.style={cssText:''};this.dataset={};this.children=[];this.hidden=false;this.value='';this.attrs={};this.fields=new Map();}
 setAttribute(k,v){this.attrs[k]=v;}
 set innerHTML(v){this.html=v;for(const key of ['[data-field="kind"]','[data-field="target"]','[data-controls]','[data-status]','[data-exit]','[data-action="apply"]','[data-action="exit-apply"]'])this.fields.set(key,new Element(key.includes('field')?'select':'div'));}
 querySelector(s){return this.fields.get(s);}
 querySelectorAll(s){return [...this.fields.values(),...this.children].filter(n=>s==='button,select'?['BUTTON','SELECT'].includes(n.tagName):n.tagName==='BUTTON');}
 append(n){this.children.push(n);}
 replaceChildren(){this.children=[];}
 remove(){}
 setPointerCapture(id){this.capture=id;}
 releasePointerCapture(id){if(this.capture===id)this.capture=null;}
 hasPointerCapture(id){return this.capture===id;}
 contains(n){return this===n||[...this.children,...this.fields.values()].some(c=>c.contains(n));}
}
function event(target,type,id,x=10,y=10){const e=new Event(type,{cancelable:true});for(const [k,v]of Object.entries({pointerId:id,clientX:x,clientY:y}))Object.defineProperty(e,k,{value:v});target.dispatchEvent(e);return e;}
function fixture(){const previous={window:globalThis.window,document:globalThis.document};globalThis.window=new Element();globalThis.document={createElement:t=>new Element(t)};const host=new Element(),canvas=new Element(),world={epoch:1,obstacleRevision:1,owned:{cow:5}},editor=createAnimalPenEditor({readWorld:()=>world,readLayout:()=>undefined,validate:()=>({ok:true,issues:[]}),commit:()=>true});editor.begin('cow');editor.dispatch({type:'movePen',kind:'cow',delta:[1,0]});let panCalls=0;const view=createAnimalPenEditorView({editor,host,canvas,project:p=>[p[0],p[2]],unproject:p=>[p[0],0,p[1]],preview(){},clearPreview(){},panZoom(){panCalls++;}});return {editor,host,canvas,handle:host.children[1],get panCalls(){return panCalls;},dispose(){view.dispose();editor.dispose();Object.assign(globalThis,previous);}};}
test('a second pointer anywhere on the page cancels only the current drag',()=>{const f=fixture();try{const before=f.editor.snapshot().draft;event(f.handle,'pointerdown',1);event(f.handle,'pointermove',1,12,10);assert.notDeepEqual(f.editor.snapshot().draft,before);event(window,'pointerdown',2);assert.deepEqual(f.editor.snapshot().draft,before);assert.equal(f.panCalls,1);event(f.handle,'pointermove',1,15,10);assert.deepEqual(f.editor.snapshot().draft,before);assert.equal(f.handle.capture,null);}finally{f.dispose();}});
test('pointer cancellation restores the pre-drag draft and releases capture',()=>{const f=fixture();try{const before=f.editor.snapshot().draft;event(f.handle,'pointerdown',1);event(f.handle,'pointermove',1,12,10);event(window,'pointercancel',1);assert.deepEqual(f.editor.snapshot().draft,before);assert.equal(f.handle.capture,null);}finally{f.dispose();}});

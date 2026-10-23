import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createAnimalPenEditor} from '../animal-pen-editor.js';
import {createAnimalPenEditorView} from '../animal-pen-editor-view.js';
// Actual view/core contract; trusted input and frame isolation are exercised by
// animal-pen-entry.browser.cjs, not by this small DOM fixture.
class Element extends EventTarget {
 constructor(tag='div'){super();this.tagName=tag.toUpperCase();this.style={cssText:''};this.dataset={};this.children=[];this.hidden=false;this.value='';this.attrs={};this.fields=new Map();}
 setAttribute(k,v){this.attrs[k]=v;}
 set innerHTML(v){this.html=v;for(const key of ['[data-field="kind"]','[data-field="target"]','[data-controls]','[data-status]','[data-exit]','[data-action="apply"]','[data-action="exit-apply"]'])this.fields.set(key,new Element(key.includes('field')?'select':'div'));this.fields.get('[data-exit]').hidden=true;}
 querySelector(s){return this.fields.get(s);}
 querySelectorAll(s){return [...this.fields.values(),...this.children].filter(n=>s==='button,select'?['BUTTON','SELECT'].includes(n.tagName):n.tagName==='BUTTON');}
 append(n){this.children.push(n);}
 replaceChildren(){this.children=[];}
 remove(){}
 setPointerCapture(id){this.capture=id;}
 releasePointerCapture(id){if(this.capture===id)this.capture=null;}
 hasPointerCapture(id){return this.capture===id;}
}
function fixture(){
 const old={window:globalThis.window,document:globalThis.document};globalThis.window=new Element();globalThis.document={createElement:t=>new Element(t)};
 const world={epoch:1,obstacleRevision:1,owned:{chicken:30,sheep:5}},host=new Element(),canvas=new Element(),selected=[],commits=[];
 const editor=createAnimalPenEditor({readWorld:()=>world,readLayout:()=>undefined,validate:()=>({ok:true,issues:[]}),commit:value=>{commits.push(value);return true;}});editor.begin('sheep');
 let closed=0;const view=createAnimalPenEditorView({editor,host,canvas,project:()=>[100,100],unproject:()=>[0,0,0],preview(){},clearPreview(){},ownedKinds:()=>['chicken','sheep'],onSelection:s=>selected.push(s),onClose:()=>closed++});
 const panel=host.children[0],click=action=>{const e=new Event('click');Object.defineProperty(e,'target',{value:{closest:()=>({dataset:{action}})}});panel.dispatchEvent(e);};
 return{editor,panel,selected,commits,click,get closed(){return closed;},dispose(){view.dispose();editor.dispose();Object.assign(globalThis,old);}};
}
test('native view exposes only owned species and selects the current species',()=>{const f=fixture();try{assert.deepEqual(f.panel.querySelector('[data-field="kind"]').children.map(o=>o.value),['chicken','sheep']);assert.equal(f.panel.querySelector('[data-field="kind"]').value,'sheep');}finally{f.dispose();}});
test('native view reports the selected site for camera framing',()=>{const f=fixture();try{assert.deepEqual(f.selected,[{kind:'sheep',type:'pen',id:'sheep'}]);}finally{f.dispose();}});
test('Cancel discards the entire dirty draft without committing',()=>{const f=fixture();try{f.editor.dispatch({type:'movePen',kind:'sheep',delta:[-1,0]});assert(f.editor.snapshot().dirty);f.click('cancel');assert.equal(f.editor.snapshot().open,false);assert.equal(f.closed,1);assert.deepEqual(f.commits,[]);}finally{f.dispose();}});
test('Close preserves dirty work while presenting the three explicit exit choices',()=>{const f=fixture();try{f.editor.dispatch({type:'movePen',kind:'sheep',delta:[-1,0]});const before=f.editor.snapshot().draft;f.click('close');assert.equal(f.panel.querySelector('[data-exit]').hidden,false);assert(f.editor.snapshot().open);assert.deepEqual(f.editor.snapshot().draft,before);assert.equal(f.closed,0);assert.deepEqual(f.commits,[]);}finally{f.dispose();}});
test('draft multi-pointer pan retains the existing finite farm camera bounds',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),start=html.indexOf("addEventListener('pointermove',event=>{"),end=html.indexOf('\n},true);',start);assert(start>=0&&end>start);
 for(const sign of [-1,1]){let move;const cam={dist:40,target:{x:0,z:0}},session={pointers:new Map([[1,[0,0]]]),pan:true,last:{c:[0,0],d:null}};
  vm.runInNewContext(html.slice(start,end+'\n},true);'.length),{cam,animalPenEditing:session,NORTH_EXTENSION:25,THREE:{MathUtils:{clamp:(v,lo,hi)=>Math.min(hi,Math.max(lo,v))}},addEventListener:(type,fn)=>{move=fn;}});
  move({pointerId:1,clientX:sign*100000,clientY:sign*100000,preventDefault(){},stopImmediatePropagation(){}});
  assert(cam.target.x>=-24&&cam.target.x<=24);assert(cam.target.z>=-43&&cam.target.z<=28);
 }
});

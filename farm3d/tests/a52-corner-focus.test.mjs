import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fixture,load} from './helpers/a52-menu-dom.mjs';
const source=readFileSync(new URL('../corner-menu.js',import.meta.url),'utf8');
const require=createRequire(import.meta.url),scope=require('./helpers/a52-corner-focus-scope.cjs');
function setup(){
 const f=fixture(),nativeCreate=f.doc.createElement;
 const enhance=n=>{n.tabIndex=0;n.focus=()=>{f.doc.activeElement=n;};n.getClientRects=()=>n.hidden||n.layoutHidden?[]:[{}];return n;};
 for(const n of f.controls.values())enhance(n);f.doc.createElement=tag=>enhance(nativeCreate(tag));load(source,f)();
 const dialog=f.doc.getElementById('preview-tools-menu'),launch=f.doc.getElementById('preview-tools-launch');launch.emit('click');
 const buttons=dialog.querySelectorAll('button');return {...f,dialog,launch,buttons,first:buttons[0],last:f.controls.get('friendsBtn')};
}
test('forward Tab at last visible control cycles to first without losing document focus',()=>{const f=setup();f.last.focus();const e=f.last.emit('keydown',{key:'Tab'});assert.equal(e.defaultPrevented,true);assert.equal(f.doc.activeElement,f.first);});
test('reverse Tab at first visible control cycles to last',()=>{const f=setup();f.first.focus();const e=f.first.emit('keydown',{key:'Tab',shiftKey:true});assert.equal(e.defaultPrevented,true);assert.equal(f.doc.activeElement,f.last);});
test('disabled, hidden, non-tabbable and layout-hidden actions are excluded',()=>{const f=setup();f.last.disabled=true;f.controls.get('soundBtn').tabIndex=-1;f.controls.get('settings').layoutHidden=true;f.first.focus();f.first.emit('keydown',{key:'Tab',shiftKey:true});assert.equal(f.doc.activeElement,f.controls.get('photoBtn'));});
test('native interior Tab, activation, Escape and browser shortcuts remain unprevented',()=>{for(const props of [{key:'Tab'},{key:'Enter'},{key:'Escape'},{key:'Tab',ctrlKey:true},{key:'Tab',altKey:true},{key:'Tab',metaKey:true}]){const f=setup(),b=props.ctrlKey||props.altKey||props.metaKey?f.last:f.controls.get('walkBtn');b.focus();const e=b.emit('keydown',props);assert.equal(e.defaultPrevented,false);assert.equal(f.doc.activeElement,b);}});
test('a non-action focus target inside an open dialog recovers to the matching edge',()=>{for(const shiftKey of [false,true]){const f=setup();f.dialog.focus();const e=f.dialog.emit('keydown',{key:'Tab',shiftKey});assert.equal(e.defaultPrevented,true);assert.equal(f.doc.activeElement,shiftKey?f.last:f.first);}});
test('closed menus do not claim keyboard focus and movement keyup still reaches game cleanup',()=>{const f=setup();f.dialog.close();f.last.focus();assert.equal(f.last.emit('keydown',{key:'Tab'}).defaultPrevented,false);const seen=[];f.doc.addEventListener('keyup',e=>seen.push(e.key));f.last.emit('keyup',{key:'w'});assert.deepEqual(seen,['w']);});
test('exact focus correction inverses to accepted A52 asset without changing frozen receipt',()=>{
 const frozen=JSON.parse(readFileSync(new URL('./fixtures/a52-corner-ui-scope.json',import.meta.url),'utf8'));
 assert.equal(scope.sha(source),scope.scope.afterSha256);assert.equal(scope.scope.beforeSha256,frozen.assets['farm3d/corner-menu.js']);
 assert.equal(scope.normalizeA52CornerFocus('corner-menu.js',source),scope.scope.before);
 assert.equal(scope.normalizeA52CornerFocus('corner-menu.js',source+'x'),source+'x');assert.equal(scope.normalizeA52CornerFocus('unknown',source),source);
});
test('queued close event after reopen reflects current open state, not stale false',()=>{
 const correction=scope.scope.queuedCloseCorrection;
 assert.equal(scope.sha(source.replace(correction.after,correction.before)),correction.previousAfterSha256);
 for(const side of ['tools','barn'])for(const reopen of [false,true]){
  for(const [label,s] of [['before',source.replace(correction.after,correction.before)],['current',source]]){
   const f=fixture();load(s,f)();const d=f.doc.getElementById('preview-'+side+'-menu'),l=f.doc.getElementById('preview-'+side+'-launch'),pending=[];
   d.close=()=>{d.open=false;pending.push(()=>d.emit('close'));};
   l.emit('click');d.close();if(reopen)l.emit('click');pending.shift()();
   assert.equal(d.open,reopen);assert.equal(l.getAttribute('aria-expanded'),label==='before'?'false':String(reopen));
  }
 }
});

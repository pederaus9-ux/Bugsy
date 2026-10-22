import {defaultSiteRecord,resolveAnimalPens} from './animal-pen-layout.js?v=1';
import {PEN_TEMPLATES} from './animal-pen-templates.js?v=1';
const labels={chicken:'Chickens',cow:'Cows',horse:'Horses',sheep:'Sheep',dog:'Dog',cat:'Cat'};
// Native controls are deliberately large; precise selection never depends on
// tapping a rendered fence wire. The canvas remains the actual game renderer.
export function createAnimalPenEditorView({editor,host,canvas,project,unproject,preview,clearPreview,panZoom=()=>{},onClose=()=>{}}){
 const panel=document.createElement('section');panel.setAttribute('aria-label','Animal pen editor');panel.style.cssText='position:fixed;left:12px;bottom:12px;width:min(360px,calc(100vw - 24px));max-height:70vh;overflow:auto;background:#fff9e9;color:#302c20;border:2px solid #6b8548;border-radius:16px;padding:12px;z-index:1000;box-shadow:0 5px 25px #0006;font:16px system-ui;';
 panel.innerHTML='<strong>Animal pens</strong><button type="button" data-action="close" aria-label="Close animal pen editor" style="float:right">×</button><p style="margin:8px 0">Move fences and buildings. Apply saves your changes.</p><label>Animal <select aria-label="Animal" data-field="kind"></select></label><label style="display:block">Selected item <select aria-label="Selected pen item" data-field="target" style="width:100%"></select></label><div data-controls style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div><p data-status role="status" aria-live="polite"></p><div style="display:flex;gap:8px"><button data-action="apply">Apply</button><button data-action="cancel">Cancel</button></div><div data-exit hidden><p>Save your pen changes?</p><button data-action="exit-apply">Apply</button><button data-action="exit-discard">Discard</button><button data-action="exit-keep">Keep editing</button></div>';
 const kinds=panel.querySelector('[data-field="kind"]'),targets=panel.querySelector('[data-field="target"]'),controls=panel.querySelector('[data-controls]'),status=panel.querySelector('[data-status]'),exit=panel.querySelector('[data-exit]');
 for(const [kind,label]of Object.entries(labels)){const o=document.createElement('option');o.value=kind;o.textContent=label;kinds.append(o);}
 const gateAnchor=document.createElement('select');gateAnchor.setAttribute('aria-label','Gate fence');controls.append(gateAnchor);
 const definitions=[['anchor','Attach gate'],['left','←'],['up','↑'],['down','↓'],['right','→'],['add-post','Add post'],['remove','Remove'],['add-fence','Add fence'],['add-gate','Add gate'],['gate-left','Gate −1 m'],['gate-right','Gate +1 m'],['widen','Widen gate'],['narrow','Narrow gate']];
 for(const [action,label]of definitions){const b=document.createElement('button');b.type='button';b.dataset.action=action;b.textContent=label;controls.append(b);}
 for(const node of panel.querySelectorAll('button,select'))node.style.cssText+='min-width:44px;min-height:44px;font:inherit;touch-action:manipulation;';
 host.append(panel);
 const handle=document.createElement('button');handle.type='button';handle.setAttribute('aria-label','Drag selected pen item');handle.textContent='✥';handle.style.cssText='position:fixed;width:48px;height:48px;border-radius:50%;background:#fff9e9;color:#304b20;border:3px solid #6b8548;z-index:999;touch-action:none;font-size:25px;';host.append(handle);
 let disposed=false,seen='',previewRevision=-1,drag=null,drawRun=null,counter=0;const pointers=new Set(),cleanups=[];
 const listen=(node,name,fn,options)=>{node.addEventListener(name,fn,options);cleanups.push(()=>node.removeEventListener(name,fn,options));};
 const record=state=>state.draft?.sites[state.selection?.kind]??defaultSiteRecord(state.selection?.kind??'chicken');
 const command=c=>editor.dispatch({...c,kind:editor.snapshot().selection.kind});
 const nextId=prefix=>prefix+'-'+Date.now().toString(36)+'-'+(++counter);
 function anchor(state){const s=record(state),t=state.selection;if(!t)return null;
  if(t.type==='structure')return s.structures[t.id];
  if(t.type==='vertex'){const v=s.boundary.find(v=>v.id===t.id);return v?[v.x,v.z]:null;}
  if(t.type==='edge'){const [a,b]=t.id.split(':').map(id=>s.boundary.find(v=>v.id===id));return a&&b?[(a.x+b.x)/2,(a.z+b.z)/2]:null;}
  if(t.type==='run'){const r=s.runs.find(r=>r.id===t.id);return r?[(r.a[0]+r.b[0])/2,(r.a[1]+r.b[1])/2]:null;}
  if(t.type==='gate'){const g=s.gates.find(g=>g.id===t.id);let a,b;if(g?.edge)[a,b]=g.edge.map(id=>{const v=s.boundary.find(v=>v.id===id);return v?[v.x,v.z]:null;});else{const r=s.runs?.find(r=>r.id===g?.run);a=r?.a;b=r?.b;}if(!a||!b)return null;const length=Math.hypot(b[0]-a[0],b[1]-a[1]);return [a[0]+(b[0]-a[0])*(g.offset+g.width/2)/length,a[1]+(b[1]-a[1])*(g.offset+g.width/2)/length];}
  const points=Object.values(s.structures);return [points.reduce((n,p)=>n+p[0],0)/points.length,points.reduce((n,p)=>n+p[1],0)/points.length];
 }
 function move(delta,to){const state=editor.snapshot(),t=state.selection;if(!t)return;
  const p=anchor(state);if(!p)return;
  if(t.type==='structure'||t.type==='vertex')command({type:t.type==='structure'?'moveStructure':'moveVertex',id:t.id,to:to??[p[0]+delta[0],p[1]+delta[1]]});
  else if(t.type==='pen')command({type:'movePen',delta});else if(t.type==='edge')command({type:'moveEdge',edge:t.id.split(':'),delta});else if(t.type==='run')command({type:'moveRun',id:t.id,delta});
 }
 function close(){const s=editor.snapshot();if(s.dirty){exit.hidden=false;}else{editor.cancel();clearPreview();onClose();}}
 async function action(name){const state=editor.snapshot(),s=record(state),t=state.selection;if(!t)return;
  if(['left','right','up','down'].includes(name)){move({left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[name]);return;}
  if(name==='close'||name==='cancel'){close();return;}
  if(name==='exit-keep'){exit.hidden=true;return;}
  if(name==='exit-discard'){editor.cancel();clearPreview();onClose();return;}
  if(name==='apply'||name==='exit-apply'){if(await editor.apply()){clearPreview();onClose();}return;}
  if(name==='anchor'&&t.type==='gate'){const [type,id]=gateAnchor.value.split('|');command({type:'anchorGate',id:t.id,edge:type==='edge'?id.split(':'):null,run:type==='run'?id:null,offset:1});return;}
  if(name==='add-fence'){drawRun={first:null};status.textContent='Tap the start and end of your new fence.';return;}
  if(name==='add-post'&&t.type==='edge')command({type:'splitEdge',edge:t.id.split(':'),id:nextId('post'),at:anchor(state)});
  if(name==='remove'){const types={vertex:'removeVertex',run:'removeRun',gate:'removeGate'};if(types[t.type])command({type:types[t.type],id:t.id});}
  if(name==='add-gate'&&['edge','run'].includes(t.type))command({type:'addGate',gate:{id:nextId('gate'),edge:t.type==='edge'?t.id.split(':'):null,run:t.type==='run'?t.id:null,offset:1,width:PEN_TEMPLATES[t.kind].gateWidth}});
  if(t.type==='gate'&&['gate-left','gate-right','widen','narrow'].includes(name)){const g=s.gates.find(g=>g.id===t.id);command({type:'setGate',id:t.id,offset:Math.max(0,g.offset+(name==='gate-left'?-1:name==='gate-right'?1:0)),width:Math.max(PEN_TEMPLATES[t.kind].gateWidth,g.width+(name==='widen'?1:name==='narrow'?-1:0))});}
 }
 listen(panel,'click',event=>{const b=event.target.closest('[data-action]');if(b)void action(b.dataset.action);});
 listen(kinds,'change',()=>{if(!editor.begin(kinds.value))status.textContent='Own this animal before editing its home.';render();});
 listen(targets,'change',()=>{const [type,...parts]=targets.value.split('|');editor.select({kind:kinds.value,type,id:parts.join('|')});render();});
 function finishDrag(cancel){const previous=drag;drag=null;if(cancel)editor.cancelGesture();else editor.endGesture();if(previous&&handle.hasPointerCapture(previous.id))handle.releasePointerCapture(previous.id);}
 function trackPointer(event){if(!editor.snapshot().open||pointers.has(event.pointerId))return;pointers.add(event.pointerId);if(pointers.size>1){finishDrag(true);drawRun=null;panZoom(event);}}
 // Observe second touches before controls stop propagation. A finger on a
 // button, not just on the canvas, must cancel the current drag as well.
 listen(window,'pointerdown',trackPointer,true);
 function down(event){if(!editor.snapshot().open)return;trackPointer(event);if(pointers.size>1)return;const at=unproject([event.clientX,event.clientY]);if(!at)return;
  if(drawRun){event.stopImmediatePropagation();event.preventDefault();if(!drawRun.first){drawRun.first=[at[0],at[2]];status.textContent='Tap the fence end.';}else{command({type:'addRun',id:nextId('fence'),a:drawRun.first,b:[at[0],at[2]]});drawRun=null;}return;}
  if(event.currentTarget!==handle)return;event.preventDefault();event.stopPropagation();editor.beginGesture(event.pointerId);handle.setPointerCapture(event.pointerId);drag={id:event.pointerId,last:[at[0],at[2]],origin:anchor(editor.snapshot()),start:[at[0],at[2]]};
 }
 listen(handle,'pointerdown',down);listen(canvas,'pointerdown',down,true);
 listen(handle,'pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const at=unproject([event.clientX,event.clientY]);if(!at)return;const delta=[Math.round(at[0]-drag.last[0]),Math.round(at[2]-drag.last[1])];if(!delta.some(Boolean))return;const to=[drag.origin[0]+Math.round(at[0]-drag.start[0]),drag.origin[1]+Math.round(at[2]-drag.start[1])];move(delta,to);drag.last=[drag.last[0]+delta[0],drag.last[1]+delta[1]];});
 const up=event=>{pointers.delete(event.pointerId);if(drag?.id===event.pointerId)finishDrag(false);};
 listen(window,'pointerup',up,true);listen(window,'pointercancel',event=>{pointers.delete(event.pointerId);finishDrag(true);},true);listen(handle,'lostpointercapture',()=>{if(drag)finishDrag(true);});listen(window,'blur',()=>{pointers.clear();finishDrag(true);drawRun=null;});
 listen(panel,'keydown',event=>{if(['INPUT','SELECT'].includes(event.target.tagName))return;const names={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};if(names[event.key]){event.preventDefault();void action(names[event.key]);}if(event.key==='Escape'){event.preventDefault();close();}});
 function render(){if(disposed)return;const state=editor.snapshot();panel.hidden=!state.open;handle.hidden=!state.open;if(!state.open)return;const s=record(state),t=state.selection,signature=JSON.stringify([t,state.draftRevision]);
  if(signature!==seen){seen=signature;kinds.value=t.kind;targets.replaceChildren();const list=[['pen',t.kind,'Whole pen'],...Object.keys(s.structures).map(id=>['structure',id,id]),...(s.boundary??[]).flatMap((v,i)=>[['vertex',v.id,'Post '+(i+1)],['edge',v.id+':'+s.boundary[(i+1)%s.boundary.length].id,'Fence edge '+(i+1)]]),...(s.runs??[]).map((r,i)=>['run',r.id,'Interior fence '+(i+1)]),...(s.gates??[]).map((g,i)=>['gate',g.id,'Gate '+(i+1)])];for(const [type,id,label]of list){const o=document.createElement('option');o.value=type+'|'+id;o.textContent=label;targets.append(o);}targets.value=t.type+'|'+t.id;gateAnchor.replaceChildren();for(const [type,id,label]of list.filter(v=>['edge','run'].includes(v[0]))){const o=document.createElement('option');o.value=type+'|'+id;o.textContent=label;gateAnchor.append(o);}gateAnchor.hidden=t.type!=='gate';
   for(const b of controls.querySelectorAll('button')){const n=b.dataset.action;b.disabled=n==='anchor'?t.type!=='gate':n==='add-post'?t.type!=='edge':n==='remove'?!['vertex','run','gate'].includes(t.type):n==='add-gate'?!['edge','run'].includes(t.type):n==='add-fence'?!s.boundary:['gate-left','gate-right','widen','narrow'].includes(n)?t.type!=='gate':t.type==='gate';}
  }
  const p=anchor(state);handle.hidden=!p||t.type==='gate';if(p){const xy=project([p[0],0,p[1]]);handle.style.left=(xy[0]-24)+'px';handle.style.top=(xy[1]-24)+'px';}
  panel.querySelector('[data-action="apply"]').disabled=!state.canApply;panel.querySelector('[data-action="exit-apply"]').disabled=!state.canApply;
  if(!drawRun)status.textContent=state.reason??(state.dirty?(state.validation?'Ready to apply.':'Checking space and care routes…'):'Select a fence or building to edit.');
  const previewKey=state.draftRevision+':'+String(state.validation?.ok);if(previewRevision!==previewKey){previewRevision=previewKey;try{preview(resolveAnimalPens(state.draft),state.validation);}catch{clearPreview();}}
 }
 const interval=setInterval(render,100);render();
 return{dispose(){if(disposed)return;disposed=true;finishDrag(true);pointers.clear();clearInterval(interval);for(const fn of cleanups)fn();panel.remove();handle.remove();clearPreview();}};
}

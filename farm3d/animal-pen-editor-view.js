import {defaultSiteRecord,resolveAnimalPens} from './animal-pen-layout.js?v=1';
import {PEN_TEMPLATES} from './animal-pen-templates.js?v=1';
import {createPenPlacementController} from './animal-pen-placement-controller.js?v=1';
const labels={chicken:'Chickens',cow:'Cows',horse:'Horses',sheep:'Sheep',dog:'Dog',cat:'Cat'};
// Native controls are deliberately large; precise selection never depends on
// tapping a rendered fence wire. The canvas remains the actual game renderer.
export function createAnimalPenEditorView({editor,host,canvas,project,unproject,preview,clearPreview,panZoom=()=>{},onClose=()=>{},ownedKinds=()=>Object.keys(labels),onSelection=()=>{},readWorld=null,placementPreview=()=>{},clearPlacementPreview=()=>{},onPlacementFocus=()=>{}}){
 const panel=document.createElement('section');panel.setAttribute('aria-label','Animal pen editor');panel.style.cssText='position:fixed;left:12px;bottom:12px;width:min(360px,calc(100vw - 24px));max-height:70vh;overflow:auto;background:#fff9e9;color:#302c20;border:2px solid #6b8548;border-radius:16px;padding:12px;z-index:1000;box-shadow:0 5px 25px #0006;font:16px system-ui;';
 panel.innerHTML='<strong>Animal pens</strong><button type="button" data-action="close" aria-label="Close animal pen editor" style="float:right">×</button><p style="margin:8px 0">Move fences and buildings. Apply saves your changes.</p><label>Animal <select aria-label="Animal" data-field="kind"></select></label><label style="display:block">Selected item <select aria-label="Selected pen item" data-field="target" style="width:100%"></select></label><div data-controls style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div><p data-status role="status" aria-live="polite"></p><div style="display:flex;gap:8px"><button data-action="apply">Apply</button><button data-action="cancel">Cancel</button></div><div data-exit hidden><p>Save your pen changes?</p><button data-action="exit-apply">Apply</button><button data-action="exit-discard">Discard</button><button data-action="exit-keep">Keep editing</button></div>';
 const kinds=panel.querySelector('[data-field="kind"]'),targets=panel.querySelector('[data-field="target"]'),controls=panel.querySelector('[data-controls]'),status=panel.querySelector('[data-status]'),exit=panel.querySelector('[data-exit]');
 panel.style.maxHeight=window.innerWidth<600?'42vh':'70vh';
 for(const [kind,label]of Object.entries(labels)){if(!ownedKinds().includes(kind))continue;const o=document.createElement('option');o.value=kind;o.textContent=label;kinds.append(o);}
 const gateAnchor=document.createElement('select');gateAnchor.setAttribute('aria-label','Gate fence');controls.append(gateAnchor);
 const definitions=[['anchor','Attach gate'],['left','←'],['up','↑'],['down','↓'],['right','→'],['add-post','Add post'],['remove','Remove'],['add-fence','Add fence'],['add-gate','Add gate'],['gate-left','Gate −1 m'],['gate-right','Gate +1 m'],['widen','Widen gate'],['narrow','Narrow gate']];
 for(const [action,label]of definitions){const b=document.createElement('button');b.type='button';b.dataset.action=action;b.textContent=label;if(['left','up','down','right'].includes(action))b.setAttribute('aria-label','Move '+action+' 1 metre');controls.append(b);}
 for(const node of panel.querySelectorAll('button,select'))node.style.cssText+='min-width:44px;min-height:44px;font:inherit;touch-action:manipulation;';
 host.append(panel);
 const handle=document.createElement('button');handle.type='button';handle.setAttribute('aria-label','Drag selected pen item');handle.textContent='✥';handle.style.cssText='position:fixed;width:48px;height:48px;border-radius:50%;background:#fff9e9;color:#304b20;border:3px solid #6b8548;z-index:999;touch-action:none;font-size:25px;';host.append(handle);
 let disposed=false,seen='',previewRevision=-1,drag=null,drawRun=null,counter=0,exitFocus=null,anchorSelection=null;const pointers=new Set(),cleanups=[];
 const listen=(node,name,fn,options)=>{node.addEventListener(name,fn,options);cleanups.push(()=>node.removeEventListener(name,fn,options));};
 let placementFocus=null,placementSelection='',placementModel=null,guide=null,guideReason=null,guideProgress=null,placement=null;
 if(readWorld){
  guide=document.createElement('section');guide.setAttribute('role','region');guide.setAttribute('aria-label','Ground placement guide');guide.style.cssText='position:fixed;right:12px;top:12px;width:min(330px,calc(100vw - 24px));box-sizing:border-box;padding:10px 12px;border:2px solid #6b8548;border-radius:14px;background:#fff9e9f5;color:#302c20;font:14px/1.35 system-ui;z-index:998;box-shadow:0 3px 14px #0003;';
  const title=document.createElement('strong');title.textContent='Placement on the ground';guide.append(title);
  const legend=document.createElement('div');legend.textContent='✓ Fits   × Blocked   · Not checked';legend.style.cssText='margin:5px 0;font-weight:600';guide.append(legend);
  guideReason=document.createElement('div');guideReason.setAttribute('role','status');guideReason.setAttribute('aria-live','polite');guide.append(guideReason);
  guideProgress=document.createElement('small');guideProgress.style.display='block';guide.append(guideProgress);
  const hint=document.createElement('small');hint.textContent='Point or tap ground to inspect nearby positions. Checks include the whole draft. Unmarked ground is unchecked. Apply checks again.';hint.style.cssText='display:block;margin-top:5px';guide.append(hint);
  const look=document.createElement('button');look.type='button';look.textContent='View checked ground';look.style.cssText='min-height:44px;min-width:44px;margin-top:5px;font:inherit;';guide.append(look);listen(look,'click',()=>{const at=placementModel?.cells[0]?.at;if(at){const a=guide.getBoundingClientRect(),b=panel.getBoundingClientRect(),screen=window.innerHeight>window.innerWidth?[window.innerWidth/2,(a.bottom+b.top)/2]:[window.innerWidth/2,window.innerHeight/2];onPlacementFocus(at,screen);}});host.append(guide);
  placement=createPenPlacementController({onUpdate:model=>{placementModel=model;placementPreview(model);const cell=model.cells[0],prefix=cell?cell.at.map(n=>Number(n.toFixed(1))).join(', ')+': ':'';const text=prefix+model.reason;if(guideReason.textContent!==text)guideReason.textContent=text;guideProgress.textContent=model.cells.filter(c=>c.status!=='unknown').length+' / '+model.cells.length+' nearby positions checked'+(model.checking?' · Checking…':'');}});
 }
 function inspect(event){if(!placement||drag||drawRun||pointers.size>1)return;const at=unproject([event.clientX,event.clientY]);if(at){placementFocus=[at[0],at[2]];placement.update(editor.snapshot(),readWorld(),placementFocus);}}
 listen(canvas,'pointermove',inspect);listen(canvas,'pointerdown',inspect);
 const record=state=>state.draft?.sites[state.selection?.kind]??defaultSiteRecord(state.selection?.kind??'chicken');
 const command=c=>{
  const kind=editor.snapshot().selection.kind;if(!editor.dispatch({...c,kind}))return false;
  const type={splitEdge:'vertex',addRun:'run',addGate:'gate'}[c.type];
  if(type)editor.select({kind,type,id:c.type==='addGate'?c.gate.id:c.id});
  else if(['removeVertex','removeRun','removeGate'].includes(c.type))editor.select({kind,type:'pen',id:kind});
  if(type||c.type.startsWith('remove'))targets.focus?.({preventScroll:true});return true;
 };
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
 function close(){const s=editor.snapshot();if(s.dirty){exitFocus=document.activeElement;exit.hidden=false;exit.querySelector('button:not(:disabled)')?.focus?.();}else{editor.cancel();clearPreview();onClose();}}
 async function action(name){const state=editor.snapshot(),s=record(state),t=state.selection;if(!t)return;
  if(['left','right','up','down'].includes(name)){move({left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[name]);return;}
  if(name==='close'){close();return;}
  if(name==='cancel'){editor.cancel();clearPreview();onClose();return;}
  if(name==='exit-keep'){exit.hidden=true;(exitFocus??kinds).focus?.({preventScroll:true});return;}
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
 listen(host,'keydown',event=>{
  if(event.key==='Tab'){const nodes=[...host.querySelectorAll('button,select')].filter(n=>!n.disabled&&n.getClientRects().length),i=nodes.indexOf(document.activeElement);if(i<0||event.shiftKey&&i===0||!event.shiftKey&&i===nodes.length-1){event.preventDefault();nodes[event.shiftKey?nodes.length-1:0]?.focus();}return;}
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(['INPUT','SELECT'].includes(event.target.tagName))return;const names={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};if(names[event.key]){event.preventDefault();void action(names[event.key]);}
 });
 function render(){if(disposed)return;const state=editor.snapshot();panel.hidden=!state.open;handle.hidden=!state.open;if(!state.open)return;const s=record(state),t=state.selection,signature=JSON.stringify([t,state.draftRevision]);
  if(signature!==seen){const gateKey=t.type==='gate'?t.kind+'|'+t.id:null,pendingAnchor=gateKey===anchorSelection?gateAnchor.value:null;anchorSelection=gateKey;seen=signature;kinds.value=t.kind;targets.replaceChildren();const list=[['pen',t.kind,'Whole pen'],...Object.keys(s.structures).map(id=>['structure',id,id]),...(s.boundary??[]).flatMap((v,i)=>[['vertex',v.id,'Post '+(i+1)],['edge',v.id+':'+s.boundary[(i+1)%s.boundary.length].id,'Fence edge '+(i+1)]]),...(s.runs??[]).map((r,i)=>['run',r.id,'Interior fence '+(i+1)]),...(s.gates??[]).map((g,i)=>['gate',g.id,'Gate '+(i+1)])];for(const [type,id,label]of list){const o=document.createElement('option');o.value=type+'|'+id;o.textContent=label;targets.append(o);}targets.value=t.type+'|'+t.id;gateAnchor.replaceChildren();for(const [type,id,label]of list.filter(v=>['edge','run'].includes(v[0]))){const o=document.createElement('option');o.value=type+'|'+id;o.textContent=label;gateAnchor.append(o);}const selectedGate=s.gates?.find(g=>g.id===t.id),attached=selectedGate?.edge?'edge|'+selectedGate.edge.join(':'):selectedGate?.run?'run|'+selectedGate.run:null,choice=[pendingAnchor,attached].find(value=>value&&[...gateAnchor.children].some(o=>o.value===value));if(choice)gateAnchor.value=choice;gateAnchor.hidden=t.type!=='gate';
   for(const b of controls.querySelectorAll('button')){const n=b.dataset.action;b.disabled=n==='anchor'?t.type!=='gate':n==='add-post'?t.type!=='edge':n==='remove'?!['vertex','run','gate'].includes(t.type):n==='add-gate'?!['edge','run'].includes(t.type):n==='add-fence'?!s.boundary:['gate-left','gate-right','widen','narrow'].includes(n)?t.type!=='gate':t.type==='gate'||t.kind==='chicken'&&t.type==='pen';}
  }
  onSelection(t);
  const p=anchor(state);handle.hidden=!p||t.type==='gate'||t.kind==='chicken'&&t.type==='pen';if(p){const xy=project([p[0],0,p[1]]);handle.style.left=(xy[0]-24)+'px';handle.style.top=(xy[1]-24)+'px';}
  if(placement){const selection=JSON.stringify(t);if(selection!==placementSelection){placementSelection=selection;placementFocus=null;}placement.update(state,readWorld(),placementFocus??undefined);}
  panel.querySelector('[data-action="apply"]').disabled=!state.canApply;panel.querySelector('[data-action="exit-apply"]').disabled=!state.canApply;
  if(!drawRun)status.textContent=state.reason??(state.dirty?(state.validation?'Ready to apply.':'Checking space and care routes…'):'Select a fence or building to edit.');
  const previewKey=state.draftRevision+':'+String(state.validation?.ok);if(previewRevision!==previewKey){previewRevision=previewKey;try{preview(resolveAnimalPens(state.draft),state.validation);}catch{clearPreview();}}
 }
 const interval=setInterval(render,100);render();kinds.focus?.({preventScroll:true});
 return{dispose(){if(disposed)return;disposed=true;finishDrag(true);pointers.clear();clearInterval(interval);for(const fn of cleanups)fn();placement?.dispose();guide?.remove();clearPlacementPreview();panel.remove();handle.remove();clearPreview();}};
}

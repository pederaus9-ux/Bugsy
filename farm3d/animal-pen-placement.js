import {createAnimalPenEditor} from './animal-pen-editor.js?v=1';
import {defaultSiteRecord,decodeAnimalPens,resolveAnimalPens} from './animal-pen-layout.js?v=1';
import {validateAnimalPens} from './animal-pen-validation.js?v=2';
const record=s=>s.draft?.sites[s.selection?.kind]??defaultSiteRecord(s.selection?.kind??'chicken');
function gateAxis(state){const s=record(state),g=s.gates?.find(g=>g.id===state.selection.id);let a,b;
 if(g?.edge)[a,b]=g.edge.map(id=>{const v=s.boundary.find(v=>v.id===id);return v?[v.x,v.z]:null;});else{const r=s.runs?.find(r=>r.id===g?.run);a=r?.a;b=r?.b;}
 if(!a||!b)return null;const length=Math.hypot(b[0]-a[0],b[1]-a[1]);return length?{g,a,b,length,u:[(b[0]-a[0])/length,(b[1]-a[1])/length]}:null;
}
export function placementAnchor(state){const s=record(state),t=state.selection;if(!t)return null;
 if(t.type==='structure')return s.structures[t.id]?.slice()??null;
 if(t.type==='vertex'){const v=s.boundary?.find(v=>v.id===t.id);return v?[v.x,v.z]:null;}
 if(t.type==='edge'){const [a,b]=t.id.split(':').map(id=>s.boundary?.find(v=>v.id===id));return a&&b?[(a.x+b.x)/2,(a.z+b.z)/2]:null;}
 if(t.type==='run'){const r=s.runs?.find(r=>r.id===t.id);return r?[(r.a[0]+r.b[0])/2,(r.a[1]+r.b[1])/2]:null;}
 if(t.type==='gate'){const x=gateAxis(state);return x?x.a.map((n,i)=>n+x.u[i]*(x.g.offset+x.g.width/2)):null;}
 const p=Object.values(s.structures);return p.length?[p.reduce((n,v)=>n+v[0],0)/p.length,p.reduce((n,v)=>n+v[1],0)/p.length]:null;
}
// Use the actual editor command, isolated from its live draft, callbacks and save.
export function placementDraft(state,at,world){const t=state.selection,p=placementAnchor(state);if(!t||!p||!Array.isArray(at)||at.length!==2||!at.every(Number.isFinite))throw Error('Select an item and a ground position.');
 if(t.kind==='chicken'&&t.type==='pen')throw Error('The chicken yard stays fixed. Select a building, fence or gate.');
 const delta=at.map((n,i)=>n-p[i]);let c={kind:t.kind,id:t.id};
 if(t.type==='structure'||t.type==='vertex')Object.assign(c,{type:t.type==='structure'?'moveStructure':'moveVertex',to:at});
 else if(t.type==='pen')Object.assign(c,{type:'movePen',delta});
 else if(t.type==='edge')Object.assign(c,{type:'moveEdge',edge:t.id.split(':'),delta});
 else if(t.type==='run')Object.assign(c,{type:'moveRun',delta});
 else if(t.type==='gate'){const x=gateAxis(state);if(!x)throw Error('Select an attached gate.');const step=Math.round(delta[0]*x.u[0]+delta[1]*x.u[1]);Object.assign(c,{type:'setGate',offset:x.g.offset+step,width:x.g.width});}
 else throw Error('Select a movable item.');
 const editor=createAnimalPenEditor({readWorld:()=>world,readLayout:()=>state.draft,validate:()=>({ok:false}),commit:()=>false});
 try{if(!editor.begin(t.kind)||!editor.dispatch(c))throw Error('This move is unavailable. Check ownership and the selected fence.');const draft=editor.snapshot().draft;draft.revision=(state.draft?.revision??0)+1;return draft;}finally{editor.dispose();}
}
export function placementCandidates(state,focus=placementAnchor(state)){const p=placementAnchor(state);if(!p||!focus)return [];const t=state.selection,cells=[];
 if(t.type==='gate'){const x=gateAxis(state);if(!x)return [];const step=Math.round((focus[0]-p[0])*x.u[0]+(focus[1]-p[1])*x.u[1]);for(let n=step-12;n<=step+12;n++){const offset=x.g.offset+n;if(offset<0||offset+x.g.width>x.length)continue;cells.push({at:p.map((v,i)=>v+n*x.u[i])});}}
 else{const absolute=t.type==='structure'||t.type==='vertex',center=focus.map((v,i)=>absolute?Math.round(v):p[i]+Math.round(v-p[i]));for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)cells.push({at:[center[0]+x,center[1]+z]});}
 return cells.sort((a,b)=>Math.hypot(...a.at.map((n,i)=>n-focus[i]))-Math.hypot(...b.at.map((n,i)=>n-focus[i])));
}
export function evaluatePenPlacement(state,at,world){
 let draft;try{draft=placementDraft(state,at,world);}catch(error){return{status:'blocked',reason:error.message||'This move is unavailable.'};}
 const decoded=decodeAnimalPens(draft);if(decoded.status!=='ok')return{status:'blocked',reason:decoded.reason??decoded.issues?.[0]?.message??'This layout is unavailable.'};
 // Unexpected computation failures stay unknown in the worker, never a fit result.
 const result=validateAnimalPens(resolveAnimalPens(draft),world,{fastReject:true});return{status:result.ok?'valid':'blocked',reason:result.ok?'Fits here.':result.issues[0].message};
}

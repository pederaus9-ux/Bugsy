import {decodeAnimalPens,resolveAnimalPens,defaultSiteRecord} from './animal-pen-layout.js?v=1';
import {PEN_TEMPLATES} from './animal-pen-templates.js?v=1';
const clone=x=>structuredClone(x),point=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&Math.abs(n)<=128),id=s=>typeof s==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(s),snap=p=>p.map(Math.round),add=(p,d)=>[p[0]+d[0],p[1]+d[1]];
export function createAnimalPenEditor({readWorld,readLayout,validate,commit,onChange=()=>{},clock=()=>Date.now()}){
 let open=false,disposed=false,draft=null,initial=null,base=null,selection=null,draftRevision=0,validation=null,validationStamp=null,reason=null,gesture=null,timer=null,serial=0,applying=false;
 const dirty=()=>open&&JSON.stringify(draft)!==JSON.stringify(initial);
 const validWorld=()=>{const w=readWorld();return w.epoch===base?.epoch&&(readLayout()?.revision??0)===base?.revision;};
 function snapshot(){return clone({open,dirty:dirty(),draft,selection,draftRevision,validation,canApply:open&&dirty()&&!gesture&&!applying&&validation?.ok===true&&validationStamp?.obstacleRevision===readWorld().obstacleRevision&&validWorld(),reason});}
 function emit(){onChange(snapshot());}
 function schedule(){clearTimeout(timer);timer=setTimeout(()=>{timer=null;void validateNow();},150);timer.unref?.();}
 function changed(){draftRevision++;serial++;validation=null;reason=null;emit();schedule();}
 function begin(kind){
  if(disposed||applying||!Object.hasOwn(PEN_TEMPLATES,kind)||!(readWorld().owned[kind]>0))return false;
  if(open){selection={kind,type:'pen',id:kind};emit();return true;}
  const decoded=decodeAnimalPens(readLayout());if(decoded.status!=='ok')return false;
  draft=clone(decoded.value??{v:1,revision:0,sites:{}});initial=clone(draft);base={epoch:readWorld().epoch,revision:draft.revision};open=true;selection={kind,type:'pen',id:kind};validation=null;reason=null;draftRevision++;serial++;emit();return true;
 }
 function select(target){if(!open||applying)return;if(target!==null&&(!Object.hasOwn(PEN_TEMPLATES,target.kind)||!(readWorld().owned[target.kind]>0)))return;selection=clone(target);emit();}
 function dispatch(c){
  if(!open||applying||!validWorld()||!c||!Object.hasOwn(PEN_TEMPLATES,c.kind)||!(readWorld().owned[c.kind]>0))return false;
  const next=clone(draft),s=next.sites[c.kind]??defaultSiteRecord(c.kind),pen=!!s.boundary;
  if(!pen&&!['moveStructure','movePen'].includes(c.type))return false;
  const vertex=v=>s.boundary?.find(p=>p.id===v),run=v=>s.runs?.find(p=>p.id===v),gate=v=>s.gates?.find(p=>p.id===v);
  const edge=e=>Array.isArray(e)&&e.length===2&&s.boundary?.some((v,i)=>v.id===e[0]&&s.boundary[(i+1)%s.boundary.length].id===e[1]);
  const unique=v=>id(v)&&!vertex(v)&&!run(v)&&!gate(v);let v,r,g,d;
  switch(c.type){
   case 'moveStructure':if(!Object.hasOwn(s.structures,c.id)||!point(c.to))return false;s.structures[c.id]=snap(c.to);break;
   case 'movePen':
    if(!point(c.delta))return false;d=snap(c.delta);for(const k of Object.keys(s.structures))s.structures[k]=add(s.structures[k],d);
    if(pen){for(const v of s.boundary){v.x+=d[0];v.z+=d[1];}for(const r of s.runs){r.a=add(r.a,d);r.b=add(r.b,d);}}break;
   case 'moveVertex':v=vertex(c.id);if(!v||!point(c.to))return false;[v.x,v.z]=snap(c.to);break;
   case 'moveEdge':if(!edge(c.edge)||!point(c.delta))return false;d=snap(c.delta);for(const v of c.edge.map(vertex)){v.x+=d[0];v.z+=d[1];}break;
   case 'splitEdge':{
    if(!edge(c.edge)||!unique(c.id)||!point(c.at)||s.boundary.length>=24)return false;
    const a=vertex(c.edge[0]),b=vertex(c.edge[1]),p=snap(c.at),length=Math.hypot(b.x-a.x,b.z-a.z),split=length?((p[0]-a.x)*(b.x-a.x)+(p[1]-a.z)*(b.z-a.z))/length:0;
    s.boundary.splice(s.boundary.indexOf(a)+1,0,{id:c.id,x:p[0],z:p[1]});
    for(const g of s.gates.filter(g=>g.edge?.[0]===a.id&&g.edge[1]===b.id)){
     if(g.offset+g.width<=split)g.edge=[a.id,c.id];else if(g.offset>=split){g.edge=[c.id,b.id];g.offset-=split;}
     // A gate spanning the split retains its now-unresolved old edge identity.
    }break;
   }
   case 'removeVertex':if(!vertex(c.id)||s.boundary.length<=3)return false;s.boundary=s.boundary.filter(v=>v.id!==c.id);break;
   case 'addRun':if(!unique(c.id)||!point(c.a)||!point(c.b)||s.runs.length>=24)return false;s.runs.push({id:c.id,a:snap(c.a),b:snap(c.b)});break;
   case 'moveRun':r=run(c.id);if(!r||!point(c.delta))return false;d=snap(c.delta);r.a=add(r.a,d);r.b=add(r.b,d);break;
   case 'removeRun':if(!run(c.id))return false;s.runs=s.runs.filter(r=>r.id!==c.id);break;
   case 'addGate':g=c.gate;if(!g||!unique(g.id)||s.gates.length>=4||!Number.isFinite(g.offset)||!Number.isFinite(g.width)||g.width<=0||g.offset<0||!(g.edge===null&&run(g.run)||g.run===null&&edge(g.edge)))return false;s.gates.push(clone(g));break;
   case 'setGate':g=gate(c.id);if(!g||!Number.isFinite(c.offset)||!Number.isFinite(c.width)||c.offset<0||c.width<=0)return false;g.offset=c.offset;g.width=c.width;break;
   case 'anchorGate':g=gate(c.id);if(!g||!Number.isFinite(c.offset)||c.offset<0||!(c.edge===null&&run(c.run)||c.run===null&&edge(c.edge)))return false;g.edge=clone(c.edge);g.run=c.run;g.offset=c.offset;break;
   case 'removeGate':if(!gate(c.id))return false;s.gates=s.gates.filter(g=>g.id!==c.id);break;
   default:return false;
  }
  next.sites[c.kind]=s;draft=next;changed();return true;
 }
 function beginGesture(pointerId){if(!open||applying)return;if(gesture){if(gesture.pointerId!==pointerId)cancelGesture();return;}gesture={pointerId,draft:clone(draft)};validation=null;serial++;emit();}
 function cancelGesture(){if(!gesture)return;draft=gesture.draft;gesture=null;changed();}
 function endGesture(){if(!gesture)return;gesture=null;changed();}
 async function validateNow(){
  clearTimeout(timer);timer=null;
  if(!open||disposed||gesture||!dirty())return false;
  if(!validWorld()){validation=null;reason='The farm changed. Close and reopen Animal pens.';emit();return false;}
  const ticket=++serial,rev=draftRevision,world=readWorld(),stamp={epoch:world.epoch,obstacleRevision:world.obstacleRevision},candidate=clone(draft);candidate.revision=base.revision+1;
  let result;
  try{const decoded=decodeAnimalPens(candidate);if(decoded.status!=='ok')throw new Error(decoded.status==='readonly'?decoded.reason:decoded.issues[0].message);const layout=resolveAnimalPens(candidate);const issues=Object.values(layout.sites).flatMap(s=>s.issues);result=issues.length?{ok:false,issues}:await validate(layout,world);}
  catch(error){result={ok:false,issues:[{message:error.message||'This layout cannot be applied.'}]};}
  if(!open||disposed||ticket!==serial||rev!==draftRevision)return false;
  const latest=readWorld();if(!validWorld()||latest.epoch!==stamp.epoch||latest.obstacleRevision!==stamp.obstacleRevision){validation=null;reason='The farm changed. Check the layout again.';emit();return false;}
  validation=result;validationStamp=stamp;reason=result.ok?null:result.issues?.[0]?.message||'This layout is not ready.';emit();return !!result.ok;
 }
 async function apply(){
  if(applying||gesture||!open||!dirty())return false;
  if(!await validateNow()||!validWorld()||gesture)return false;
  const rev=draftRevision,value=clone(draft);value.revision=base.revision+1;applying=true;emit();
  try{if(rev!==draftRevision||!validWorld())return false;const ok=commit(value,{...base});if(ok){applying=false;cancel();return true;}reason='The layout could not be saved. Your draft is still here.';return false;}
  catch{reason='The layout could not be saved. Your draft is still here.';return false;}
  finally{applying=false;emit();}
 }
 function cancel(){if(applying)return;clearTimeout(timer);timer=null;serial++;open=false;gesture=null;draft=null;initial=null;selection=null;validation=null;reason=null;emit();}
 function dispose(){cancel();disposed=true;}
 return{begin,select,dispatch,beginGesture,cancelGesture,endGesture,validateNow,apply,cancel,snapshot,dispose};
}

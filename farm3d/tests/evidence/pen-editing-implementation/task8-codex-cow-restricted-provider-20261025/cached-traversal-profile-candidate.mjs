// Cow-specific cached discrete traversal. This is NOT a temporal enclosure.
// No caller may use a clear displayed pose as a continuous-motion certificate.
import * as T from '../../lib/three.module.min.js';
const bits=new DataView(new ArrayBuffer(8));
function up(x){if(!Number.isFinite(x))throw Error('Nonfinite bound');if(x===0)return Number.MIN_VALUE;bits.setFloat64(0,x);const n=bits.getBigUint64(0);bits.setBigUint64(0,x>0?n+1n:n-1n);return bits.getFloat64(0);}
const down=x=>-up(-x),add=(a,b)=>[down(a[0]+b[0]),up(a[1]+b[1])];
function mul(a,b){const q=[a[0]*b[0],a[0]*b[1],a[1]*b[0],a[1]*b[1]];return[down(Math.min(...q)),up(Math.max(...q))];}
function transform(p,m){return[0,1,2].map(k=>{let q=[m[k+12],m[k+12]];for(let j=0;j<3;j++)q=add(q,mul([m[k+4*j],m[k+4*j]],p[j]));return q;});}
const intersects=(a,b)=>a.every((v,k)=>v[0]<=b[k+3]&&v[1]>=b[k]);
export function cacheCowTriangles(r){
 const g=r.card.geometry;if(g.index||g.morphAttributes.position?.length)throw Error('Unsupported cow geometry');
 const p=g.attributes.position.array,w=g.attributes.skinWeight.array,idx=g.attributes.skinIndex.array,bind=r.card.bindMatrix;
 if(!bind.equals(new T.Matrix4()))throw Error('Unsupported nonidentity bind pose');
 const vertices=p.length/3,centers=Array.from({length:vertices/3},(_,t)=>[0,1,2].map(k=>(p[t*9+k]+p[t*9+3+k]+p[t*9+6+k])/3)),nodes=[];
 function build(ids){const byBone=new Map();for(const t of ids)for(let i=t*3;i<t*3+3;i++)for(let slot=0;slot<4;slot++){const weight=w[i*4+slot];if(!weight)continue;if(weight<0||!Number.isFinite(weight))throw Error('Unsupported skin weight');const bone=idx[i*4+slot];let a=byBone.get(bone);if(!a){a={bone,p:[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]],w:[Infinity,-Infinity],count:0};byBone.set(bone,a);}a.count++;for(let k=0;k<3;k++){a.p[k][0]=Math.min(a.p[k][0],p[i*3+k]);a.p[k][1]=Math.max(a.p[k][1],p[i*3+k]);}a.w[0]=Math.min(a.w[0],weight);a.w[1]=Math.max(a.w[1],weight);}
  for(const a of byBone.values())if(a.count!==ids.length*3)a.w[0]=0;
  const allP=[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]],sumW=[Infinity,-Infinity];
  for(const t of ids)for(let i=t*3;i<t*3+3;i++){for(let k=0;k<3;k++){allP[k][0]=Math.min(allP[k][0],p[i*3+k]);allP[k][1]=Math.max(allP[k][1],p[i*3+k]);}let total=[0,0];for(let k=0;k<4;k++)total=add(total,[w[i*4+k],w[i*4+k]]);sumW[0]=Math.min(sumW[0],total[0]);sumW[1]=Math.max(sumW[1],total[1]);}
  const node={id:nodes.length,parts:[...byBone.values()],allP,sumW,ids:null,left:null,right:null};nodes.push(node);
  if(ids.length<=8){node.ids=ids;return node;}const spread=[0,1,2].map(k=>Math.max(...ids.map(t=>centers[t][k]))-Math.min(...ids.map(t=>centers[t][k]))),axis=spread.indexOf(Math.max(...spread));ids.sort((a,b)=>centers[a][axis]-centers[b][axis]);const mid=ids.length>>1;node.left=build(ids.slice(0,mid));node.right=build(ids.slice(mid));return node;
 }
 const root=build(centers.map((_,i)=>i));return{geometry:g,root,nodes,vertices,triangles:vertices/3};
}
export function cowDiscreteQuery(r,cache,boxes,{verifyBounds=false}={}){
 if(cache.geometry!==r.card.geometry||r.disposed)throw Error('Unsupported or stale cow cache');
 if(boxes.some(b=>b.length!==6||!b.every(Number.isFinite)||b.some((v,k)=>k<3&&v>b[k+3])))throw Error('Invalid obstacle');
 const matrices=r.card.skeleton.bones.map((b,i)=>new T.Matrix4().multiplyMatrices(b.matrixWorld,r.card.skeleton.boneInverses[i]).elements),inverse=r.card.bindMatrixInverse.elements,world=r.card.matrixWorld.elements,bounds=[],points=new Map(),v=new T.Vector3(),tri=new T.Triangle();let visited=0,leaves=0;
 const point=i=>{let p=points.get(i);if(!p){r.card.getVertexPosition(i,v).applyMatrix4(r.card.matrixWorld);p=v.toArray();points.set(i,p);}return p;};
 const reference=matrices[0],deltas=matrices.map(m=>m.map((x,k)=>[down(x-reference[k]),up(x-reference[k])]));
 function bound(node){if(bounds[node.id])return bounds[node.id];const ref=transform(node.allP,reference),totals=ref.map(x=>mul(x,node.sumW)),magnitudes=[0,0,0];for(const part of node.parts){const m=deltas[part.bone],q=[0,1,2].map(k=>{let a=m[k+12];for(let j=0;j<3;j++)a=add(a,mul(m[k+4*j],part.p[j]));return a;}),absolute=transform(part.p,matrices[part.bone]);for(let k=0;k<3;k++){totals[k]=add(totals[k],mul(q[k],part.w));const x=mul(absolute[k],part.w);magnitudes[k]+=Math.max(Math.abs(x[0]),Math.abs(x[1]));}}
  // Exact skin uses up to four slots; BVH sums by bone. Include the standard
  // floating-point sum-order error, rather than normalize rounded weights.
  const n=16+Math.max(4,node.parts.length),gamma=n*Number.EPSILON/(1-n*Number.EPSILON);for(let k=0;k<3;k++){const error=up(gamma*up(magnitudes[k]));totals[k]=[down(totals[k][0]-error),up(totals[k][1]+error)];}
  const result=transform(transform(totals,inverse),world);bounds[node.id]=result;return result;
 }
 if(verifyBounds){function verify(n){const a=bound(n);if(n.ids){for(const t of n.ids)for(let i=t*3;i<t*3+3;i++){const p=point(i);if(!a.every((v,k)=>p[k]>=v[0]&&p[k]<=v[1]))throw Error('Leaf bound missed actual skin vertex');}}else{verify(n.left);verify(n.right);}}verify(cache.root);}
 const hitBoxes=boxes.map(b=>new T.Box3(new T.Vector3(...b.slice(0,3)),new T.Vector3(...b.slice(3))));
 function walk(node,near){visited++;const a=bound(node),next=near.filter(j=>intersects(a,boxes[j]));if(!next.length)return null;if(!node.ids)return walk(node.left,next)||walk(node.right,next);leaves++;for(const t of node.ids){tri.a.fromArray(point(t*3));tri.b.fromArray(point(t*3+1));tri.c.fromArray(point(t*3+2));for(const j of next)if(hitBoxes[j].intersectsTriangle(tri))return{triangle:t,primitive:j,points:[tri.a.toArray(),tri.b.toArray(),tri.c.toArray()]};}return null;}
 const hit=walk(cache.root,boxes.map((_,i)=>i));return{hit,visited,leaves,verticesRead:points.size,boundsBuilt:bounds.filter(Boolean).length,classification:'DISPLAYED_POSE_ONLY'};
}

// Test-only interval LBS kernel. INPUT REQUIREMENT: every supplied bone-world
// coefficient interval encloses that coefficient for the entire time domain.
// Endpoint ranges/samples do not establish this requirement. This kernel does
// not derive the cow's nonlinear IK/care transform intervals.
const bits=new DataView(new ArrayBuffer(8));
function up(x){if(!Number.isFinite(x))throw Error('Unbounded interval');if(x===0)return Number.MIN_VALUE;bits.setFloat64(0,x);const b=bits.getBigUint64(0);bits.setBigUint64(0,x>0?b+1n:b-1n);return bits.getFloat64(0);}
const down=x=>-up(-x);
export function interval(lo,hi=lo){if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>hi)throw Error('Invalid interval');return[lo,hi];}
const zero=a=>a[0]===0&&a[1]===0,one=a=>a[0]===1&&a[1]===1;
export function add(a,b){if(zero(a))return[...b];if(zero(b))return[...a];return interval(down(a[0]+b[0]),up(a[1]+b[1]));}
export function multiply(a,b){if(zero(a)||zero(b))return[0,0];if(one(a))return[...b];if(one(b))return[...a];const p=[a[0]*b[0],a[0]*b[1],a[1]*b[0],a[1]*b[1]];return interval(down(Math.min(...p)),up(Math.max(...p)));}
export const pointMatrix=m=>m.elements.map(x=>interval(x));
export function affine(m){if(!Array.isArray(m)||m.length!==16)throw Error('Missing affine enclosure');for(const x of m){if(!Array.isArray(x)||x.length!==2)throw Error('Invalid coefficient');interval(...x);}for(const i of[3,7,11])if(!zero(m[i]))throw Error('Projective transform unsupported');if(!one(m[15]))throw Error('Projective transform unsupported');return m;}
export function matrixProduct(a,b){affine(a);affine(b);return Array.from({length:16},(_,i)=>{let v=[0,0];const row=i%4,col=Math.floor(i/4);for(let k=0;k<4;k++)v=add(v,multiply(a[k*4+row],b[col*4+k]));return v;});}
function transform(m,p){return[0,1,2].map(row=>{let v=[0,0];for(let k=0;k<4;k++)v=add(v,multiply(m[k*4+row],k===3?[1,1]:p[k]));return v;});}
export function skinInterval(r,index,boneWorldIntervals){
 const mesh=r.card,g=mesh.geometry;
 if(mesh.morphTargetInfluences?.some(x=>x!==0))throw Error('Morph targets unsupported');
 if(!Number.isInteger(index)||index<0||index>=g.attributes.position.count)throw Error('Invalid skin vertex');
 const p=transform(affine(pointMatrix(mesh.bindMatrix)),[0,1,2].map(k=>interval(g.attributes.position.array[index*3+k])));
 let sum=[[0,0],[0,0],[0,0]];
 for(let k=0;k<4;k++){
  const w=g.attributes.skinWeight.array[index*4+k],j=g.attributes.skinIndex.array[index*4+k];
  if(!Number.isFinite(w)||w<0)throw Error('Invalid skin weight');if(w===0)continue;
  const m=matrixProduct(affine(boneWorldIntervals[j]),pointMatrix(mesh.skeleton.boneInverses[j]));
  const q=transform(m,p);sum=sum.map((v,i)=>add(v,multiply(interval(w),q[i])));
 }
 // Preserve Three's actual order, including non-unit Float32 weight sums.
 // Its final affine translations happen once; do not normalize skin weights.
 return transform(affine(pointMatrix(mesh.matrixWorld)),transform(affine(pointMatrix(mesh.bindMatrixInverse)),sum));
}
export function contains(bounds,p){return bounds.every((b,i)=>p[i]>=b[0]&&p[i]<=b[1]);}

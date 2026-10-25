// Test-only REAL-ARITHMETIC enclosure of the production limb equations.
// Native Math.sin/cos/acos/atan2/hypot implementation error is NOT certified.
// Therefore this must never answer a runtime continuous-clearance request.
import {interval as I,add as A,multiply as M,matrixProduct as MM,pointMatrix,affine} from './cow-skin-interval.mjs';
const data=new DataView(new ArrayBuffer(8));
const P=x=>I(x),N=x=>[-x[1],-x[0]],S=(a,b)=>A(a,N(b));
function up(x){if(!Number.isFinite(x))throw Error('Unbounded domain');if(x===0)return Number.MIN_VALUE;data.setFloat64(0,x);let b=data.getBigUint64(0);data.setBigUint64(0,x>0?b+1n:b-1n);return data.getFloat64(0);}
const down=x=>-up(-x);
const hull=(...xs)=>I(Math.min(...xs.map(x=>x[0])),Math.max(...xs.map(x=>x[1])));
function D(a,b){if(b[0]<=0&&b[1]>=0)throw Error('Unsupported zero denominator; subdivide domain');return M(a,I(down(1/b[1]),up(1/b[0])));}
function sq(a){if(a[0]>=0)return I(Math.max(0,down(a[0]*a[0])),up(a[1]*a[1]));if(a[1]<=0)return sq(N(a));return I(0,up(Math.max(a[0]*a[0],a[1]*a[1])));}
// Exact binary-integer comparison brackets sqrt without assuming Math.sqrt is
// correctly rounded. Its native result is only an initial guess; >8 adjacent
// corrections fails explicitly. Inputs are normal, finite restricted domains.
function dyadic(x){data.setFloat64(0,x);const b=data.getBigUint64(0),e=Number((b>>52n)&2047n);return {n:(b&((1n<<52n)-1n))|(e?1n<<52n:0n),e:e?e-1075:-1074};}
function squareCompare(x,y){const a=dyadic(x),b=dyadic(y),e=Math.min(2*a.e,b.e);const l=a.n*a.n<<BigInt(2*a.e-e),r=b.n<<BigInt(b.e-e);return l<r?-1:l>r?1:0;}
function rootPoint(x){if(x===0)return P(0);if(!(x>0&&Number.isFinite(x)))throw Error('Invalid square root');let lo=Math.sqrt(x),hi=lo,n=0;while(squareCompare(lo,x)>0){lo=down(lo);if(++n>8)throw Error('Unsupported sqrt implementation');}while(squareCompare(hi,x)<0){hi=up(hi);if(++n>8)throw Error('Unsupported sqrt implementation');}return I(lo,hi);}
export function sqrtInterval(x){return I(rootPoint(x[0])[0],rootPoint(x[1])[1]);}
const max=(a,b)=>I(Math.max(a[0],b[0]),Math.max(a[1],b[1]));
const min=(a,b)=>I(Math.min(a[0],b[0]),Math.min(a[1],b[1]));
const clamp=(x,lo,hi)=>max(P(lo),min(P(hi),x));
const sum=xs=>xs.reduce(A,P(0)),dot=(a,b)=>sum(a.map((x,i)=>M(x,b[i])));
const cross=(a,b)=>[S(M(a[1],b[2]),M(a[2],b[1])),S(M(a[2],b[0]),M(a[0],b[2])),S(M(a[0],b[1]),M(a[1],b[0]))];
// A real sum of squares is nonnegative. Intersect that proven range after
// outward addition (whose lower endpoint may be -MIN_VALUE at exact zero).
const norm=a=>sqrtInterval(max(P(0),sum(a.map(sq))));
const normalize=a=>{const d=norm(a);return a.map(x=>D(x,d));};
// Outward Taylor enclosure on |x|<=4. Degree27/26; Lagrange remainder
// |x|^29/29! or |x|^28/28!, calculated with interval operations. No native
// trigonometric call supplies an endpoint. Wide arguments deliberately reject.
export function sinCos(x){I(...x);if(Math.max(Math.abs(x[0]),Math.abs(x[1]))>4)throw Error('Unsupported trigonometric domain');
 function series(cos){let term=cos?P(1):x,out=term;const xx=sq(x);for(let k=1;k<=13;k++){const a=cos?2*k-1:2*k,b=a+1;term=N(D(M(term,xx),P(a*b)));out=A(out,term);}const degree=cos?28:29;let rem=P(1),abs=P(Math.max(Math.abs(x[0]),Math.abs(x[1])));for(let k=1;k<=degree;k++)rem=D(M(rem,abs),P(k));return clamp(A(out,[-rem[1],rem[1]]),-1,1);}
 return {sin:series(false),cos:series(true)};
}
const qmul=(a,b)=>[A(A(M(a[3],b[0]),M(a[0],b[3])),S(M(a[1],b[2]),M(a[2],b[1]))),A(A(M(a[3],b[1]),M(a[1],b[3])),S(M(a[2],b[0]),M(a[0],b[2]))),A(A(M(a[3],b[2]),M(a[2],b[3])),S(M(a[0],b[1]),M(a[1],b[0]))),S(M(a[3],b[3]),sum([M(a[0],b[0]),M(a[1],b[1]),M(a[2],b[2])]))];
const conjugate=q=>[N(q[0]),N(q[1]),N(q[2]),q[3]];
const halfFromCos=c=>({c:sqrtInterval(max(P(0),D(A(P(1),clamp(c,-1,1)),P(2)))),s:sqrtInterval(max(P(0),D(S(P(1),clamp(c,-1,1)),P(2))))});
function halfAlpha(c,s){const h=halfFromCos(c);if(s[1]<0)h.s=N(h.s);else if(s[0]<0)h.s=hull(h.s,N(h.s));return h;}
const qx=h=>[h.s,P(0),P(0),h.c];
function angleDifference(a,b,sign){return {s:S(M(a.s,b.c),M(P(sign),M(a.c,b.s))),c:A(M(a.c,b.c),M(P(sign),M(a.s,b.s)))};}
export function compose(p,q,scale=[P(1),P(1),P(1)]){const [x,y,z,w]=q,x2=M(P(2),x),y2=M(P(2),y),z2=M(P(2),z),xx=M(x,x2),xy=M(x,y2),xz=M(x,z2),yy=M(y,y2),yz=M(y,z2),zz=M(z,z2),wx=M(w,x2),wy=M(w,y2),wz=M(w,z2);
 return [M(S(P(1),A(yy,zz)),scale[0]),M(A(xy,wz),scale[0]),M(S(xz,wy),scale[0]),P(0),M(S(xy,wz),scale[1]),M(S(P(1),A(xx,zz)),scale[1]),M(A(yz,wx),scale[1]),P(0),M(A(xz,wy),scale[2]),M(S(yz,wx),scale[2]),M(S(P(1),A(xx,yy)),scale[2]),P(0),...p,P(1)];
}
function basis(a,b,c){return [...a,P(0),...b,P(0),...c,P(0),P(0),P(0),P(0),P(1)];}
// Three's actual four setFromRotationMatrix branches. A branch's selected
// radicand is >=1: trace>0, or selected diagonal >=trace/3 with trace<=0.
// This is valid even for normalized-column matrices containing shear.
export function quaternionFromMatrix(m){const d=[m[0],m[5],m[10]],tr=sum(d),out=[];
 if(tr[1]>0){const s=D(P(.5),sqrtInterval(max(P(1),A(tr,P(1)))));out.push([M(S(m[6],m[9]),s),M(S(m[8],m[2]),s),M(S(m[1],m[4]),s),D(P(.25),s)]);}
 if(tr[0]<=0)for(let j=0;j<3;j++){const a=(j+1)%3,b=(j+2)%3;if(d[j][1]<Math.max(d[a][0],d[b][0]))continue;const s=M(P(2),sqrtInterval(max(P(1),S(A(P(1),d[j]),A(d[a],d[b])))));let q;
  if(j===0)q=[M(P(.25),s),D(A(m[4],m[1]),s),D(A(m[8],m[2]),s),D(S(m[6],m[9]),s)];
  if(j===1)q=[D(A(m[4],m[1]),s),M(P(.25),s),D(A(m[9],m[6]),s),D(S(m[8],m[2]),s)];
  if(j===2)q=[D(A(m[8],m[2]),s),D(A(m[9],m[6]),s),M(P(.25),s),D(S(m[1],m[4]),s)];out.push(q);
 }
 if(!out.length)throw Error('Unsupported quaternion branch');return out[0].map((_,k)=>hull(...out.map(q=>q[k])));
}
export function inverseAffine(m){affine(m);const a=[m[0],m[1],m[2]],b=[m[4],m[5],m[6]],c=[m[8],m[9],m[10]],rows=[cross(b,c),cross(c,a),cross(a,b)],det=dot(a,rows[0]);if(det[0]<=0)throw Error('Unsupported singular or reflected carrier');const r=rows.map(row=>row.map(x=>D(x,det))),p=m.slice(12,15);return [r[0][0],r[1][0],r[2][0],P(0),r[0][1],r[1][1],r[2][1],P(0),r[0][2],r[1][2],r[2][2],P(0),...r.map(row=>N(dot(row,p))),P(1)];}
// Exact real equivalent of blendMatrix(...,1), including target TRS projection.
// Does NOT cancel inv(body)*root through this projection.
export function recompose(m){const scale=[0,4,8].map(i=>norm(m.slice(i,i+3)));const normalized=m.map(x=>[...x]);for(let c=0;c<3;c++)for(let r=0;r<3;r++)normalized[c*4+r]=D(m[c*4+r],scale[c]);return compose(m.slice(12,15),quaternionFromMatrix(normalized),scale);}
export function bodyMatrix({y=I(1.03),yaw=I(0),roll=I(0),scaleY=I(1)}){if(scaleY[0]<=0)throw Error('Unsupported body scale');const Y=sinCos(D(yaw,P(2))),Z=sinCos(D(roll,P(2)));return compose([P(0),y,P(0)],qmul([P(0),Y.sin,P(0),Y.cos],[P(0),P(0),Z.sin,Z.cos]),[P(1),scaleY,P(1)]);}
function validation(p){for(const k of ['tx','tz','lift'])I(...p[k]);if(Math.max(...p.tx.map(Math.abs),...p.tz.map(Math.abs))>.5||p.lift[0]<-.1||p.lift[1]>.25)throw Error('Unsupported limb domain');}
const C={u:.36,l:.37,hoof:.055,hip:.77,reach:.36+.37-.001};
function law(d){return {delta:halfFromCos(clamp(D(S(A(P(C.u*C.u),sq(d)),P(C.l*C.l)),M(P(2*C.u),d)),-1,1)),bend:halfFromCos(clamp(D(S(S(sq(d),P(C.u*C.u)),P(C.l*C.l)),P(2*C.u*C.l)),-1,1))};}
export function ordinaryLeg(leg,p,body,{planted=false,footYaw=I(0),nativeCertificate=false}={}){
 if(nativeCertificate)throw Error('Native transcendental-error contract unproved; integration held');validation(p);if(!Number.isFinite(leg.x)||!Number.isFinite(leg.z)||leg.z===0)throw Error('Unsupported leg');
 const {tx,tz,lift}=p,sign=leg.z<0?1:-1,reachHeight=sqrtInterval(max(P(.01),S(S(P(C.reach*C.reach),sq(tx)),sq(tz)))),rootY=min(P(C.hip),A(A(P(C.hoof),lift),reachHeight)),y=S(S(rootY,P(C.hoof)),lift),length=norm([tx,y,tz]);if(y[0]<=0)throw Error('Unsupported above-hip foot');
 const d=min(P(C.reach),length),T=[D(tx,length),N(D(y,length)),D(tz,length)],an=sqrtInterval(max(P(1e-12),S(P(1),sq(T[0])))),H=[D(S(P(1),sq(T[0])),an),N(D(M(T[0],T[1]),an)),N(D(M(T[0],T[2]),an))],dh=N(H[1]),E=normalize([N(M(dh,H[0])),S(P(-1),M(dh,H[1])),N(M(dh,H[2]))]);
 const alpha=halfAlpha(dot(E,T),dot(cross(E,T),H)),angles=law(d),rootQ=qmul(quaternionFromMatrix(basis(H,E.map(N),cross(H,E.map(N)))),qx(angleDifference(alpha,angles.delta,sign))),root=compose([P(leg.x),rootY,P(leg.z)],rootQ),kneeQ=qx({s:M(P(sign),angles.bend.s),c:angles.bend.c});
 const yaw=sinCos(D(footYaw,P(2))),footQ=planted?[P(0),yaw.sin,P(0),yaw.cos]:[P(0),P(0),P(0),P(1)];
 return {classification:'REAL_FORMULA_ENCLOSURE_NATIVE_UNCERTIFIED',hip:MM(inverseAffine(body),root),knee:compose([P(0),P(-C.u),P(0)],kneeQ),foot:compose([P(0),P(-C.l),P(0)],qmul(conjugate(qmul(quaternionFromMatrix(root),kneeQ)),footQ)),root,domains:{y,d,hingeDenominator:an}};
}
export function lieLeg(leg,weight,body,{nativeCertificate=false}={}){if(nativeCertificate)throw Error('Native transcendental-error contract unproved; integration held');I(...weight);if(weight[0]<0||weight[1]>1)throw Error('Unsupported lie weight');
 const sign=leg.z<0?1:-1,rootY=S(P(C.hip),M(P(.58),weight)),y=S(rootY,P(C.hoof)),tz=M(P(sign*.12),weight),d=norm([y,tz]),alpha=halfAlpha(D(y,d),N(D(tz,d))),a=law(d),angle=angleDifference(alpha,a.delta,sign),root=compose([P(leg.x),rootY,P(leg.z)],qx(angle)),kneeQ=qx({s:M(P(sign),a.bend.s),c:a.bend.c}),footQ=conjugate(qmul(qx(angle),kneeQ));
 return {classification:'REAL_FORMULA_ENCLOSURE_NATIVE_UNCERTIFIED',hip:recompose(MM(inverseAffine(body),root)),knee:recompose(compose([P(0),P(-C.u),P(0)],kneeQ)),foot:recompose(compose([P(0),P(-C.l),P(0)],footQ)),root,domains:{d}};
}
// Recovery parameters cover BOTH recorded evaluated rt and next stored rt.
// Caller must supply the actually evaluated phase; reconstructing it from the
// post-update state alone is forbidden. Plant/release remains a union at callsite.
export function recoveryParameters(leg,{evaluatedRt,storedRt,yaw,nz,lift}){for(const x of[evaluatedRt,storedRt,yaw,nz,lift])I(...x);if(evaluatedRt[0]<0||storedRt[1]>1||evaluatedRt[1]>storedRt[1])throw Error('Unsupported recovery provenance');const rt=hull(evaluatedRt,storedRt),w=S(P(1),M(sq(rt),S(P(3),M(P(2),rt)))),sc=sinCos(yaw);
 const tx=M(S(S(M(P(leg.rax),sc.cos),M(P(leg.raz),sc.sin)),P(leg.x)),w),tz=A(nz,M(S(S(A(M(P(leg.rax),sc.sin),M(P(leg.raz),sc.cos)),P(leg.z)),P(leg.rnz)),w));
 let h=max(P(0),S(lift,M(P(leg.ry||0),w)));if(leg.r0>1e-4){const arch=sinCos(M(P(Math.PI),rt)).sin;h=max(h,M(sq(arch),P(Math.min(.08,leg.r0*.25))));}
 // Branch rt==1 overrides residual exactly. Reach clipping can only reduce
 // coordinates toward zero; union zero when its guard may be active.
 const possibleClamp=norm([tx,tz])[1]>.34;return {tx:possibleClamp?hull(tx,P(0)):tx,tz:possibleClamp?hull(tz,P(0)):tz,lift:h,rt,mayReachClamp:possibleClamp};
}
export function unionLeg(...poses){return Object.fromEntries(['hip','knee','foot'].map(k=>[k,poses[0][k].map((_,i)=>hull(...poses.map(p=>p[k][i])))]));}
// Domain is the actual pre-support foot expressed in model coordinates. A
// support-cell classifier must establish height; this mapper does not infer
// slab membership from the root or authorize arbitrary terrain domains.
export function supportParameters(leg,localFoot,{height,rootHeight,scale}){localFoot.forEach(x=>I(...x));[height,rootHeight,scale].forEach(x=>I(...x));if(height[0]<0||height[1]>.08||scale[0]<=0)throw Error('Unsupported support domain');return {tx:S(localFoot[0],P(leg.x)),tz:S(localFoot[2],P(leg.z)),lift:A(S(localFoot[1],P(.055)),D(S(height,rootHeight),scale))};}
export const intervalMath={I,P,A,M,S,D,N,sq,hull,sqrtInterval,MM,pointMatrix};

// Cows keep a personal-space cushion (owner request 2026-10-30): another cow inside PERSONAL metres turns
// this cow away well before the 0.85 m body contact distance. The chosen side is held for COOLDOWN
// seconds (hysteresis), so two cows meeting head-on peel off to one side instead of flip-flopping
// left/right every frame, which used to spin the 3D heading solver and cost frame time.
export const COW_CONTACT=.85,COW_PERSONAL=1.5,COW_AVOID_COOLDOWN=1.2;
// pos/want: {x,y} (y is world z). others: [{id,x,y}]. state: a plain object kept on the cow.
// Returns {x,y,redirect}: adjusted desired velocity, and redirect=true when the cow should drop its
// current target and choose a new direction (a cow is inside the inner half of the cushion ahead of it).
export function steerCowPersonalSpace(pos,want,others,state,t){
  const speed=Math.hypot(want.x,want.y);let near=null,nd=Infinity;
  for(const o of others){const d=Math.hypot(pos.x-o.x,pos.y-o.y);if(d<COW_PERSONAL&&d<nd){nd=d;near=o;}}
  if(!near){if(!(state.until>t)){state.id=undefined;state.side=0;state.since=undefined;}return {x:want.x,y:want.y,redirect:false};}
  const ax=(pos.x-near.x)/(nd||1),ay=(pos.y-near.y)/(nd||1); // away from the other cow
  const k0=Math.max(0,Math.min(1,(COW_PERSONAL-nd)/(COW_PERSONAL-COW_CONTACT)));
  if(speed<1e-3)return {x:ax*.35*k0,y:ay*.35*k0,redirect:false}; // a standing cow only eases straight away
  const wx=speed?want.x/speed:-ax,wy=speed?want.y/speed:-ay;
  const ahead=-(wx*ax+wy*ay); // >0 when heading toward the other cow
  if(state.id!==near.id){state.since=t;}
  if(state.id!==near.id||(!(state.until>t)&&!state.side)){
    // Turn away from the side the other cow is on; ties break by id so the two cows pick opposite sides.
    const cross=wx*(-ay)-wy*(-ax);
    state.side=Math.abs(cross)>1e-3?(cross>0?-1:1):(String(near.id)<String(state.selfId)?1:-1);
    state.id=near.id;
  }
  state.until=t+COW_AVOID_COOLDOWN; // the side is kept while this cow stays near, and briefly after
  const k=Math.max(0,Math.min(1,(COW_PERSONAL-nd)/(COW_PERSONAL-COW_CONTACT)));
  const tx=-ay*state.side,ty=ax*state.side; // tangent around the other cow
  let dx=wx*(1-k)+tx*(.6+k*.4)+ax*k*1.2,dy=wy*(1-k)+ty*(.6+k*.4)+ay*k*1.2;
  const toward=-(dx*ax+dy*ay);if(toward>0){dx+=ax*toward;dy+=ay*toward;} // never close the gap
  const n=Math.hypot(dx,dy)||1,s=Math.max(speed,.3)*(1-.4*k);
  // Give up the current target when heading into the inner cushion, or after circling the same cow too long.
  const redirect=((ahead>.3&&nd<(COW_PERSONAL+COW_CONTACT)/2)||t-state.since>2*COW_AVOID_COOLDOWN)&&!(state.redirectUntil>t);
  if(redirect)state.redirectUntil=t+2*COW_AVOID_COOLDOWN; // one new direction per encounter window
  return {x:dx/n*s,y:dy/n*s,redirect};
}

'use strict';
const base=require('./integration.cjs');
const transforms=[
 ['const transitStatus=cowCareTransitStatus(a,task,p);let transitCommitted=false;','const transitStatus=cowCareTransitStatus(a,task,p);let transitCommitted=false,pendingCowSpace=null;'],
 ['const sv=steerCowPersonalSpace(a.pos,{x:nx/(dt||1),y:nz/(dt||1)},others,a.cowSpace,t),sl=Math.hypot(sv.x,sv.y);',
 `let sv=steerCowPersonalSpace(a.pos,{x:nx/(dt||1),y:nz/(dt||1)},others,a.cowSpace,t);
        // A care route cannot honor redirect by dropping its station. Instead trial the
        // other hysteresis side; all ordinary body, gate and static checks still decide movement.
        if(transitStatus===1&&d>.6&&sv.redirect&&(sv.x*dx+sv.y*dz)<=0&&(a.cowSpace.side===1||a.cowSpace.side===-1)){
          const trial={...a.cowSpace,side:-a.cowSpace.side};
          const alternate=steerCowPersonalSpace(a.pos,{x:nx/(dt||1),y:nz/(dt||1)},others,trial,t);
          const alternateLength=Math.hypot(alternate.x,alternate.y);
          if(alternateLength>1e-6&&alternate.x*dx+alternate.y*dz>0&&Math.hypot(dx-alternate.x/alternateLength*step,dz-alternate.y/alternateLength*step)<d-1e-9){sv=alternate;pendingCowSpace=trial;}
        }
        const sl=Math.hypot(sv.x,sv.y);`],
 ['a.g.position.z=next.y;transitCommitted=true;','a.g.position.z=next.y;transitCommitted=true;if(pendingCowSpace&&preferredClear)a.cowSpace=pendingCowSpace;']
];
function once(s,a,b){if(s.split(a).length!==2)throw Error('social recovery occurrence');return s.replace(a,b);}
function patch(input){let s=base.patch(input).toString();for(const[a,b]of transforms)s=once(s,a,b);return Buffer.from(s);}
function inverse(input){let s=Buffer.from(input).toString();for(const[a,b]of [...transforms].reverse())s=once(s,b,a);return base.inverse(Buffer.from(s));}
module.exports={patch,inverse,transforms};

'use strict';
const assert=require('node:assert/strict');
function editBarFits(){
 const buttons=[...document.querySelectorAll('#editBar button')],vw=innerWidth,vh=innerHeight;
 return {count:buttons.length,allFit:buttons.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.top>=0&&r.right<=vw&&r.bottom<=vh;})};
}
async function assertEditBarFits(page){const v=await page.evaluate(editBarFits);assert.equal(v.count,3,'All original edit controls are present');assert.equal(v.allFit,true,'Every edit control has a 44px target fully inside viewport');}
module.exports={editBarFits,assertEditBarFits};

// Stable scene identities. Hill IDs use the authored tree seed, not array order
// or world position, so moving a tree never changes its saved removal record.
export const REMOVABLE_TREE_IDS=Object.freeze([
 'courtyard:tree','courtyard:tree2',
 ...Array.from({length:14},(_,i)=>`hill:seed-${40+i}`)
]);
const known=new Set(REMOVABLE_TREE_IDS);
export function decodeRemovedTrees(value){
 if(value===undefined)return {ok:true,ids:[]};
 if(!Array.isArray(value)||value.length>REMOVABLE_TREE_IDS.length)return {ok:false,code:'INVALID'};
 const seen=new Set();
 for(const id of value){if(typeof id!=='string'||!known.has(id)||seen.has(id))return {ok:false,code:'UNKNOWN_OR_DUPLICATE'};seen.add(id);}
 return {ok:true,ids:[...seen].sort()};
}
export function addRemovedTree(value,id){
 const parsed=decodeRemovedTrees(value);
 if(!parsed.ok||!known.has(id)||parsed.ids.includes(id))return null;
 return [...parsed.ids,id].sort();
}

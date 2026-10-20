import test from 'node:test';
import assert from 'node:assert/strict';
import {G,T,at,reset} from './chicken-game-fixture.mjs';

const WINDOW=6*60*60*1000;
function farm(){const s=reset(30);s.barn={egg:29,milk:7,wheat:3};s.gold={egg:5,milk:2};return s;}
function quote(id,n){assert.equal(typeof G.marketSalesQuote,'function','Market Sales quotes must exist');return G.marketSalesQuote(id,n);}
function sell(q){assert.equal(typeof G.sellMarketGoods,'function');return G.sellMarketGoods(q.id,q.lots,q.revision);}

// These contracts catch a rerolled quote, fractional-dozen sale, duplicate payout,
// discarded gold bonus, stale confirmation or mutation of a read-only farm.
test('barn exposes Market Sales and renders whole-dozen, gallon and quoted payout controls',()=>{
 farm();const query=document.querySelector;document.querySelector=s=>s==='.pbody'?null:query(s);
 try{
  G.openPanel('barn');assert.match(query('#panelRoot').innerHTML,/data-p="marketSales"/);
  G.openPanel('marketSales');const html=query('#panelRoot').innerHTML;
  assert.match(html,/29 eggs in barn/);assert.match(html,/2 whole dozen · 5 left over/);assert.match(html,/7 gallons in barn/);
  assert.match(html,/data-market-qty="egg"/);assert.match(html,/data-market-total="milk"/);assert.match(html,/data-quote=/);assert.match(html,/Back to Barn/);
 }finally{G.closePanel();document.querySelector=query;}
});
test('quotes hold across six real hours, reopening and save/load without save-schema changes',()=>{
 const s=farm();const before=JSON.stringify(s),q=quote('egg',1);
 assert.equal(q.itemsPerLot,12);assert.equal(q.base,120);assert(q.rate>=96&&q.rate<=144);
 assert.equal(q.endsAt,WINDOW);assert.equal(q.maxLots,2);assert.equal(q.leftover,5);
 assert.equal(JSON.stringify(s),before,'viewing prices must not mutate a farm');
 at(WINDOW-1);assert.deepEqual(quote('egg',1),q);G.save();G.load();assert.deepEqual(quote('egg',1),q);
 at(WINDOW);const next=quote('egg',1);assert.equal(next.windowId,q.windowId+1);assert.notEqual(next.revision,q.revision);
 assert.equal(G.S.v,1);assert.equal(G.S.market,undefined);assert.equal(G.S.marketSales,undefined);
});
test('milk mapping keeps existing stock as gallons, price bounds and same-window deterministic quotes',()=>{
 farm();const rates=new Set();for(let i=0;i<50;i++){at(i*WINDOW+T);const q=quote('milk',1);assert.equal(q.itemsPerLot,1);assert.equal(q.base,18);assert(q.rate>=15&&q.rate<=21);rates.add(q.rate);assert.deepEqual(quote('milk',1),q);}assert(rates.size>1);
});
test('selling whole dozens pays the displayed gold-inclusive amount and preserves leftover stock',()=>{
 const s=farm(),q=quote('egg',2),coins=s.coins,earned=s.stats.earned,other=s.barn.wheat;
 assert.equal(q.items,24);assert.equal(q.goldItems,5);assert.equal(q.total,2*q.rate+Math.round(q.rate*5/12));
 assert.equal(sell(q),true);assert.equal(s.coins,coins+q.total);assert.equal(s.stats.earned,earned+q.total);
 assert.equal(s.barn.egg,5);assert.equal(G.goldOf('egg'),0);assert.equal(s.barn.milk,7);assert.equal(s.barn.wheat,other);
 const paid=JSON.stringify(s);assert.equal(sell(q),false);assert.equal(JSON.stringify(s),paid,'a repeated confirmation cannot pay twice');
 const saved=JSON.parse(localStorage.getItem(G.SAVE_KEY));assert.equal(saved.coins,s.coins);assert.equal(saved.barn.egg,5);assert.equal(saved.pens.chicken.list.length,30);
});
test('gold milk doubles its part and Haggler applies to the visible quote',()=>{
 const s=farm();s.perks.sell=2;const q=quote('milk',7),coins=s.coins;
 assert.equal(q.base,22,'same per-item rounding as the existing Haggler price');assert.equal(q.total,q.rate*9);
 assert.equal(sell(q),true);assert.equal(s.coins,coins+q.total);assert.equal(G.have('milk'),0);assert.equal(G.goldOf('milk'),0);
});
test('quote expiry, changed stock, gold or perks reject stale sales without mutation',()=>{
 for(const change of [s=>at(WINDOW),s=>s.barn.egg--,s=>s.gold.egg--,s=>s.perks.sell++]){
  const s=farm(),q=quote('egg',1);change(s);const before=JSON.stringify(s);assert.equal(sell(q),false);assert.equal(JSON.stringify(s),before);
 }
});
test('invalid, fractional, insufficient and unsupported sale requests never spend or pay',()=>{
 const s=farm();const before=JSON.stringify(s);
 for(const n of [0,-1,.5,3,NaN,Infinity,'1',Number.MAX_SAFE_INTEGER]){const q=quote('egg',n);assert.equal(q.canSell,false);assert.equal(G.sellMarketGoods('egg',n,q.revision),false);}
 assert.equal(quote('wheat',1),null);assert.equal(G.sellMarketGoods('wheat',1,'anything'),false);
 assert.equal(G.sellMarketGoods('egg',1,undefined),false);assert.equal(JSON.stringify(s),before);
});
test('visiting, cloud replacement and future-version saves reject market mutations',()=>{
 farm();G.save();G.visitFarm(JSON.parse(localStorage.getItem(G.SAVE_KEY)));let before=JSON.stringify(G.S);assert.equal(sell(quote('milk',1)),false);assert.equal(JSON.stringify(G.S),before);G.leaveVisit();
 window.__saHold=true;before=JSON.stringify(G.S);assert.equal(sell(quote('milk',1)),false);assert.equal(JSON.stringify(G.S),before);delete window.__saHold;
 const future=JSON.parse(localStorage.getItem(G.SAVE_KEY));future.v=999;localStorage.setItem(G.SAVE_KEY,JSON.stringify(future));G.load();before=JSON.stringify(G.S);assert.equal(sell(quote('milk',1)),false);assert.equal(JSON.stringify(G.S),before);
});

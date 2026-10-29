// Local farm sales only; no Firebase trading-post goods or new save fields.
export const MARKET_WINDOW_MS=6*60*60*1000;
const GOODS={egg:{itemsPerLot:12,unit:'dozen'},milk:{itemsPerLot:1,unit:'gallon'}};
const whole=n=>Number.isSafeInteger(n)&&n>=0;

export function quoteMarketGoods({id,lots,stock,gold,unitPrice,at}){
 const goods=Object.hasOwn(GOODS,id)?GOODS[id]:null;
 if(!goods||!Number.isFinite(at)||at<0||!whole(unitPrice)||unitPrice<1)return null;
 const {itemsPerLot,unit}=goods,windowId=Math.floor(at/MARKET_WINDOW_MS);
 const base=unitPrice*itemsPerLot;
 if(!Number.isSafeInteger(base))return null;
 // Stable across reopens, reloads and devices with the same clock. Neither farm
 // RNG nor a saved quote is consumed. Six-hour boundaries are anchored to UTC.
 let seed=(windowId^(id==='egg'?0x45d9f3b:0x27d4eb2d))>>>0;
 seed=Math.imul(seed^(seed>>>16),0x45d9f3b)>>>0;seed^=seed>>>16;
 const min=Math.ceil(base*.8),max=Math.floor(base*1.2);
 const rate=min+((seed>>>0)%(max-min+1));
 const validStock=whole(stock)&&whole(gold)&&gold<=stock;
 const maxLots=validStock?Math.floor(stock/itemsPerLot):0;
 const validLots=whole(lots)&&lots>0&&lots<=maxLots;
 const items=validLots?lots*itemsPerLot:0,goldItems=validLots?Math.min(items,gold):0;
 const bonus=Math.round(rate*goldItems/itemsPerLot),total=validLots?rate*lots+bonus:0;
 const canSell=validLots&&Number.isSafeInteger(total)&&total>0;
 const revision=[1,windowId,id,lots,stock,gold,unitPrice,rate,total].join(':');
 return {id,lots,itemsPerLot,unit,windowId,endsAt:(windowId+1)*MARKET_WINDOW_MS,
  base,rate,maxLots,leftover:validStock?stock%itemsPerLot:0,items,goldItems,bonus,total,canSell,revision};
}

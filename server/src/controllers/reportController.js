import Order from '../models/Order.js';
import WalkInSale from '../models/WalkInSale.js';
import CashEntry from '../models/CashEntry.js';
import Product from '../models/Product.js';

const IST_OFFSET=330*60*1000;
const money=n=>Math.round((Number(n)||0)*100)/100;
const sum=(rows,fn)=>money(rows.reduce((total,row)=>total+Number(fn(row)||0),0));

function currentIstParts(){
  const d=new Date(Date.now()+IST_OFFSET);
  return {y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate()};
}
function parseAnchor(value){
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));
  if(!match)return currentIstParts();
  const y=Number(match[1]),m=Number(match[2]),d=Number(match[3]);
  const probe=new Date(Date.UTC(y,m-1,d));
  if(probe.getUTCFullYear()!==y||probe.getUTCMonth()!==m-1||probe.getUTCDate()!==d)return currentIstParts();
  return {y,m,d};
}
function shift(parts,days){
  const date=new Date(Date.UTC(parts.y,parts.m-1,parts.d)+days*86400000);
  return {y:date.getUTCFullYear(),m:date.getUTCMonth()+1,d:date.getUTCDate()};
}
function localStart(parts){return new Date(Date.UTC(parts.y,parts.m-1,parts.d)-IST_OFFSET)}
function isoDay(parts){return `${parts.y}-${String(parts.m).padStart(2,'0')}-${String(parts.d).padStart(2,'0')}`}
function rangeFor(period,anchorValue){
  const anchor=parseAnchor(anchorValue);let startParts,endParts;
  if(period==='weekly'){
    const weekday=new Date(Date.UTC(anchor.y,anchor.m-1,anchor.d)).getUTCDay();
    startParts=shift(anchor,weekday===0?-6:1-weekday);endParts=shift(startParts,7);
  }else if(period==='monthly'){
    startParts={y:anchor.y,m:anchor.m,d:1};
    const next=new Date(Date.UTC(anchor.y,anchor.m,1));
    endParts={y:next.getUTCFullYear(),m:next.getUTCMonth()+1,d:1};
  }else if(period==='yearly'){
    startParts={y:anchor.y,m:1,d:1};endParts={y:anchor.y+1,m:1,d:1};
  }else{
    startParts=anchor;endParts=shift(anchor,1);
  }
  const start=localStart(startParts),end=localStart(endParts);
  const fmt=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric'});
  let label;
  if(period==='daily')label=fmt.format(start);
  else if(period==='monthly')label=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',month:'long',year:'numeric'}).format(start);
  else if(period==='yearly')label=String(startParts.y);
  else label=`${fmt.format(start)} – ${fmt.format(new Date(end.getTime()-1))}`;
  return {anchor:isoDay(anchor),start,end,startDay:isoDay(startParts),endDay:isoDay(shift(endParts,-1)),label};
}
function orderNumbers(order){
  const itemRevenue=(order.items||[]).reduce((s,i)=>s+(Number(i.price)||0)*(Number(i.quantity)||0),0);
  const cost=(order.items||[]).reduce((s,i)=>s+(Number(i.costPrice)||0)*(Number(i.quantity)||0),0);
  const discount=Number(order.discount)||0;
  const productRevenue=Math.max(itemRevenue-discount,0);
  return {sales:money(order.total||productRevenue),productRevenue:money(productRevenue),cost:money(cost),profit:money(productRevenue-cost)};
}
function posNumbers(sale){
  const itemRevenue=(sale.items||[]).reduce((s,i)=>s+(Number(i.price)||0)*(Number(i.quantity)||0),0);
  const cost=(sale.items||[]).reduce((s,i)=>s+(Number(i.costPrice)||0)*(Number(i.quantity)||0),0);
  const discount=Number(sale.discount)||0;
  const productRevenue=Math.max(itemRevenue-discount,0);
  return {sales:money(sale.total||productRevenue),productRevenue:money(productRevenue),cost:money(cost),profit:money(productRevenue-cost)};
}

export async function reportCenter(req,res,next){
  try{
    const allowed=new Set(['daily','weekly','monthly','yearly']);
    const period=allowed.has(String(req.query.period))?String(req.query.period):'daily';
    const range=rangeFor(period,req.query.anchor);
    const timeFilter={$gte:range.start,$lt:range.end};
    const [orders,posSales,cashEntries,products]=await Promise.all([
      Order.find({createdAt:timeFilter,status:{$ne:'Cancelled'},paymentStatus:{$ne:'Refunded'}}).populate('user','name').sort({createdAt:-1}).limit(10000).lean(),
      WalkInSale.find({createdAt:timeFilter,paymentStatus:'Paid'}).sort({createdAt:-1}).limit(10000).lean(),
      CashEntry.find({entryDate:timeFilter}).sort({entryDate:-1,createdAt:-1}).limit(10000).lean(),
      Product.find().select('price costPrice stock').lean()
    ]);

    const onlineRows=orders.map(order=>{
      const n=orderNumbers(order);
      return {date:order.createdAt,reference:`ORD-${String(order._id).slice(-8).toUpperCase()}`,channel:'Online',customer:order.user?.name||order.shippingAddress?.fullName||'Customer',paymentMethod:order.paymentMethod,paymentStatus:order.paymentStatus,status:order.status,...n};
    });
    const posRows=posSales.map(sale=>{
      const n=posNumbers(sale);
      return {date:sale.createdAt,reference:sale.billNo||`POS-${String(sale._id).slice(-8).toUpperCase()}`,channel:'POS / Shop',customer:sale.customer?.name||'Walk-in Customer',paymentMethod:sale.paymentMethod,paymentStatus:sale.paymentStatus,status:'Completed',...n};
    });
    const sales=[...onlineRows,...posRows].sort((a,b)=>new Date(b.date)-new Date(a.date));
    const profit=sales.map(row=>({...row,marginPercent:row.productRevenue>0?money((row.profit/row.productRevenue)*100):0}));
    const expenses=cashEntries.filter(x=>x.type==='expense').map(x=>({date:x.entryDate||x.createdAt,category:x.category,note:x.note||'',amount:money(x.amount)}));
    const cash=cashEntries.map(x=>({date:x.entryDate||x.createdAt,type:x.type,category:x.category,note:x.note||'',amount:money(x.amount)}));

    const expenseMap=new Map();
    for(const row of expenses)expenseMap.set(row.category,money((expenseMap.get(row.category)||0)+row.amount));
    const expenseByCategory=[...expenseMap.entries()].map(([category,total])=>({category,total})).sort((a,b)=>b.total-a.total);

    const onlineSales=sum(onlineRows,r=>r.sales),posSalesTotal=sum(posRows,r=>r.sales),totalSales=money(onlineSales+posSalesTotal);
    const productRevenue=sum(profit,r=>r.productRevenue),totalCost=sum(profit,r=>r.cost),grossProfit=sum(profit,r=>r.profit);
    const onlineProfit=sum(onlineRows,r=>r.profit),posProfit=sum(posRows,r=>r.profit);
    const totalExpense=sum(expenses,r=>r.amount),cashIn=sum(cash.filter(x=>x.type==='income'),r=>r.amount),cashOut=sum(cash.filter(x=>x.type==='expense'),r=>r.amount);
    const stockCost=money(products.reduce((s,p)=>s+(Number(p.costPrice)||0)*(Number(p.stock)||0),0));
    const stockRetail=money(products.reduce((s,p)=>s+(Number(p.price)||0)*(Number(p.stock)||0),0));

    res.setHeader('Cache-Control','no-store, private');
    res.json({
      period,
      range:{anchor:range.anchor,start:range.start.toISOString(),end:range.end.toISOString(),startDay:range.startDay,endDay:range.endDay,label:range.label},
      summary:{
        sales:{total:totalSales,online:onlineSales,pos:posSalesTotal,transactions:sales.length,averageBill:sales.length?money(totalSales/sales.length):0},
        profit:{gross:grossProfit,online:onlineProfit,pos:posProfit,productRevenue,totalCost,marginPercent:productRevenue>0?money((grossProfit/productRevenue)*100):0},
        expenses:{total:totalExpense,entries:expenses.length,average:expenses.length?money(totalExpense/expenses.length):0},
        cash:{income:cashIn,expense:cashOut,net:money(cashIn-cashOut),entries:cash.length},
        stock:{cost:stockCost,retail:stockRetail}
      },
      sales,profit,expenses,cash,expenseByCategory
    });
  }catch(error){next(error)}
}

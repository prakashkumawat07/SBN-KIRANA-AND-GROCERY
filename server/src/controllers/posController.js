import crypto from 'crypto';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import WalkInSale from '../models/WalkInSale.js';
import CashEntry from '../models/CashEntry.js';

const money=n=>Math.round((Number(n)||0)*100)/100;
const clean=(v,max=160)=>String(v||'').trim().replace(/[<>\u0000-\u001F]/g,'').slice(0,max);
function fail(message,status=400){const e=new Error(message);e.status=status;throw e}

export async function posSales(req,res,next){
  try{res.setHeader('Cache-Control','no-store, private');res.json(await WalkInSale.find().populate('createdBy','name email').sort({createdAt:-1}).limit(250))}catch(e){next(e)}
}

export async function posSummary(req,res,next){
  try{
    const [paid,pending]=await Promise.all([
      WalkInSale.find({paymentStatus:'Paid'}).sort({createdAt:1}).lean(),
      WalkInSale.countDocuments({paymentStatus:'Pending'})
    ]);
    const revenue=money(paid.reduce((s,x)=>s+(x.total||0),0));
    const grossProfit=money(paid.reduce((s,x)=>s+(x.items||[]).reduce((a,i)=>a+((i.price||0)-(i.costPrice||0))*(i.quantity||0),0)-(x.discount||0),0));
    const salesByDay={};
    for(const sale of paid){const key=new Date(sale.createdAt).toISOString().slice(0,10);salesByDay[key]=(salesByDay[key]||0)+(sale.total||0)}
    const today=new Date();today.setHours(0,0,0,0);
    const salesToday=money(paid.filter(x=>new Date(x.createdAt)>=today).reduce((s,x)=>s+(x.total||0),0));
    res.json({revenue,grossProfit,sales:paid.length,pendingPayments:pending,salesToday,averageSale:paid.length?money(revenue/paid.length):0,salesByDay:Object.entries(salesByDay).slice(-30).map(([date,total])=>({date,total:money(total)}))});
  }catch(e){next(e)}
}

export async function createPosSale(req,res,next){
  let session;
  try{
    const requested=Array.isArray(req.body.items)?req.body.items:[];
    if(!requested.length)fail('Add at least one product');
    if(requested.length>75)fail('Too many products in one POS bill');
    const combined=new Map();
    for(const row of requested){
      const id=String(row?.product||'');const quantity=Number(row?.quantity);
      if(!mongoose.isValidObjectId(id)||!Number.isInteger(quantity)||quantity<1||quantity>200)fail('Every sale item needs a valid product and quantity from 1 to 200');
      combined.set(id,(combined.get(id)||0)+quantity);if(combined.get(id)>200)fail('Maximum quantity per product is 200');
    }
    const normalized=[...combined.entries()].map(([product,quantity])=>({product,quantity}));
    const discountInput=Math.max(Number(req.body.discount)||0,0);const tax=Math.max(Number(req.body.tax)||0,0);
    const paymentMethod=['CASH','UPI','CARD','ONLINE'].includes(req.body.paymentMethod)?req.body.paymentMethod:'CASH';
    const paymentStatus=req.body.paymentStatus==='Pending'?'Pending':'Paid';
    session=await mongoose.startSession();let created;

    await session.withTransaction(async()=>{
      const products=await Product.find({_id:{$in:normalized.map(i=>i.product)}}).session(session);
      if(products.length!==normalized.length)fail('One or more products were not found',409);
      const byId=new Map(products.map(p=>[String(p._id),p]));const items=[];
      for(const row of normalized){
        const p=byId.get(row.product);if(!p)fail('Product not found',409);
        const stock=await Product.updateOne({_id:p._id,stock:{$gte:row.quantity}},{$inc:{stock:-row.quantity}},{session});
        if(stock.modifiedCount!==1)fail(`Not enough stock for ${p.name}`,409);
        items.push({product:p._id,name:p.name,unit:p.unit,price:money(p.price),costPrice:money(p.costPrice),quantity:row.quantity,amount:money(p.price*row.quantity)});
      }
      const subtotal=money(items.reduce((s,i)=>s+i.amount,0));const discount=Math.min(discountInput,subtotal);const total=money(subtotal-discount+tax);
      const billNo=`SBN-POS-${Date.now().toString().slice(-8)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const docs=await WalkInSale.create([{billNo,customer:{name:clean(req.body.customer?.name||'Walk-in Customer',100)||'Walk-in Customer',phone:clean(req.body.customer?.phone,20),email:clean(req.body.customer?.email,160)},items,subtotal,discount:money(discount),tax:money(tax),total,paymentMethod,paymentStatus,paymentReference:clean(req.body.paymentReference,100),note:clean(req.body.note,500),createdBy:req.user._id}],{session});
      created=docs[0];
      if(paymentStatus==='Paid')await CashEntry.create([{type:'income',amount:total,category:`POS Sale - ${paymentMethod}`,note:`${created.billNo} · ${created.customer.name}`,createdBy:req.user._id}],{session});
    },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'}});
    res.status(201).json(created);
  }catch(e){next(e)}finally{if(session)await session.endSession().catch(()=>{})}
}

export async function updatePosPayment(req,res,next){
  let session;
  try{
    session=await mongoose.startSession();let result;
    await session.withTransaction(async()=>{
      const sale=await WalkInSale.findById(req.params.id).session(session);if(!sale)fail('POS bill not found',404);
      const previous=sale.paymentStatus;
      if(req.body.paymentMethod&&['CASH','UPI','CARD','ONLINE'].includes(req.body.paymentMethod))sale.paymentMethod=req.body.paymentMethod;
      if(req.body.paymentReference!==undefined)sale.paymentReference=clean(req.body.paymentReference,100);
      if(req.body.paymentStatus&&['Paid','Pending','Refunded'].includes(req.body.paymentStatus))sale.paymentStatus=req.body.paymentStatus;
      if(previous==='Refunded'&&sale.paymentStatus!=='Refunded')fail('Refunded POS bills cannot be reopened',409);
      await sale.save({session});
      if(previous!=='Paid'&&sale.paymentStatus==='Paid')await CashEntry.create([{type:'income',amount:sale.total,category:`POS Sale - ${sale.paymentMethod}`,note:`${sale.billNo} payment received`,createdBy:req.user._id}],{session});
      if(previous==='Paid'&&sale.paymentStatus==='Refunded')await CashEntry.create([{type:'expense',amount:sale.total,category:'POS Refund',note:`${sale.billNo} refund recorded`,createdBy:req.user._id}],{session});
      result=sale;
    });
    res.json(result);
  }catch(e){next(e)}finally{if(session)await session.endSession().catch(()=>{})}
}

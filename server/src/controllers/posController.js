import crypto from 'crypto';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import WalkInSale from '../models/WalkInSale.js';
import CashEntry from '../models/CashEntry.js';

const money=n=>Math.round((Number(n)||0)*100)/100;
const clean=(v,max=160)=>String(v||'').trim().replace(/[<>\u0000-\u001F]/g,'').slice(0,max);
const normalizedName=v=>clean(v,160).replace(/\s+/g,' ').toLowerCase();
const escapeRegex=v=>String(v||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const saleUnit=v=>['QTY','KG','PACK'].includes(String(v||'').toUpperCase())?String(v).toUpperCase():'QTY';
function fail(message,status=400){const e=new Error(message);e.status=status;throw e}

export async function posCatalogSearch(req,res,next){
  try{
    res.setHeader('Cache-Control','no-store, private');
    const q=clean(req.query.q,60);
    if(q.length<3)return res.json([]);
    const rx=new RegExp(escapeRegex(q),'i');
    const products=await Product.find({$or:[{name:rx},{brand:rx},{sku:rx},{barcode:rx}]})
      .select('name brand sku price mrp unit stock stockUnit')
      .sort({featured:-1,name:1})
      .limit(8)
      .lean();
    res.json(products.map(p=>({_id:p._id,name:p.name,brand:p.brand||'',sku:p.sku||'',price:money(p.price),mrp:money(p.mrp),unit:p.unit||'',stock:Number(p.stock)||0,stockUnit:p.stockUnit||'qty'})));
  }catch(e){next(e)}
}

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
    if(!requested.length)fail('Add at least one item');
    if(requested.length>75)fail('Too many items in one POS bill');
    const normalized=requested.map((row,index)=>{
      const name=clean(row?.name,160);const price=Number(row?.price);const quantity=Number(row?.quantity);const unitType=saleUnit(row?.saleUnit);
      if(!name)fail(`Item ${index+1}: enter item name`);
      if(!Number.isFinite(price)||price<=0||price>10000000)fail(`Item ${index+1}: enter a valid price`);
      if(!Number.isFinite(quantity)||quantity<=0||quantity>10000)fail(`Item ${index+1}: enter a valid quantity`);
      if(unitType!=='KG'&&!Number.isInteger(quantity))fail(`Item ${index+1}: ${unitType} must be a whole number`);
      const productId=mongoose.isValidObjectId(row?.productId)?String(row.productId):'';
      return {name,price:money(price),quantity:Math.round(quantity*1000)/1000,saleUnit:unitType,productId,key:normalizedName(name)};
    });
    const discountInput=Math.max(Number(req.body.discount)||0,0);const tax=Math.max(Number(req.body.tax)||0,0);
    const paymentMethod=['CASH','UPI','CARD','ONLINE'].includes(req.body.paymentMethod)?req.body.paymentMethod:'CASH';
    const paymentStatus=req.body.paymentStatus==='Pending'?'Pending':'Paid';
    session=await mongoose.startSession();let created;

    await session.withTransaction(async()=>{
      const catalog=await Product.find().select('_id name unit stock stockUnit costPrice price').session(session);
      const productByName=new Map();const productById=new Map();
      for(const p of catalog){const key=normalizedName(p.name);if(key&&!productByName.has(key))productByName.set(key,p);productById.set(String(p._id),p)}
      const productFor=row=>row.productId?productById.get(row.productId):productByName.get(row.key);
      const matchedTotals=new Map();
      for(const row of normalized){const p=productFor(row);if(p)matchedTotals.set(String(p._id),(matchedTotals.get(String(p._id))||0)+row.quantity)}
      for(const [id,quantity] of matchedTotals){
        const p=productById.get(id);
        const stock=await Product.updateOne({_id:id,stock:{$gte:quantity}},{$inc:{stock:-quantity}},{session});
        if(stock.modifiedCount!==1)fail(`Not enough stock for ${p?.name||'matched inventory item'}`,409);
      }
      const items=normalized.map(row=>{
        const p=productFor(row);const matched=Boolean(p);
        return {product:p?._id||null,name:row.name,unit:p?.unit||'',saleUnit:row.saleUnit,inventoryMatched:matched,price:row.price,costPrice:matched?money(p.costPrice):row.price,quantity:row.quantity,amount:money(row.price*row.quantity)};
      });
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

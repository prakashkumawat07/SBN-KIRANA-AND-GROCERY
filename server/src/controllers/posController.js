import Product from '../models/Product.js';
import WalkInSale from '../models/WalkInSale.js';
import CashEntry from '../models/CashEntry.js';

const money=n=>Math.round((Number(n)||0)*100)/100;

export async function posSales(req,res,next){
  try{res.json(await WalkInSale.find().populate('createdBy','name email').sort({createdAt:-1}).limit(250))}catch(e){next(e)}
}

export async function createPosSale(req,res,next){
  try{
    const requested=Array.isArray(req.body.items)?req.body.items:[];
    if(!requested.length)return res.status(400).json({message:'Add at least one product'});
    const normalized=requested.map(i=>({product:String(i.product||''),quantity:Math.max(Number(i.quantity)||0,0)}));
    if(normalized.some(i=>!i.product||i.quantity<=0))return res.status(400).json({message:'Every sale item needs a product and quantity'});
    const ids=[...new Set(normalized.map(i=>i.product))];
    const products=await Product.find({_id:{$in:ids}});
    if(products.length!==ids.length)return res.status(400).json({message:'One or more products were not found'});
    const byId=new Map(products.map(p=>[String(p._id),p]));
    const items=[];
    for(const row of normalized){
      const p=byId.get(row.product);
      if(!p)return res.status(400).json({message:'Product not found'});
      if(p.stock<row.quantity)return res.status(400).json({message:`Only ${p.stock} ${p.unit||'units'} available for ${p.name}`});
      items.push({product:p._id,name:p.name,unit:p.unit,price:money(p.price),costPrice:money(p.costPrice),quantity:row.quantity,amount:money(p.price*row.quantity)});
    }
    const subtotal=money(items.reduce((s,i)=>s+i.amount,0));
    const discount=Math.min(Math.max(Number(req.body.discount)||0,0),subtotal);
    const tax=Math.max(Number(req.body.tax)||0,0);
    const total=money(subtotal-discount+tax);
    const paymentMethod=['CASH','UPI','CARD','ONLINE'].includes(req.body.paymentMethod)?req.body.paymentMethod:'CASH';
    const paymentStatus=req.body.paymentStatus==='Pending'?'Pending':'Paid';
    const sale=await WalkInSale.create({
      customer:{name:String(req.body.customer?.name||'Walk-in Customer').trim()||'Walk-in Customer',phone:String(req.body.customer?.phone||'').trim(),email:String(req.body.customer?.email||'').trim()},
      items,subtotal,discount:money(discount),tax:money(tax),total,paymentMethod,paymentStatus,
      paymentReference:String(req.body.paymentReference||'').trim(),note:String(req.body.note||'').trim(),createdBy:req.user._id
    });
    await Product.bulkWrite(items.map(i=>({updateOne:{filter:{_id:i.product},update:{$inc:{stock:-i.quantity}}}})));
    if(paymentStatus==='Paid')await CashEntry.create({type:'income',amount:total,category:`POS Sale - ${paymentMethod}`,note:`${sale.billNo} · ${sale.customer.name}`,createdBy:req.user._id});
    res.status(201).json(sale);
  }catch(e){next(e)}
}

export async function updatePosPayment(req,res,next){
  try{
    const sale=await WalkInSale.findById(req.params.id);
    if(!sale)return res.status(404).json({message:'POS bill not found'});
    const previous=sale.paymentStatus;
    if(req.body.paymentMethod&&['CASH','UPI','CARD','ONLINE'].includes(req.body.paymentMethod))sale.paymentMethod=req.body.paymentMethod;
    if(req.body.paymentReference!==undefined)sale.paymentReference=String(req.body.paymentReference||'').trim();
    if(req.body.paymentStatus&&['Paid','Pending','Refunded'].includes(req.body.paymentStatus))sale.paymentStatus=req.body.paymentStatus;
    await sale.save();
    if(previous!=='Paid'&&sale.paymentStatus==='Paid')await CashEntry.create({type:'income',amount:sale.total,category:`POS Sale - ${sale.paymentMethod}`,note:`${sale.billNo} payment received`,createdBy:req.user._id});
    res.json(sale);
  }catch(e){next(e)}
}

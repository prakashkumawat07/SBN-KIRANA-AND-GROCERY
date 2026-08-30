import BulkOrder from '../models/BulkOrder.js';
import {inspectDataUri} from '../utils/dataUri.js';

const round=n=>Math.round((Number(n)||0)*100)/100;
const allowedAttachments=new Set(['text/plain','text/csv','application/pdf','image/jpeg','image/png']);
const MAX_ATTACHMENT_BYTES=1.5*1024*1024;
const requestNumber=o=>`SBN-BR-${new Date(o.createdAt||Date.now()).toISOString().slice(0,10).replaceAll('-','')}-${String(o._id).slice(-6).toUpperCase()}`;
const quoteNumber=o=>`SBN-Q-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${String(o._id).slice(-6).toUpperCase()}`;
const invoiceNumber=o=>`SBN-BULK-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${String(o._id).slice(-6).toUpperCase()}`;

function cleanRequestedItems(items=[]){
  return (Array.isArray(items)?items:[]).map(i=>({
    name:String(i?.name||'').trim(),
    quantity:Math.max(Number(i?.quantity)||1,0),
    unit:String(i?.unit||'pcs').trim()||'pcs',
    note:String(i?.note||'').trim()
  })).filter(i=>i.name);
}

function cleanAttachment(a){
  if(!a?.data)return undefined;
  const type=String(a.type||'');
  const size=Number(a.size)||0;
  if(!allowedAttachments.has(type))throw Object.assign(new Error('Unsupported attachment type'),{status:400});
  if(size<=0||size>MAX_ATTACHMENT_BYTES)throw Object.assign(new Error('Attachment must be 1.5 MB or smaller'),{status:400});
  const inspected=inspectDataUri(a.data,{allowedMime:[...allowedAttachments],maxBytes:MAX_ATTACHMENT_BYTES,declaredBytes:size});
  if(!inspected||a.data.length>2_300_000)throw Object.assign(new Error('Attachment content does not match its type or size'),{status:400});
  return {name:String(a.name||'bulk-order-list').slice(0,180),type,size,data:a.data};
}

export async function createBulkOrder(req,res,next){
  try{
    const items=cleanRequestedItems(req.body.requestedItems);
    const attachment=cleanAttachment(req.body.attachment);
    if(!items.length&&!attachment)return res.status(400).json({message:'Add at least one item or upload a shopping list'});
    const c=req.body.contact||{};
    const required=['name','email','phone','address','city','state','pincode'];
    if(required.some(k=>!String(c[k]||'').trim()))return res.status(400).json({message:'Complete customer and delivery details are required'});
    const order=await BulkOrder.create({
      user:req.user._id,
      contact:{
        name:c.name,email:c.email,phone:c.phone,businessName:c.businessName||'',gstNumber:c.gstNumber||'',
        address:c.address,city:c.city,state:c.state,pincode:c.pincode
      },
      requestedItems:items,attachment,
      customerNote:String(req.body.customerNote||'').trim()
    });
    order.requestNo=requestNumber(order);
    await order.save();
    res.status(201).json(order);
  }catch(e){if(e.status)return res.status(e.status).json({message:e.message});next(e)}
}

export async function myBulkOrders(req,res,next){
  try{res.json(await BulkOrder.find({user:req.user._id}).sort({createdAt:-1}))}catch(e){next(e)}
}

export async function bulkOrderDetail(req,res,next){
  try{
    const order=await BulkOrder.findOne({_id:req.params.id,user:req.user._id});
    if(!order)return res.status(404).json({message:'Bulk order request not found'});
    res.json(order);
  }catch(e){next(e)}
}

export async function customerDecision(req,res,next){
  try{
    const order=await BulkOrder.findOne({_id:req.params.id,user:req.user._id});
    if(!order)return res.status(404).json({message:'Bulk order request not found'});
    if(order.status!=='Quoted'&&!['Accepted','Rejected'].includes(order.status))return res.status(400).json({message:'Quotation is not ready for a decision'});
    const decision=String(req.body.decision||'');
    if(!['Accepted','Rejected'].includes(decision))return res.status(400).json({message:'Choose Accepted or Rejected'});
    order.decision={status:decision,note:String(req.body.note||'').trim(),decidedAt:new Date()};
    order.status=decision;
    if(decision==='Accepted'&&!order.billing?.invoiceNo){order.billing={invoiceNo:invoiceNumber(order),issuedAt:new Date()}}
    await order.save();
    res.json(order);
  }catch(e){next(e)}
}

export async function adminBulkOrders(req,res,next){
  try{res.json(await BulkOrder.find().populate('user','name email phone').sort({createdAt:-1}))}catch(e){next(e)}
}

export async function adminBulkOrderDetail(req,res,next){
  try{
    const order=await BulkOrder.findById(req.params.id).populate('user','name email phone');
    if(!order)return res.status(404).json({message:'Bulk order request not found'});
    res.json(order);
  }catch(e){next(e)}
}

export async function updateQuotation(req,res,next){
  try{
    const order=await BulkOrder.findById(req.params.id);
    if(!order)return res.status(404).json({message:'Bulk order request not found'});
    const items=(Array.isArray(req.body.items)?req.body.items:[]).map(i=>{
      const quantity=Math.max(Number(i.quantity)||0,0);
      const rate=Math.max(Number(i.rate)||0,0);
      return {name:String(i.name||'').trim(),quantity,unit:String(i.unit||'pcs').trim()||'pcs',rate:round(rate),amount:round(quantity*rate)};
    }).filter(i=>i.name&&i.quantity>0);
    if(!items.length)return res.status(400).json({message:'Quotation needs at least one priced item'});
    const subtotal=round(items.reduce((s,i)=>s+i.amount,0));
    const discount=Math.max(round(req.body.discount),0);
    const tax=Math.max(round(req.body.tax),0);
    const deliveryFee=Math.max(round(req.body.deliveryFee),0);
    const total=Math.max(round(subtotal-discount+tax+deliveryFee),0);
    order.quotation={
      quoteNo:order.quotation?.quoteNo||quoteNumber(order),items,subtotal,discount,tax,deliveryFee,total,
      validUntil:req.body.validUntil?new Date(req.body.validUntil):undefined,
      note:String(req.body.note||''),createdAt:order.quotation?.createdAt||new Date(),updatedAt:new Date()
    };
    order.status='Quoted';
    order.decision={status:'Pending',note:'',decidedAt:undefined};
    order.adminNote=String(req.body.adminNote||order.adminNote||'');
    await order.save();
    res.json(order);
  }catch(e){next(e)}
}

export async function updateBulkStatus(req,res,next){
  try{
    const order=await BulkOrder.findById(req.params.id);
    if(!order)return res.status(404).json({message:'Bulk order request not found'});
    const allowed=['Requested','Reviewing','Quoted','Accepted','Rejected','Confirmed','Preparing','Out for Delivery','Delivered','Cancelled'];
    if(!allowed.includes(req.body.status))return res.status(400).json({message:'Invalid bulk order status'});
    order.status=req.body.status;
    if(req.body.adminNote!==undefined)order.adminNote=String(req.body.adminNote||'');
    if(order.status==='Delivered'){order.delivery.status='Delivered';order.delivery.deliveredAt=order.delivery.deliveredAt||new Date()}
    await order.save();
    res.json(order);
  }catch(e){next(e)}
}

export async function updateBulkPayment(req,res,next){
  try{
    const order=await BulkOrder.findById(req.params.id);
    if(!order)return res.status(404).json({message:'Bulk order request not found'});
    const amountPaid=Math.max(round(req.body.amountPaid),0);
    const total=Number(order.quotation?.total||0);
    let status=req.body.status;
    if(!['Pending','Partial','Paid','Refunded'].includes(status))status=amountPaid<=0?'Pending':amountPaid>=total&&total>0?'Paid':'Partial';
    order.payment={
      method:req.body.method||order.payment?.method||'Not selected',status,amountPaid,
      reference:String(req.body.reference||''),note:String(req.body.note||''),updatedAt:new Date()
    };
    await order.save();
    res.json(order);
  }catch(e){next(e)}
}

export async function updateBulkDelivery(req,res,next){
  try{
    const order=await BulkOrder.findById(req.params.id);
    if(!order)return res.status(404).json({message:'Bulk order request not found'});
    const status=req.body.status||order.delivery?.status||'Pending';
    order.delivery={
      mode:req.body.mode||order.delivery?.mode||'Door Delivery',status,
      expectedDate:req.body.expectedDate?new Date(req.body.expectedDate):order.delivery?.expectedDate,
      deliveredAt:status==='Delivered'?(order.delivery?.deliveredAt||new Date()):order.delivery?.deliveredAt,
      note:String(req.body.note||''),updatedAt:new Date()
    };
    if(status==='Preparing')order.status='Preparing';
    if(status==='Out for Delivery')order.status='Out for Delivery';
    if(status==='Delivered')order.status='Delivered';
    await order.save();
    res.json(order);
  }catch(e){next(e)}
}

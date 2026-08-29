import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Offer from '../models/Offer.js';
import {discountFor} from './marketingController.js';

const clean=(v,max=160)=>String(v||'').trim().replace(/[<>\u0000-\u001F]/g,'').slice(0,max);
const money=n=>Math.round((Number(n)||0)*100)/100;
function fail(message,status=400){const e=new Error(message);e.status=status;throw e}
function safeAddress(value={}){
  const out={fullName:clean(value.fullName,100),phone:clean(value.phone,20),address:clean(value.address,300),city:clean(value.city,100),state:clean(value.state,100),pincode:clean(value.pincode,10).replace(/\D/g,'').slice(0,6)};
  if(!out.fullName||!out.phone||!out.address||!out.city||out.pincode.length!==6)fail('Complete delivery name, phone, address, city and 6-digit pincode are required');
  return out;
}

export async function createOrder(req,res,next){
  let session;
  try{
    const {items,shippingAddress,paymentMethod,couponCode}=req.body||{};
    if(!Array.isArray(items)||items.length===0)fail('Cart is empty');
    if(items.length>50)fail('Too many cart lines in one order');
    if(!['COD','UPI','PAYLATER'].includes(paymentMethod))fail('Invalid payment method');
    const address=safeAddress(shippingAddress);

    const combined=new Map();
    for(const item of items){
      const id=String(item?.product||'');const quantity=Number(item?.quantity);
      if(!mongoose.isValidObjectId(id)||!Number.isInteger(quantity)||quantity<1||quantity>100)fail('Invalid product or quantity');
      combined.set(id,(combined.get(id)||0)+quantity);
      if(combined.get(id)>100)fail('Maximum quantity per product is 100');
    }
    const requested=[...combined.entries()].map(([product,quantity])=>({product,quantity}));
    session=await mongoose.startSession();
    let createdOrder;

    await session.withTransaction(async()=>{
      const ids=requested.map(i=>i.product);
      const products=await Product.find({_id:{$in:ids}}).session(session);
      if(products.length!==ids.length)fail('One or more products are unavailable',409);
      const byId=new Map(products.map(p=>[String(p._id),p]));
      const orderItems=[];let subtotal=0;
      for(const row of requested){
        const p=byId.get(row.product);if(!p)fail('Product not found',409);
        const update=await Product.updateOne({_id:p._id,stock:{$gte:row.quantity}},{$inc:{stock:-row.quantity}},{session});
        if(update.modifiedCount!==1)fail(`Not enough stock for ${p.name}`,409);
        orderItems.push({product:p._id,name:p.name,image:p.image,price:money(p.price),costPrice:money(p.costPrice||0),quantity:row.quantity});
        subtotal=money(subtotal+p.price*row.quantity);
      }

      let discount=0,appliedCode='',offer=null;
      if(couponCode){
        const code=clean(couponCode,40).toUpperCase();
        offer=await Offer.findOne({code}).session(session);
        if(!offer)fail('Coupon is invalid');
        discount=discountFor(offer,subtotal);if(discount<=0)fail('Coupon is not applicable to this order');
        const use=await Offer.updateOne({_id:offer._id,active:true,$expr:{$or:[{$eq:['$usageLimit',0]},{$lt:['$usedCount','$usageLimit']}]},$and:[{$or:[{startsAt:null},{startsAt:{$lte:new Date()}}]},{$or:[{endsAt:null},{endsAt:{$gte:new Date()}}]}]},{$inc:{usedCount:1}},{session});
        if(use.modifiedCount!==1)fail('Coupon is no longer available',409);
        appliedCode=offer.code;
      }

      const discountedSubtotal=money(Math.max(subtotal-discount,0));
      const deliveryFee=discountedSubtotal>=499?0:49;
      const total=money(discountedSubtotal+deliveryFee);
      let paymentStatus='Pending',payLaterDueDate=null;
      if(paymentMethod==='PAYLATER'){
        payLaterDueDate=new Date(Date.now()+30*24*60*60*1000);paymentStatus='Due';
        const credit=await User.updateOne({_id:req.user._id,'payLater.status':'approved',$expr:{$gte:[{$subtract:[{$ifNull:['$payLater.limit',0]},{$ifNull:['$payLater.used',0]}]},total]}},{$inc:{'payLater.used':total},$set:{'payLater.dueDate':payLaterDueDate,'payLater.updatedAt':new Date()}},{session});
        if(credit.modifiedCount!==1)fail('PayLater balance is insufficient or not approved',409);
      }

      const docs=await Order.create([{user:req.user._id,items:orderItems,shippingAddress:address,paymentMethod,subtotal,deliveryFee,discount:money(discount),couponCode:appliedCode,total,paymentStatus,payLaterDueDate}],{session});
      createdOrder=docs[0];
    },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'}});

    res.status(201).json(createdOrder);
  }catch(e){next(e)}finally{if(session)await session.endSession().catch(()=>{})}
}

export async function myOrders(req,res,next){
  try{res.setHeader('Cache-Control','no-store, private');res.json(await Order.find({user:req.user._id}).sort({createdAt:-1}).limit(250))}catch(e){next(e)}
}

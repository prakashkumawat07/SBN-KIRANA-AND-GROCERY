import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Offer from '../models/Offer.js';
import {discountFor} from './marketingController.js';

export async function createOrder(req,res,next){
  try{
    const {items,shippingAddress,paymentMethod,couponCode}=req.body;
    if(!items?.length)return res.status(400).json({message:'Cart is empty'});

    const orderItems=[];
    const stockUpdates=[];
    let subtotal=0;

    for(const item of items){
      const p=await Product.findById(item.product);
      const q=Number(item.quantity);
      if(!p||q<1||p.stock<q)return res.status(400).json({message:`Invalid quantity for ${p?.name||'product'}`});
      orderItems.push({product:p._id,name:p.name,image:p.image,price:p.price,costPrice:p.costPrice||0,quantity:q});
      subtotal+=p.price*q;
      stockUpdates.push({updateOne:{filter:{_id:p._id,stock:{$gte:q}},update:{$inc:{stock:-q}}}});
    }

    let discount=0;let appliedCode='';let offer=null;
    if(couponCode){offer=await Offer.findOne({code:String(couponCode).trim().toUpperCase()});if(!offer)return res.status(400).json({message:'Coupon is invalid'});discount=discountFor(offer,subtotal);if(discount<=0)return res.status(400).json({message:'Coupon is not applicable to this order'});appliedCode=offer.code}
    const discountedSubtotal=Math.max(subtotal-discount,0);
    const deliveryFee=discountedSubtotal>=499?0:49;
    const total=discountedSubtotal+deliveryFee;
    let paymentStatus='Pending';
    let payLaterDueDate=null;
    let creditUser=null;

    if(paymentMethod==='PAYLATER'){
      creditUser=await User.findById(req.user._id);
      const credit=creditUser?.payLater;
      const available=Math.max((credit?.limit||0)-(credit?.used||0),0);
      if(credit?.status!=='approved')return res.status(403).json({message:'PayLater is not approved for this account'});
      if(available<total)return res.status(400).json({message:`PayLater available balance is ₹${available}`});
      payLaterDueDate=new Date(Date.now()+30*24*60*60*1000);
      paymentStatus='Due';
    }

    await Product.bulkWrite(stockUpdates);
    const order=await Order.create({user:req.user._id,items:orderItems,shippingAddress,paymentMethod,subtotal,deliveryFee,discount,couponCode:appliedCode,total,paymentStatus,payLaterDueDate});
    if(offer){offer.usedCount=(offer.usedCount||0)+1;await offer.save()}

    if(paymentMethod==='PAYLATER'&&creditUser){
      creditUser.payLater.used=(creditUser.payLater.used||0)+total;
      creditUser.payLater.dueDate=payLaterDueDate;
      creditUser.payLater.updatedAt=new Date();
      await creditUser.save();
    }

    res.status(201).json(order);
  }catch(e){next(e)}
}

export async function myOrders(req,res,next){
  try{res.json(await Order.find({user:req.user._id}).sort({createdAt:-1}))}catch(e){next(e)}
}

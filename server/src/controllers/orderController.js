import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

export async function createOrder(req,res,next){
  try{
    const {items,shippingAddress,paymentMethod}=req.body;
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

    const deliveryFee=subtotal>=499?0:49;
    const total=subtotal+deliveryFee;
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
    const order=await Order.create({user:req.user._id,items:orderItems,shippingAddress,paymentMethod,subtotal,deliveryFee,total,paymentStatus,payLaterDueDate});

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

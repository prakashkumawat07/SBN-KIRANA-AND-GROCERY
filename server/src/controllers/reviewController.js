import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const clean=(value,max)=>String(value||'').trim().replace(/[<>\u0000-\u001F]/g,'').slice(0,max);
const validId=value=>mongoose.isValidObjectId(String(value||''));

export async function productReviews(req,res,next){
  try{
    if(!validId(req.params.productId))return res.json({average:0,count:0,reviews:[]});
    const reviews=await Review.find({product:req.params.productId,approved:true}).populate('user','name').sort({createdAt:-1}).lean();
    const count=reviews.length;
    const average=count?Math.round((reviews.reduce((s,r)=>s+r.rating,0)/count)*10)/10:0;
    res.json({average,count,reviews});
  }catch(e){next(e)}
}

export async function reviewEligibility(req,res,next){
  try{
    if(!validId(req.params.productId))return res.status(404).json({message:'Product not found'});
    const product=await Product.findById(req.params.productId).select('_id name');
    if(!product)return res.status(404).json({message:'Product not found'});
    const delivered=Boolean(await Order.exists({user:req.user._id,'items.product':product._id,status:'Delivered'}));
    const existing=await Review.findOne({product:product._id,user:req.user._id}).select('rating title comment approved moderatedAt updatedAt').lean();
    res.setHeader('Cache-Control','no-store, private');
    res.json({eligible:delivered,existing:existing||null});
  }catch(e){next(e)}
}

export async function reviewOpportunities(req,res,next){
  try{
    const deliveredOrders=await Order.find({user:req.user._id,status:'Delivered','items.product':{$ne:null}}).select('items updatedAt createdAt').sort({updatedAt:-1}).limit(100).lean();
    const candidates=new Map();
    for(const order of deliveredOrders){
      for(const item of order.items||[]){
        const productId=String(item.product||'');
        if(!validId(productId)||candidates.has(productId))continue;
        candidates.set(productId,{product:productId,name:item.name||'Product',image:item.image||'',orderId:String(order._id),deliveredAt:order.updatedAt||order.createdAt});
      }
    }
    const ids=[...candidates.keys()];
    if(!ids.length){res.setHeader('Cache-Control','no-store, private');return res.json({count:0,opportunities:[]})}
    const [existing,products]=await Promise.all([
      Review.find({user:req.user._id,product:{$in:ids}}).select('product').lean(),
      Product.find({_id:{$in:ids}}).select('name image').lean()
    ]);
    const reviewed=new Set(existing.map(r=>String(r.product)));
    const productMap=new Map(products.map(p=>[String(p._id),p]));
    const opportunities=[];
    for(const [productId,row] of candidates){
      if(reviewed.has(productId))continue;
      const product=productMap.get(productId);
      if(!product)continue;
      opportunities.push({...row,name:product.name||row.name,image:product.image||row.image});
    }
    res.setHeader('Cache-Control','no-store, private');
    res.json({count:opportunities.length,opportunities});
  }catch(e){next(e)}
}

export async function upsertReview(req,res,next){
  try{
    if(!validId(req.params.productId))return res.status(404).json({message:'Product not found'});
    const product=await Product.findById(req.params.productId);
    if(!product)return res.status(404).json({message:'Product not found'});
    const delivered=Boolean(await Order.exists({user:req.user._id,'items.product':product._id,status:'Delivered'}));
    if(!delivered)return res.status(403).json({message:'Rating and suggestions are available only after this product is delivered.'});
    const rating=Number(req.body.rating);
    if(!Number.isInteger(rating)||rating<1||rating>5)return res.status(400).json({message:'Rating must be a whole number between 1 and 5'});
    const review=await Review.findOneAndUpdate(
      {product:product._id,user:req.user._id},
      {$set:{rating,title:clean(req.body.title,100),comment:clean(req.body.comment,1000),verifiedPurchase:true,approved:false,moderatedAt:null,moderatedBy:null}},
      {new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true}
    ).populate('user','name');
    res.status(201).json({message:'Feedback submitted for admin approval',review});
  }catch(e){next(e)}
}

export async function adminReviews(req,res,next){
  try{
    res.setHeader('Cache-Control','no-store, private');
    res.json(await Review.find().populate('user','name email').populate('product','name image').populate('moderatedBy','name email').sort({approved:1,updatedAt:-1}));
  }catch(e){next(e)}
}

export async function moderateReview(req,res,next){
  try{
    if(!validId(req.params.id))return res.status(404).json({message:'Review not found'});
    const review=await Review.findById(req.params.id);
    if(!review)return res.status(404).json({message:'Review not found'});
    if(req.body.approved===undefined)return res.status(400).json({message:'Approval status is required'});
    review.approved=Boolean(req.body.approved);
    review.moderatedAt=new Date();
    review.moderatedBy=req.user._id;
    await review.save();
    res.json(review);
  }catch(e){next(e)}
}

export async function deleteReview(req,res,next){
  try{
    if(!validId(req.params.id))return res.status(404).json({message:'Review not found'});
    const review=await Review.findByIdAndDelete(req.params.id);
    if(!review)return res.status(404).json({message:'Review not found'});
    res.json({message:'Review deleted'});
  }catch(e){next(e)}
}

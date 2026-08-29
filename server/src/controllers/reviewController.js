import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

export async function productReviews(req,res,next){
  try{
    const reviews=await Review.find({product:req.params.productId,approved:true}).populate('user','name').sort({createdAt:-1}).lean();
    const count=reviews.length;
    const average=count?Math.round((reviews.reduce((s,r)=>s+r.rating,0)/count)*10)/10:0;
    res.json({average,count,reviews});
  }catch(e){next(e)}
}

export async function reviewEligibility(req,res,next){
  try{
    const product=await Product.findById(req.params.productId).select('_id name');
    if(!product)return res.status(404).json({message:'Product not found'});
    const delivered=Boolean(await Order.exists({user:req.user._id,'items.product':product._id,status:'Delivered'}));
    const existing=await Review.findOne({product:product._id,user:req.user._id}).select('rating title comment approved').lean();
    res.json({eligible:delivered,reason:delivered?'Delivered purchase verified':'You can rate and suggest improvements after this product is delivered in one of your orders.',existing:existing||null});
  }catch(e){next(e)}
}

export async function upsertReview(req,res,next){
  try{
    const product=await Product.findById(req.params.productId);
    if(!product)return res.status(404).json({message:'Product not found'});
    const delivered=Boolean(await Order.exists({user:req.user._id,'items.product':product._id,status:'Delivered'}));
    if(!delivered)return res.status(403).json({message:'Rating and suggestions are available after a delivered purchase of this product.'});
    const rating=Number(req.body.rating);
    if(!Number.isFinite(rating)||rating<1||rating>5)return res.status(400).json({message:'Rating must be between 1 and 5'});
    const review=await Review.findOneAndUpdate(
      {product:product._id,user:req.user._id},
      {$set:{rating,title:String(req.body.title||'').trim().slice(0,100),comment:String(req.body.comment||'').trim().slice(0,1000),verifiedPurchase:true,approved:true}},
      {new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true}
    ).populate('user','name');
    res.status(201).json(review);
  }catch(e){next(e)}
}

export async function adminReviews(req,res,next){
  try{res.json(await Review.find().populate('user','name email').populate('product','name image').sort({createdAt:-1}))}catch(e){next(e)}
}

export async function moderateReview(req,res,next){
  try{
    const review=await Review.findById(req.params.id);
    if(!review)return res.status(404).json({message:'Review not found'});
    if(req.body.approved!==undefined)review.approved=Boolean(req.body.approved);
    await review.save();
    res.json(review);
  }catch(e){next(e)}
}

export async function deleteReview(req,res,next){
  try{const review=await Review.findByIdAndDelete(req.params.id);if(!review)return res.status(404).json({message:'Review not found'});res.json({message:'Review deleted'})}catch(e){next(e)}
}

import Offer from '../models/Offer.js';

function available(o){const now=new Date();return o.active&&(!o.startsAt||o.startsAt<=now)&&(!o.endsAt||o.endsAt>=now)&&(!o.usageLimit||o.usedCount<o.usageLimit)}
export function discountFor(o,subtotal){if(!available(o)||subtotal<o.minOrder)return 0;let d=o.type==='fixed'?o.value:subtotal*(o.value/100);if(o.maxDiscount>0)d=Math.min(d,o.maxDiscount);return Math.max(0,Math.min(Math.round(d*100)/100,subtotal))}

export async function activeOffers(req,res,next){try{const list=await Offer.find({active:true}).sort({featured:-1,createdAt:-1}).lean();res.json(list.filter(available))}catch(e){next(e)}}
export async function validateCoupon(req,res,next){try{const code=String(req.body.code||'').trim().toUpperCase();const subtotal=Number(req.body.subtotal)||0;const offer=await Offer.findOne({code});if(!offer||!available(offer))return res.status(404).json({message:'Coupon is invalid or inactive'});if(subtotal<offer.minOrder)return res.status(400).json({message:`Minimum order ₹${offer.minOrder} required`});const discount=discountFor(offer,subtotal);res.json({code:offer.code,title:offer.title,description:offer.description,discount})}catch(e){next(e)}}

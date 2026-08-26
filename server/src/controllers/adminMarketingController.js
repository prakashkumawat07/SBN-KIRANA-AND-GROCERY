import Offer from '../models/Offer.js';

export async function offers(req,res,next){try{res.json(await Offer.find().sort({createdAt:-1}))}catch(e){next(e)}}
export async function createOffer(req,res,next){try{const data={...req.body,code:String(req.body.code||'').trim().toUpperCase()};if(!data.title||!data.code)return res.status(400).json({message:'Title and coupon code are required'});res.status(201).json(await Offer.create(data))}catch(e){next(e)}}
export async function updateOffer(req,res,next){try{const data={...req.body};if(data.code)data.code=String(data.code).trim().toUpperCase();const o=await Offer.findByIdAndUpdate(req.params.id,data,{new:true,runValidators:true});if(!o)return res.status(404).json({message:'Offer not found'});res.json(o)}catch(e){next(e)}}
export async function deleteOffer(req,res,next){try{const o=await Offer.findByIdAndDelete(req.params.id);if(!o)return res.status(404).json({message:'Offer not found'});res.json({message:'Offer deleted'})}catch(e){next(e)}}

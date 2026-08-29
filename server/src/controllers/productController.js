import mongoose from 'mongoose';
import Product from '../models/Product.js';

const escapeRegex=value=>String(value||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

export async function getProducts(req,res,next){
  try{
    const filter={};
    if(req.query.category)filter.category=String(req.query.category).slice(0,80);
    if(req.query.featured==='true')filter.featured=true;
    if(req.query.search){
      const search=escapeRegex(String(req.query.search).trim().slice(0,80));
      if(search)filter.$or=[
        {name:{$regex:search,$options:'i'}},
        {category:{$regex:search,$options:'i'}},
        {brand:{$regex:search,$options:'i'}},
        {tags:{$regex:search,$options:'i'}}
      ];
    }
    const rows=await Product.find(filter).select('-images -costPrice -lowStockThreshold -barcode').sort({featured:-1,createdAt:-1});
    res.json(rows);
  }catch(e){next(e)}
}

export async function getProduct(req,res,next){
  try{
    if(!mongoose.isValidObjectId(req.params.id))return res.status(404).json({message:'Product not found'});
    const p=await Product.findById(req.params.id).select('-costPrice -lowStockThreshold -barcode');
    if(!p)return res.status(404).json({message:'Product not found'});
    res.json(p);
  }catch(e){next(e)}
}

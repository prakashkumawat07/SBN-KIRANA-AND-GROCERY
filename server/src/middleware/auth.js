import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(req,res,next){
  try{
    const header=req.headers.authorization||'';
    if(!header.startsWith('Bearer '))return res.status(401).json({message:'Authentication required'});
    const payload=jwt.verify(header.slice(7),process.env.JWT_SECRET);
    const user=await User.findById(payload.id);
    if(!user)return res.status(401).json({message:'User not found'});
    if(user.isActive===false)return res.status(403).json({message:'Account is disabled'});
    req.user=user;
    next();
  }catch(e){res.status(401).json({message:'Invalid or expired session'})}
}

export function adminOnly(req,res,next){
  if(req.user?.role!=='admin')return res.status(403).json({message:'Admin access required'});
  next();
}

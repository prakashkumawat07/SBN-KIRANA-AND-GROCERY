import User from '../models/User.js';
import {verifySessionToken} from '../utils/authToken.js';

export async function protect(req,res,next){
  try{
    const header=req.headers.authorization||'';
    if(!header.startsWith('Bearer '))return res.status(401).json({message:'Authentication required'});
    const raw=header.slice(7).trim();
    if(!raw||raw.length>4096)return res.status(401).json({message:'Invalid or expired session'});
    const payload=verifySessionToken(raw);
    const user=await User.findById(payload.id);
    if(!user)return res.status(401).json({message:'Invalid or expired session'});
    if(user.isActive===false)return res.status(403).json({message:'Account is disabled'});
    if(Number(payload.sv||0)!==Number(user.sessionVersion||0))return res.status(401).json({message:'Session has been signed out'});
    req.user=user;
    req.auth={jti:payload.jti||'',sessionVersion:Number(payload.sv||0)};
    next();
  }catch(e){res.status(401).json({message:'Invalid or expired session'})}
}

export function adminOnly(req,res,next){
  if(req.user?.role!=='admin')return res.status(403).json({message:'Admin access required'});
  next();
}

export function posOnly(req,res,next){
  if(req.user?.role!=='pos')return res.status(403).json({message:'POS staff access required'});
  next();
}

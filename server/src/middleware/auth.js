import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const issuer='sbn-kirana-api';const audience='sbn-kirana-web';
function jwtSecret(){const v=process.env.JWT_SECRET||'';if(!v)throw new Error('JWT secret is not configured');return v}

export async function protect(req,res,next){
  try{
    const header=req.headers.authorization||'';
    if(!header.startsWith('Bearer '))return res.status(401).json({message:'Authentication required'});
    const raw=header.slice(7).trim();
    if(!raw||raw.length>4096)return res.status(401).json({message:'Invalid or expired session'});
    const payload=jwt.verify(raw,jwtSecret(),{algorithms:['HS256'],issuer,audience});
    const user=await User.findById(payload.id);
    if(!user)return res.status(401).json({message:'Invalid or expired session'});
    if(user.isActive===false)return res.status(403).json({message:'Account is disabled'});
    req.user=user;
    next();
  }catch(e){res.status(401).json({message:'Invalid or expired session'})}
}

export function adminOnly(req,res,next){
  if(req.user?.role!=='admin')return res.status(403).json({message:'Admin access required'});
  next();
}

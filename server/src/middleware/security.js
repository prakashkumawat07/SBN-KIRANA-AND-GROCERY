import crypto from 'crypto';
import SecurityRateLimit from '../models/SecurityRateLimit.js';

const cleanEmail=v=>String(v||'').trim().toLowerCase().slice(0,160);
const ipOf=req=>String(req.headers['x-forwarded-for']||req.ip||req.socket?.remoteAddress||'unknown').split(',')[0].trim().slice(0,80);
const secret=()=>process.env.JWT_SECRET||'sbn-security-fallback';
const keyFor=(type,value)=>crypto.createHash('sha256').update(`${type}|${value}|${secret()}`).digest('hex');

export function securityHeaders(req,res,next){
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  if(process.env.NODE_ENV==='production')res.setHeader('Strict-Transport-Security','max-age=63072000; includeSubDomains; preload');
  if(/^\/(api|service)\/(auth|admin|paylater)/.test(req.path||''))res.setHeader('Cache-Control','no-store, private');
  next();
}

const forbidden=new Set(['__proto__','prototype','constructor']);
function hasDangerousKey(value,depth=0){
  if(depth>12)return true;
  if(!value||typeof value!=='object')return false;
  if(Array.isArray(value))return value.some(v=>hasDangerousKey(v,depth+1));
  for(const [key,val] of Object.entries(value)){
    if(forbidden.has(key)||key.startsWith('$')||key.includes('.'))return true;
    if(hasDangerousKey(val,depth+1))return true;
  }
  return false;
}
export function rejectDangerousInput(req,res,next){
  if(hasDangerousKey(req.body)||hasDangerousKey(req.query))return res.status(400).json({message:'Invalid request data'});
  next();
}

export function requireJsonForWrites(req,res,next){
  if(['POST','PUT','PATCH'].includes(req.method)&&!req.is('application/json'))return res.status(415).json({message:'Content-Type must be application/json'});
  next();
}

async function getLimit(key){return SecurityRateLimit.findOne({key}).lean()}
function isBlocked(doc){return Boolean(doc?.blockedUntil&&new Date(doc.blockedUntil)>new Date())}
async function bump(key,{windowMs,max,blockMs}){
  const now=new Date();const expiresAt=new Date(Date.now()+Math.max(windowMs,blockMs)+60000);
  let doc=await SecurityRateLimit.findOne({key});
  if(!doc){doc=await SecurityRateLimit.create({key,count:1,windowStart:now,expiresAt});return doc}
  if(now-new Date(doc.windowStart)>=windowMs){doc.count=1;doc.windowStart=now;doc.blockedUntil=null}
  else doc.count+=1;
  if(doc.count>=max)doc.blockedUntil=new Date(Date.now()+blockMs);
  doc.expiresAt=expiresAt;await doc.save();return doc;
}

export async function checkLoginThrottle(req,res,next){
  try{
    const ip=ipOf(req),email=cleanEmail(req.body?.email);
    const [ipDoc,pairDoc]=await Promise.all([getLimit(keyFor('login-ip',ip)),getLimit(keyFor('login-pair',`${ip}|${email}`))]);
    if(isBlocked(ipDoc)||isBlocked(pairDoc))return res.status(429).json({message:'Too many login attempts. Please wait and try again.'});
    next();
  }catch{next()}
}
export async function recordLoginFailure(req){
  try{
    const ip=ipOf(req),email=cleanEmail(req.body?.email);
    await Promise.all([
      bump(keyFor('login-ip',ip),{windowMs:15*60*1000,max:25,blockMs:15*60*1000}),
      bump(keyFor('login-pair',`${ip}|${email}`),{windowMs:15*60*1000,max:6,blockMs:15*60*1000})
    ]);
  }catch{}
}
export async function clearLoginPair(req){
  try{await SecurityRateLimit.deleteOne({key:keyFor('login-pair',`${ipOf(req)}|${cleanEmail(req.body?.email)}`)})}catch{}
}

export async function checkTwoFactorThrottle(req,res,next){
  try{
    const doc=await getLimit(keyFor('admin-2fa-ip',ipOf(req)));
    if(isBlocked(doc))return res.status(429).json({message:'Too many verification attempts. Please wait and try again.'});
    next();
  }catch{next()}
}
export async function recordTwoFactorFailure(req){
  try{await bump(keyFor('admin-2fa-ip',ipOf(req)),{windowMs:10*60*1000,max:10,blockMs:15*60*1000})}catch{}
}
export async function clearTwoFactorThrottle(req){
  try{await SecurityRateLimit.deleteOne({key:keyFor('admin-2fa-ip',ipOf(req))})}catch{}
}

export async function registrationThrottle(req,res,next){
  try{
    const doc=await bump(keyFor('register-ip',ipOf(req)),{windowMs:60*60*1000,max:6,blockMs:60*60*1000});
    if(isBlocked(doc)&&doc.count>6)return res.status(429).json({message:'Too many registration attempts. Please try again later.'});
    next();
  }catch{next()}
}

export function validatePassword(password){
  const value=String(password||'');
  if(value.length<10||value.length>128)return 'Password must be 10 to 128 characters long';
  let classes=0;if(/[a-z]/.test(value))classes++;if(/[A-Z]/.test(value))classes++;if(/\d/.test(value))classes++;if(/[^A-Za-z0-9]/.test(value))classes++;
  if(classes<3)return 'Password must use at least 3 of: lowercase, uppercase, number, special character';
  return '';
}

export function requireStrongPassword(req,res,next){
  const error=validatePassword(req.body?.password);
  if(error)return res.status(400).json({message:error});
  next();
}

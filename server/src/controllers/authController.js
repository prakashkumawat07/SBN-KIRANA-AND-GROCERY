import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {validatePassword,recordLoginFailure,clearLoginPair} from '../middleware/security.js';

const issuer='sbn-kirana-api';const audience='sbn-kirana-web';
function jwtSecret(){const v=process.env.JWT_SECRET||'';if(!v)throw new Error('JWT secret is not configured');return v}
const token=id=>jwt.sign({id,jti:crypto.randomUUID()},jwtSecret(),{expiresIn:'24h',algorithm:'HS256',issuer,audience});
const safe=u=>({id:u._id,name:u.name,email:u.email,phone:u.phone,role:u.role,isActive:u.isActive,payLater:u.payLater,referralCode:u.referralCode,referralCount:u.referralCount||0});
const referralFor=u=>`SBN${String(u._id).slice(-6).toUpperCase()}`;
const emailOf=v=>String(v||'').trim().toLowerCase();
const cleanText=(v,max)=>String(v||'').trim().replace(/[<>\u0000-\u001F]/g,'').slice(0,max);
async function ensureReferral(user){if(!user.referralCode){user.referralCode=referralFor(user);await user.save()}return user}

export async function register(req,res,next){
  try{
    const name=cleanText(req.body.name,100),email=emailOf(req.body.email),phone=cleanText(req.body.phone,20),password=String(req.body.password||''),referralCode=cleanText(req.body.referralCode,30).toUpperCase();
    if(!name||!email||!password)return res.status(400).json({message:'Name, email and password are required'});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>160)return res.status(400).json({message:'Enter a valid email address'});
    const passwordError=validatePassword(password);if(passwordError)return res.status(400).json({message:passwordError});
    if(await User.findOne({email}))return res.status(409).json({message:'Email already registered'});
    const referrer=referralCode?await User.findOne({referralCode,role:'customer',isActive:true}):null;
    const user=await User.create({name,email,phone,password,referredBy:referrer?._id||null});
    user.referralCode=referralFor(user);await user.save();
    if(referrer)await User.updateOne({_id:referrer._id},{$inc:{referralCount:1}});
    res.status(201).json({user:safe(user),token:token(user._id)});
  }catch(e){next(e)}
}

export async function login(req,res,next){
  try{
    const email=emailOf(req.body.email),password=String(req.body.password||'');
    if(!email||!password)return res.status(401).json({message:'Invalid email or password'});
    let user=await User.findOne({email}).select('+password');
    if(!user||!(await user.comparePassword(password))){await recordLoginFailure(req);return res.status(401).json({message:'Invalid email or password'})}
    if(user.isActive===false)return res.status(403).json({message:'Account is disabled'});
    await clearLoginPair(req);
    user=await ensureReferral(user);
    res.json({user:safe(user),token:token(user._id)});
  }catch(e){next(e)}
}

export async function me(req,res){const user=await ensureReferral(req.user);res.json({user:safe(user)})}

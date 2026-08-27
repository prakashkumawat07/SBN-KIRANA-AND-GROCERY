import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const token=id=>jwt.sign({id},process.env.JWT_SECRET,{expiresIn:'7d'});
const safe=u=>({id:u._id,name:u.name,email:u.email,phone:u.phone,role:u.role,isActive:u.isActive,payLater:u.payLater,referralCode:u.referralCode,referralCount:u.referralCount||0});
const referralFor=u=>`SBN${String(u._id).slice(-6).toUpperCase()}`;
async function ensureReferral(user){if(!user.referralCode){user.referralCode=referralFor(user);await user.save()}return user}

export async function register(req,res,next){
  try{
    const {name,email,phone,password,referralCode}=req.body;
    if(!name||!email||!password)return res.status(400).json({message:'Name, email and password are required'});
    if(password.length<6)return res.status(400).json({message:'Password must be at least 6 characters'});
    if(await User.findOne({email:email.toLowerCase()}))return res.status(409).json({message:'Email already registered'});
    const referrer=referralCode?await User.findOne({referralCode:String(referralCode).trim().toUpperCase(),role:'customer'}):null;
    const user=await User.create({name,email,phone,password,referredBy:referrer?._id||null});
    user.referralCode=referralFor(user);await user.save();
    if(referrer)await User.updateOne({_id:referrer._id},{$inc:{referralCount:1}});
    res.status(201).json({user:safe(user),token:token(user._id)});
  }catch(e){next(e)}
}

export async function login(req,res,next){
  try{
    const {email,password}=req.body;
    let user=await User.findOne({email:email?.toLowerCase()}).select('+password');
    if(!user||!(await user.comparePassword(password||'')))return res.status(401).json({message:'Invalid email or password'});
    if(user.isActive===false)return res.status(403).json({message:'Account is disabled'});
    user=await ensureReferral(user);
    res.json({user:safe(user),token:token(user._id)});
  }catch(e){next(e)}
}

export async function me(req,res){const user=await ensureReferral(req.user);res.json({user:safe(user)})}

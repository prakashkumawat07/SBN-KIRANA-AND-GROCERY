import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const token=id=>jwt.sign({id},process.env.JWT_SECRET,{expiresIn:'7d'});
const safe=u=>({id:u._id,name:u.name,email:u.email,phone:u.phone,role:u.role,isActive:u.isActive,payLater:u.payLater});

export async function register(req,res,next){
  try{
    const {name,email,phone,password}=req.body;
    if(!name||!email||!password)return res.status(400).json({message:'Name, email and password are required'});
    if(password.length<6)return res.status(400).json({message:'Password must be at least 6 characters'});
    if(await User.findOne({email:email.toLowerCase()}))return res.status(409).json({message:'Email already registered'});
    const user=await User.create({name,email,phone,password});
    res.status(201).json({user:safe(user),token:token(user._id)});
  }catch(e){next(e)}
}

export async function login(req,res,next){
  try{
    const {email,password}=req.body;
    const user=await User.findOne({email:email?.toLowerCase()}).select('+password');
    if(!user||!(await user.comparePassword(password||'')))return res.status(401).json({message:'Invalid email or password'});
    if(user.isActive===false)return res.status(403).json({message:'Account is disabled'});
    res.json({user:safe(user),token:token(user._id)});
  }catch(e){next(e)}
}

export async function me(req,res){res.json({user:safe(req.user)})}

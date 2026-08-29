import User from '../models/User.js';
import {validatePassword} from '../middleware/security.js';

const clean=(v,max=160)=>String(v||'').trim().replace(/[<>\u0000-\u001F]/g,'').slice(0,max);
const emailOf=v=>String(v||'').trim().toLowerCase().slice(0,160);
const safe=u=>({_id:u._id,name:u.name,email:u.email,phone:u.phone||'',role:u.role,isActive:u.isActive,sessionVersion:u.sessionVersion||0,lastPasswordChangedAt:u.lastPasswordChangedAt,createdAt:u.createdAt,updatedAt:u.updatedAt});

export async function posUsers(req,res,next){
  try{res.setHeader('Cache-Control','no-store, private');res.json((await User.find({role:'pos'}).sort({createdAt:-1})).map(safe))}catch(e){next(e)}
}

export async function createPosUser(req,res,next){
  try{
    const name=clean(req.body.name,100),email=emailOf(req.body.email),phone=clean(req.body.phone,20),password=String(req.body.password||'');
    if(!name||!email||!password)return res.status(400).json({message:'Name, email and password are required'});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({message:'Enter a valid email address'});
    const passwordError=validatePassword(password);if(passwordError)return res.status(400).json({message:passwordError});
    if(await User.findOne({email}))return res.status(409).json({message:'Email already exists'});
    const user=await User.create({name,email,phone,password,role:'pos',isActive:true});
    res.status(201).json(safe(user));
  }catch(e){next(e)}
}

export async function updatePosUser(req,res,next){
  try{
    const user=await User.findOne({_id:req.params.id,role:'pos'});if(!user)return res.status(404).json({message:'POS staff account not found'});
    if(req.body.name!==undefined)user.name=clean(req.body.name,100)||user.name;
    if(req.body.phone!==undefined)user.phone=clean(req.body.phone,20);
    if(req.body.isActive!==undefined){const nextActive=Boolean(req.body.isActive);if(user.isActive!==nextActive){user.isActive=nextActive;user.sessionVersion=Number(user.sessionVersion||0)+1}}
    await user.save();res.json(safe(user));
  }catch(e){next(e)}
}

export async function resetPosPassword(req,res,next){
  try{
    const password=String(req.body.password||'');const passwordError=validatePassword(password);if(passwordError)return res.status(400).json({message:passwordError});
    const user=await User.findOne({_id:req.params.id,role:'pos'}).select('+password');if(!user)return res.status(404).json({message:'POS staff account not found'});
    user.password=password;user.sessionVersion=Number(user.sessionVersion||0)+1;await user.save();
    res.json({message:'POS password changed and all previous POS sessions signed out'});
  }catch(e){next(e)}
}

export async function signOutPosUser(req,res,next){
  try{
    const user=await User.findOne({_id:req.params.id,role:'pos'});if(!user)return res.status(404).json({message:'POS staff account not found'});
    user.sessionVersion=Number(user.sessionVersion||0)+1;await user.save();
    res.json({message:'All POS sessions for this staff account have been signed out'});
  }catch(e){next(e)}
}

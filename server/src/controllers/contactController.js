import Message from '../models/Message.js';

const clean=(value,max)=>String(value||'').trim().replace(/[<>\u0000-\u001F]/g,'').slice(0,max);

export async function createMessage(req,res,next){
  try{
    const name=clean(req.body.name,100);
    const email=clean(req.body.email,160).toLowerCase();
    const phone=clean(req.body.phone,20);
    const subject=clean(req.body.subject,160);
    const message=clean(req.body.message,3000);
    if(!name||!email||!subject||!message)return res.status(400).json({message:'Please complete all required fields'});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({message:'Enter a valid email address'});
    const saved=await Message.create({name,email,phone,subject,message});
    res.status(201).json({message:'Message received',id:saved._id});
  }catch(e){next(e)}
}

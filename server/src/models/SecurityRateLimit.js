import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  key:{type:String,required:true,unique:true,index:true},
  count:{type:Number,default:0,min:0},
  windowStart:{type:Date,default:Date.now},
  blockedUntil:Date,
  expiresAt:{type:Date,required:true,index:{expires:0}}
},{timestamps:false});

export default mongoose.model('SecurityRateLimit',schema);

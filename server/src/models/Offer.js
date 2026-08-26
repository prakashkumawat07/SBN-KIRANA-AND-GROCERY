import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  title:{type:String,required:true,trim:true},
  code:{type:String,required:true,unique:true,uppercase:true,trim:true},
  description:{type:String,default:'',trim:true},
  type:{type:String,enum:['percent','fixed'],default:'percent'},
  value:{type:Number,required:true,min:0},
  minOrder:{type:Number,default:0,min:0},
  maxDiscount:{type:Number,default:0,min:0},
  active:{type:Boolean,default:true},
  featured:{type:Boolean,default:false},
  startsAt:Date,
  endsAt:Date,
  usageLimit:{type:Number,default:0,min:0},
  usedCount:{type:Number,default:0,min:0}
},{timestamps:true});

export default mongoose.model('Offer',schema);

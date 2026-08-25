import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  name:{type:String,required:true,trim:true},
  phone:{type:String,default:''},
  jobRole:{type:String,default:'Store Staff'},
  salary:{type:Number,default:0,min:0},
  status:{type:String,enum:['Active','On Leave','Inactive'],default:'Active'},
  joinedAt:{type:Date,default:Date.now},
  note:{type:String,default:''}
},{timestamps:true});

export default mongoose.model('Worker',schema);

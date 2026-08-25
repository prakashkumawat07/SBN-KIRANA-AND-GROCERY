import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  type:{type:String,enum:['income','expense'],required:true},
  amount:{type:Number,required:true,min:0},
  category:{type:String,required:true,trim:true},
  note:{type:String,default:''},
  entryDate:{type:Date,default:Date.now},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'}
},{timestamps:true});

export default mongoose.model('CashEntry',schema);

import mongoose from 'mongoose';

const proofSchema=new mongoose.Schema({
  fileName:{type:String,default:''},
  mimeType:{type:String,default:''},
  size:{type:Number,default:0,min:0},
  encryptedData:{type:String,default:'',select:false},
  iv:{type:String,default:'',select:false},
  authTag:{type:String,default:'',select:false}
},{_id:false});

const schema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  amount:{type:Number,required:true,min:0.01},
  method:{type:String,enum:['ONLINE','UPI','BANK_TRANSFER','CASH_AT_STORE'],required:true,index:true},
  reference:{type:String,default:'',trim:true},
  note:{type:String,default:'',trim:true},
  proof:{type:proofSchema,default:()=>({})},
  status:{type:String,enum:['pending','verified','rejected'],default:'pending',index:true},
  outstandingAtSubmit:{type:Number,default:0,min:0},
  outstandingAfter:{type:Number,default:null,min:0},
  reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',default:null},
  reviewedAt:{type:Date,default:null},
  adminNote:{type:String,default:'',trim:true}
},{timestamps:true});

schema.index({user:1,createdAt:-1});
schema.index({status:1,createdAt:-1});
export default mongoose.models.PayLaterPayment||mongoose.model('PayLaterPayment',schema);

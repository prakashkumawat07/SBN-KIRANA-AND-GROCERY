import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  product:{type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true,index:true},
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  rating:{type:Number,required:true,min:1,max:5},
  title:{type:String,trim:true,maxlength:100,default:''},
  comment:{type:String,trim:true,maxlength:1000,default:''},
  verifiedPurchase:{type:Boolean,default:false},
  approved:{type:Boolean,default:false,index:true},
  moderatedAt:{type:Date,default:null},
  moderatedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',default:null}
},{timestamps:true});

schema.index({product:1,user:1},{unique:true});
schema.index({product:1,approved:1,createdAt:-1});
export default mongoose.model('Review',schema);

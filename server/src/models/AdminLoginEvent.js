import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  admin:{type:mongoose.Schema.Types.ObjectId,ref:'User',default:null,index:true},
  email:{type:String,default:'',trim:true,lowercase:true},
  outcome:{type:String,enum:['success','password_failed','two_factor_required','two_factor_failed','account_disabled'],required:true},
  ip:{type:String,default:''},
  userAgent:{type:String,default:''},
  createdAt:{type:Date,default:Date.now}
},{versionKey:false});

schema.index({admin:1,createdAt:-1});
schema.index({createdAt:1},{expireAfterSeconds:90*24*60*60});

export default mongoose.model('AdminLoginEvent',schema);

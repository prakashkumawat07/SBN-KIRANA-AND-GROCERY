import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  admin:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  action:{type:String,required:true,trim:true},
  method:{type:String,default:'',trim:true},
  path:{type:String,default:'',trim:true},
  targetId:{type:String,default:'',trim:true},
  statusCode:{type:Number,default:0},
  ip:{type:String,default:''},
  userAgent:{type:String,default:''},
  createdAt:{type:Date,default:Date.now,index:true}
},{versionKey:false});

schema.index({admin:1,createdAt:-1});
schema.index({createdAt:1},{expireAfterSeconds:365*24*60*60});

export default mongoose.model('AdminAuditLog',schema);

import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxlength:100},
  email:{type:String,required:true,trim:true,lowercase:true,maxlength:160},
  phone:{type:String,default:'',trim:true,maxlength:20},
  subject:{type:String,required:true,trim:true,maxlength:160},
  message:{type:String,required:true,trim:true,maxlength:3000},
  read:{type:Boolean,default:false}
},{timestamps:true});

export default mongoose.model('Message',schema);

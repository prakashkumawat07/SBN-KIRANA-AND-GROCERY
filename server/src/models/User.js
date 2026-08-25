import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const payLaterSchema=new mongoose.Schema({
  status:{type:String,enum:['not_requested','pending','approved','blocked'],default:'not_requested'},
  requestedLimit:{type:Number,default:0,min:0},
  limit:{type:Number,default:0,min:0},
  used:{type:Number,default:0,min:0},
  dueDate:Date,
  note:{type:String,default:''},
  updatedAt:Date
},{_id:false});

const schema=new mongoose.Schema({
  name:{type:String,required:true,trim:true},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  phone:{type:String,trim:true},
  password:{type:String,required:true,minlength:6,select:false},
  role:{type:String,enum:['customer','admin'],default:'customer'},
  isActive:{type:Boolean,default:true},
  payLater:{type:payLaterSchema,default:()=>({})}
},{timestamps:true});

schema.pre('save',async function(next){
  if(!this.isModified('password'))return next();
  this.password=await bcrypt.hash(this.password,12);
  next();
});

schema.methods.comparePassword=function(candidate){return bcrypt.compare(candidate,this.password)};
export default mongoose.model('User',schema);

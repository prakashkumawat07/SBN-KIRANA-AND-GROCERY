import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  customer:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  admin:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  type:{
    type:String,
    enum:['limit_change','status_change','payment_received','call','message','email','home_visit','legal_review','promise_to_pay','dispute','note'],
    required:true
  },
  note:{type:String,trim:true,default:''},
  amount:{type:Number,min:0,default:0},
  previousLimit:{type:Number,min:0},
  newLimit:{type:Number,min:0},
  scheduledFor:Date,
  outcome:{type:String,enum:['logged','completed','no_answer','promised','disputed','cancelled'],default:'logged'}
},{timestamps:true});

export default mongoose.model('RecoveryAction',schema);

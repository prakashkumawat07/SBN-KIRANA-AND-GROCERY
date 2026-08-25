import mongoose from 'mongoose';

const item=new mongoose.Schema({
  product:{type:mongoose.Schema.Types.ObjectId,ref:'Product'},
  name:String,
  image:String,
  price:Number,
  costPrice:{type:Number,default:0},
  quantity:Number
},{_id:true});

const schema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  items:[item],
  shippingAddress:{fullName:String,phone:String,address:String,city:String,state:String,pincode:String},
  paymentMethod:{type:String,enum:['COD','UPI','PAYLATER'],default:'COD'},
  paymentStatus:{type:String,enum:['Pending','Paid','Due','Refunded'],default:'Pending'},
  payLaterDueDate:Date,
  subtotal:Number,
  deliveryFee:Number,
  total:Number,
  status:{type:String,enum:['Placed','Confirmed','Packed','Shipped','Delivered','Cancelled'],default:'Placed'}
},{timestamps:true});

export default mongoose.model('Order',schema);

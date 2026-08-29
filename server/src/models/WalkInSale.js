import mongoose from 'mongoose';

const itemSchema=new mongoose.Schema({
  product:{type:mongoose.Schema.Types.ObjectId,ref:'Product',default:null},
  name:{type:String,required:true,trim:true},
  unit:{type:String,default:''},
  saleUnit:{type:String,enum:['QTY','KG','PACK'],default:'QTY'},
  inventoryMatched:{type:Boolean,default:false},
  price:{type:Number,required:true,min:0},
  costPrice:{type:Number,default:0,min:0},
  quantity:{type:Number,required:true,min:0.001},
  amount:{type:Number,required:true,min:0}
},{_id:true});

const schema=new mongoose.Schema({
  billNo:{type:String,unique:true,index:true},
  customer:{
    name:{type:String,default:'Walk-in Customer'},
    phone:{type:String,default:''},
    email:{type:String,default:''}
  },
  items:{type:[itemSchema],validate:v=>Array.isArray(v)&&v.length>0},
  subtotal:{type:Number,required:true,min:0},
  discount:{type:Number,default:0,min:0},
  tax:{type:Number,default:0,min:0},
  total:{type:Number,required:true,min:0},
  paymentMethod:{type:String,enum:['CASH','UPI','CARD','ONLINE'],default:'CASH'},
  paymentStatus:{type:String,enum:['Paid','Pending','Refunded'],default:'Paid'},
  paymentReference:{type:String,default:''},
  note:{type:String,default:''},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}
},{timestamps:true});

schema.pre('validate',function(next){
  if(!this.billNo)this.billNo=`SBN-POS-${Date.now().toString().slice(-9)}`;
  next();
});

export default mongoose.model('WalkInSale',schema);

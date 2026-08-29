import mongoose from 'mongoose';

const requestedItemSchema=new mongoose.Schema({
  name:{type:String,required:true,trim:true},
  quantity:{type:Number,default:1,min:0},
  unit:{type:String,default:'pcs',trim:true},
  note:{type:String,default:'',trim:true}
},{_id:true});

const quoteItemSchema=new mongoose.Schema({
  name:{type:String,required:true,trim:true},
  quantity:{type:Number,default:1,min:0},
  unit:{type:String,default:'pcs',trim:true},
  rate:{type:Number,default:0,min:0},
  amount:{type:Number,default:0,min:0}
},{_id:true});

const schema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  requestNo:{type:String,index:true},
  contact:{
    name:{type:String,required:true,trim:true},
    email:{type:String,required:true,trim:true,lowercase:true},
    phone:{type:String,required:true,trim:true},
    businessName:{type:String,default:'',trim:true},
    gstNumber:{type:String,default:'',trim:true},
    address:{type:String,required:true,trim:true},
    city:{type:String,required:true,trim:true},
    state:{type:String,required:true,trim:true},
    pincode:{type:String,required:true,trim:true}
  },
  requestedItems:[requestedItemSchema],
  attachment:{
    name:String,
    type:String,
    size:Number,
    data:String
  },
  customerNote:{type:String,default:'',trim:true},
  status:{type:String,enum:['Requested','Reviewing','Quoted','Accepted','Rejected','Confirmed','Preparing','Out for Delivery','Delivered','Cancelled'],default:'Requested',index:true},
  quotation:{
    quoteNo:String,
    items:[quoteItemSchema],
    subtotal:{type:Number,default:0,min:0},
    discount:{type:Number,default:0,min:0},
    tax:{type:Number,default:0,min:0},
    deliveryFee:{type:Number,default:0,min:0},
    total:{type:Number,default:0,min:0},
    validUntil:Date,
    note:{type:String,default:''},
    createdAt:Date,
    updatedAt:Date
  },
  decision:{
    status:{type:String,enum:['Pending','Accepted','Rejected'],default:'Pending'},
    note:{type:String,default:''},
    decidedAt:Date
  },
  payment:{
    method:{type:String,enum:['Not selected','COD','UPI','Bank Transfer','Cash','PayLater'],default:'Not selected'},
    status:{type:String,enum:['Pending','Partial','Paid','Refunded'],default:'Pending'},
    amountPaid:{type:Number,default:0,min:0},
    reference:{type:String,default:''},
    note:{type:String,default:''},
    updatedAt:Date
  },
  delivery:{
    mode:{type:String,enum:['Door Delivery','Store Pickup'],default:'Door Delivery'},
    status:{type:String,enum:['Pending','Scheduled','Preparing','Out for Delivery','Delivered','Cancelled'],default:'Pending'},
    expectedDate:Date,
    deliveredAt:Date,
    note:{type:String,default:''},
    updatedAt:Date
  },
  billing:{
    invoiceNo:String,
    issuedAt:Date
  },
  adminNote:{type:String,default:''}
},{timestamps:true});

export default mongoose.model('BulkOrder',schema);

import mongoose from 'mongoose';

const proofSchema=new mongoose.Schema({
  type:{type:String,enum:['AADHAAR','VOTER_ID','PAN'],required:true},
  last4:{type:String,required:true,trim:true,maxlength:4},
  fileName:{type:String,default:''},
  mimeType:{type:String,default:''},
  size:{type:Number,default:0},
  encryptedData:{type:String,default:'',select:false},
  iv:{type:String,default:'',select:false},
  authTag:{type:String,default:'',select:false}
},{_id:false});

const addressSchema=new mongoose.Schema({
  houseNo:{type:String,required:true,trim:true},
  landmark:{type:String,default:'',trim:true},
  village:{type:String,default:'',trim:true},
  city:{type:String,required:true,trim:true},
  district:{type:String,default:'',trim:true},
  state:{type:String,default:'Rajasthan',trim:true},
  pincode:{type:String,required:true,trim:true},
  locality:{type:String,default:'',trim:true}
},{_id:false});

const schema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,unique:true,index:true},
  requestedLimit:{type:Number,required:true,min:1,max:100000},
  phone:{type:String,required:true,trim:true,maxlength:20},
  email:{type:String,required:true,trim:true,lowercase:true,maxlength:160},
  address:{type:addressSchema,required:true},
  proof:{type:proofSchema,required:true},
  consent:{type:Boolean,required:true},
  status:{type:String,enum:['submitted','under_review','approved','rejected','needs_update'],default:'submitted'},
  idVerified:{type:Boolean,default:false},
  addressVerified:{type:Boolean,default:false},
  phoneVerified:{type:Boolean,default:false},
  verificationNote:{type:String,default:'',maxlength:1500},
  reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
  reviewedAt:Date
},{timestamps:true});

export default mongoose.model('PayLaterApplication',schema);

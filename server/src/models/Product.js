import mongoose from 'mongoose';

const urlImage=/^https?:\/\//i;
const dataImage=/^data:image\/(jpeg|png|webp);base64,/i;
const validImage=(value,maxDataLength)=>{
  const v=String(value||'').trim();
  if(!v)return false;
  if(urlImage.test(v))return v.length<=2048;
  if(dataImage.test(v))return v.length<=maxDataLength;
  return false;
};

const DEAL_RAILS=['hot_deals','trending','best_value','top_picks','daily_essentials','staples','dairy','snacks','home_care'];
const CUSTOMER_BADGES=['none','limited','selling_fast','few_left','in_stock','popular','fresh','best_value','hot_deal','trending','today_pick'];

const productImageSchema=new mongoose.Schema({
  src:{type:String,required:true,validate:{validator:v=>validImage(v,430000),message:'Invalid product image'}},
  thumbnail:{type:String,default:'',validate:{validator:v=>!v||validImage(v,125000),message:'Invalid product thumbnail'}},
  alt:{type:String,default:'',trim:true,maxlength:180}
},{_id:false});

const schema=new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxlength:160},
  brand:{type:String,default:'',trim:true,maxlength:100},
  sku:{type:String,default:'',trim:true,maxlength:80,index:true},
  barcode:{type:String,default:'',trim:true,maxlength:80},
  category:{type:String,required:true,index:true,trim:true,maxlength:80},
  price:{type:Number,required:true,min:0},
  mrp:{type:Number,required:true,min:0},
  costPrice:{type:Number,default:0,min:0},
  unit:{type:String,required:true,trim:true,maxlength:60},
  stock:{type:Number,required:true,min:0,default:0},
  stockUnit:{type:String,enum:['qty','kg','g','ltr','ml','pack'],default:'qty'},
  lowStockThreshold:{type:Number,default:10,min:0},
  customerBadge:{type:String,enum:CUSTOMER_BADGES,default:'none'},
  dealRails:{type:[{type:String,enum:DEAL_RAILS}],default:[],validate:{validator:v=>v.length<=9,message:'Too many deal rails selected'}},
  dealPriority:{type:Number,default:0,min:0,max:100},
  dealLabel:{type:String,default:'',trim:true,maxlength:80},
  image:{type:String,required:true,validate:{validator:v=>validImage(v,125000),message:'Invalid primary product image'}},
  images:{type:[productImageSchema],default:[],validate:{validator:v=>v.length<=5,message:'Maximum 5 product images are allowed'}},
  description:{type:String,default:'',trim:true,maxlength:2500},
  tags:{type:[String],default:[]},
  featured:{type:Boolean,default:false},
  discount:{type:Number,default:0}
},{timestamps:true});

schema.pre('validate',function(next){
  const normalized=(this.images||[]).slice(0,5).map((img,index)=>({
    src:String(img?.src||'').trim(),
    thumbnail:String(img?.thumbnail||img?.src||'').trim(),
    alt:String(img?.alt||this.name||`Product image ${index+1}`).trim().slice(0,180)
  })).filter(img=>img.src);
  if(normalized.length){
    this.images=normalized;
    this.image=normalized[0].thumbnail||normalized[0].src;
  }else if(this.image){
    this.images=[{src:this.image,thumbnail:this.image,alt:this.name}];
  }
  this.tags=[...new Set((this.tags||[]).map(v=>String(v||'').trim()).filter(Boolean))].slice(0,12);
  this.dealRails=[...new Set((this.dealRails||[]).map(v=>String(v||'').trim()).filter(v=>DEAL_RAILS.includes(v)))];
  this.dealLabel=String(this.dealLabel||'').replace(/[<>\u0000-\u001F]/g,'').trim().slice(0,80);
  next();
});

schema.pre('save',function(next){
  this.discount=this.mrp>this.price?Math.round((1-this.price/this.mrp)*100):0;
  next();
});

export default mongoose.model('Product',schema);

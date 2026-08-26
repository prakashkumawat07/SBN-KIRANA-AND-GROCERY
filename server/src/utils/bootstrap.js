import Product from '../models/Product.js';
import User from '../models/User.js';
import Offer from '../models/Offer.js';

const products=[
  {name:'Aashirvaad Atta',description:'Whole wheat flour for soft rotis.',category:'Staples',image:'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',price:289,mrp:320,unit:'5 kg',stock:40,featured:true},
  {name:'India Gate Basmati Rice',description:'Long grain aromatic basmati rice.',category:'Staples',image:'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',price:649,mrp:720,unit:'5 kg',stock:35,featured:true},
  {name:'Fortune Sunflower Oil',description:'Refined sunflower oil for daily cooking.',category:'Cooking',image:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80',price:148,mrp:165,unit:'1 L',stock:60,featured:true},
  {name:'Toor Dal',description:'Protein-rich arhar dal.',category:'Pulses',image:'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=900&q=80',price:169,mrp:185,unit:'1 kg',stock:45},
  {name:'Fresh Tomatoes',description:'Farm-fresh red tomatoes.',category:'Fruits & Vegetables',image:'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80',price:45,mrp:55,unit:'1 kg',stock:80,featured:true},
  {name:'Fresh Onions',description:'Fresh onions for Indian cooking.',category:'Fruits & Vegetables',image:'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=900&q=80',price:38,mrp:45,unit:'1 kg',stock:75},
  {name:'Amul Taaza Milk',description:'Toned milk for your family.',category:'Dairy',image:'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80',price:29,mrp:30,unit:'500 ml',stock:100,featured:true},
  {name:'Britannia Good Day',description:'Crunchy butter cookies.',category:'Snacks',image:'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=80',price:35,mrp:40,unit:'200 g',stock:70},
  {name:'Tata Salt',description:'Iodized salt for daily cooking.',category:'Staples',image:'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=900&q=80',price:28,mrp:30,unit:'1 kg',stock:90},
  {name:'Surf Excel Matic',description:'Machine wash detergent powder.',category:'Household',image:'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=80',price:245,mrp:280,unit:'1 kg',stock:30}
];

let bootstrapped=false;

export async function bootstrapDatabase(){
  if(bootstrapped||process.env.AUTO_SEED!=='true')return;

  const productCount=await Product.countDocuments();
  if(productCount===0)await Product.insertMany(products);

  const offerCount=await Offer.countDocuments();
  if(offerCount===0)await Offer.create({title:'Welcome Basket Offer',code:'SBN10',description:'Save 10% on an eligible grocery basket.',type:'percent',value:10,minOrder:499,maxDiscount:100,active:true,featured:true});

  const email=(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
  const password=process.env.ADMIN_PASSWORD||'';
  if(email&&password){
    let admin=await User.findOne({email});
    if(!admin){
      await User.create({name:process.env.ADMIN_NAME||'SBN Admin',email,password,role:'admin'});
    }else if(admin.role!=='admin'){
      admin.role='admin';
      await admin.save();
    }
  }

  bootstrapped=true;
}

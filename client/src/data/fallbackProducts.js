export const fallbackProducts=[
  {_id:'fallback-atta',name:'Aashirvaad Atta',description:'Whole wheat flour for soft rotis.',category:'Staples',image:'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',price:289,mrp:320,unit:'5 kg',stock:40,featured:true},
  {_id:'fallback-rice',name:'India Gate Basmati Rice',description:'Long grain aromatic basmati rice.',category:'Staples',image:'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',price:649,mrp:720,unit:'5 kg',stock:35,featured:true},
  {_id:'fallback-oil',name:'Fortune Sunflower Oil',description:'Refined sunflower oil for daily cooking.',category:'Staples',image:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80',price:148,mrp:165,unit:'1 L',stock:60,featured:true},
  {_id:'fallback-dal',name:'Toor Dal',description:'Protein-rich arhar dal.',category:'Staples',image:'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=900&q=80',price:169,mrp:185,unit:'1 kg',stock:45},
  {_id:'fallback-tomato',name:'Fresh Tomatoes',description:'Farm-fresh red tomatoes.',category:'Fruits & Vegetables',image:'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80',price:45,mrp:55,unit:'1 kg',stock:80,featured:true},
  {_id:'fallback-onion',name:'Fresh Onions',description:'Fresh onions for Indian cooking.',category:'Fruits & Vegetables',image:'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=900&q=80',price:38,mrp:45,unit:'1 kg',stock:75},
  {_id:'fallback-milk',name:'Amul Taaza Milk',description:'Toned milk for your family.',category:'Dairy',image:'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80',price:29,mrp:30,unit:'500 ml',stock:100,featured:true},
  {_id:'fallback-cookies',name:'Britannia Good Day',description:'Crunchy butter cookies.',category:'Snacks',image:'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=80',price:35,mrp:40,unit:'200 g',stock:70},
  {_id:'fallback-salt',name:'Tata Salt',description:'Iodized salt for daily cooking.',category:'Staples',image:'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=900&q=80',price:28,mrp:30,unit:'1 kg',stock:90},
  {_id:'fallback-detergent',name:'Surf Excel Matic',description:'Machine wash detergent powder.',category:'Household',image:'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=80',price:245,mrp:280,unit:'1 kg',stock:30},
  {_id:'fallback-cola',name:'Coca-Cola',description:'Chilled soft drink for refreshment.',category:'Beverages',image:'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80',price:40,mrp:40,unit:'750 ml',stock:55},
  {_id:'fallback-tea',name:'Tata Tea Premium',description:'Strong everyday Indian tea.',category:'Beverages',image:'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=900&q=80',price:145,mrp:160,unit:'500 g',stock:42}
];

export function filterFallbackProducts(search='',category='All'){
  const term=search.trim().toLowerCase();
  return fallbackProducts.filter(product=>{
    const matchesCategory=category==='All'||product.category===category;
    const haystack=`${product.name} ${product.description||''} ${product.category} ${product.unit||''}`.toLowerCase();
    return matchesCategory&&(!term||haystack.includes(term));
  });
}

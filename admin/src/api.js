const API_URL=import.meta.env.VITE_API_URL||(import.meta.env.PROD?'https://sbn-kirana-api.vercel.app/api':'http://localhost:5000/api');
const DEMO_KEY='sbn_admin_demo_db_v2';
const now=()=>new Date().toISOString();
const id=()=>`${Date.now()}${Math.random().toString(16).slice(2)}`;

function seedDemo(){
  const today=new Date();
  const day=n=>new Date(today.getTime()-n*86400000).toISOString();
  return {
    products:[
      {_id:'p10000000000000000000001',name:'Aashirvaad Atta',category:'Staples',price:289,mrp:320,costPrice:245,unit:'5 kg',stock:8,lowStockThreshold:10,image:'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',featured:true},
      {_id:'p10000000000000000000002',name:'India Gate Basmati Rice',category:'Staples',price:649,mrp:720,costPrice:560,unit:'5 kg',stock:24,lowStockThreshold:8,image:'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',featured:true},
      {_id:'p10000000000000000000003',name:'Amul Taaza Milk',category:'Dairy',price:29,mrp:30,costPrice:25,unit:'500 ml',stock:42,lowStockThreshold:15,image:'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',featured:true},
      {_id:'p10000000000000000000004',name:'Fresh Tomatoes',category:'Fruits & Vegetables',price:45,mrp:55,costPrice:31,unit:'1 kg',stock:6,lowStockThreshold:12,image:'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=500&q=80',featured:true},
      {_id:'p10000000000000000000005',name:'Fortune Sunflower Oil',category:'Cooking',price:148,mrp:165,costPrice:128,unit:'1 L',stock:30,lowStockThreshold:10,image:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',featured:false}
    ],
    customers:[
      {_id:'u10000000000000000000001',name:'Rahul Sharma',email:'rahul@example.com',phone:'9876543210',createdAt:day(42),payLater:{status:'approved',requestedLimit:5000,limit:5000,used:1850,dueDate:day(-12),note:'Regular customer'}},
      {_id:'u10000000000000000000002',name:'Neha Verma',email:'neha@example.com',phone:'9823456710',createdAt:day(21),payLater:{status:'pending',requestedLimit:3000,limit:0,used:0,dueDate:null,note:''}},
      {_id:'u10000000000000000000003',name:'Amit Kumar',email:'amit@example.com',phone:'9780011223',createdAt:day(16),payLater:{status:'approved',requestedLimit:2500,limit:2500,used:620,dueDate:day(-7),note:''}}
    ],
    orders:[
      {_id:'o10000000000000000000001',user:{name:'Rahul Sharma',email:'rahul@example.com'},items:[{quantity:2}],total:1240,paymentMethod:'PAYLATER',status:'Delivered',createdAt:day(0)},
      {_id:'o10000000000000000000002',user:{name:'Neha Verma',email:'neha@example.com'},items:[{quantity:3}],total:865,paymentMethod:'COD',status:'Confirmed',createdAt:day(1)},
      {_id:'o10000000000000000000003',user:{name:'Amit Kumar',email:'amit@example.com'},items:[{quantity:4}],total:1560,paymentMethod:'UPI',status:'Packed',createdAt:day(3)},
      {_id:'o10000000000000000000004',user:{name:'Rahul Sharma',email:'rahul@example.com'},items:[{quantity:1}],total:610,paymentMethod:'PAYLATER',status:'Delivered',createdAt:day(5)}
    ],
    workers:[
      {_id:'w10000000000000000000001',name:'Ramesh',phone:'9811100011',jobRole:'Store Manager',salary:18000,status:'Active',note:''},
      {_id:'w10000000000000000000002',name:'Suresh',phone:'9811100022',jobRole:'Delivery Staff',salary:14000,status:'Active',note:''}
    ],
    cash:[
      {_id:'c10000000000000000000001',type:'income',amount:3500,category:'Counter Sales',note:'Daily cash sale',entryDate:day(0)},
      {_id:'c10000000000000000000002',type:'expense',amount:950,category:'Transport',note:'Stock pickup',entryDate:day(1)}
    ],
    admins:[{_id:'a10000000000000000000001',name:'SBN Admin',email:'admin@sbnkirana.com',phone:'',role:'admin',isActive:true,createdAt:day(60)}],
    messages:[{_id:'m10000000000000000000001',name:'Demo Customer',email:'customer@example.com',phone:'',subject:'Bulk order enquiry',message:'Need monthly grocery supply for office.',read:false,createdAt:day(2)}]
  };
}
function loadDemo(){try{const v=JSON.parse(localStorage.getItem(DEMO_KEY)||'null');if(v)return v}catch{}const d=seedDemo();localStorage.setItem(DEMO_KEY,JSON.stringify(d));return d}
function saveDemo(d){localStorage.setItem(DEMO_KEY,JSON.stringify(d));return d}
function bodyOf(options){try{return JSON.parse(options?.body||'{}')}catch{return {}}}
function cashSummary(d){const income=d.cash.filter(x=>x.type==='income').reduce((s,x)=>s+Number(x.amount||0),0);const expense=d.cash.filter(x=>x.type==='expense').reduce((s,x)=>s+Number(x.amount||0),0);return {entries:[...d.cash].sort((a,b)=>new Date(b.entryDate)-new Date(a.entryDate)),income,expense,balance:income-expense}}

async function demoApi(path,options={}){
  const method=(options.method||'GET').toUpperCase();
  const b=bodyOf(options);const d=loadDemo();
  if(path==='/auth/login'&&method==='POST'){
    if((b.email||'').toLowerCase()!=='admin@sbnkirana.com'||b.password!=='ChangeMe123!')throw new Error('Invalid admin email or password');
    const user={id:'a10000000000000000000001',_id:'a10000000000000000000001',name:'SBN Admin',email:'admin@sbnkirana.com',role:'admin'};
    return {user,token:'sbn-demo-admin-token'};
  }
  if(path==='/admin/dashboard'&&method==='GET'){
    const revenue=d.orders.filter(x=>x.status!=='Cancelled').reduce((s,x)=>s+Number(x.total||0),0);
    const grossProfit=Math.round(revenue*.18);const payLaterDue=d.customers.reduce((s,u)=>s+Number(u.payLater?.used||0),0);const cs=cashSummary(d);
    return {revenue,grossProfit,payLaterDue,salesToday:d.orders.filter(x=>new Date(x.createdAt).toDateString()===new Date().toDateString()).reduce((s,x)=>s+x.total,0),orders:d.orders.length,customers:d.customers.length,lowStock:d.products.filter(p=>p.stock<=p.lowStockThreshold).length,workers:d.workers.filter(w=>w.status==='Active').length,cashBalance:cs.balance,recentOrders:[...d.orders].slice(0,6)};
  }
  if(path==='/admin/products'&&method==='GET')return d.products;
  if(path==='/admin/products'&&method==='POST'){const p={_id:id(),lowStockThreshold:10,costPrice:0,...b};d.products.unshift(p);saveDemo(d);return p}
  let m=path.match(/^\/admin\/products\/([^/]+)$/);if(m&&method==='PUT'){const p=d.products.find(x=>x._id===m[1]);if(p)Object.assign(p,b);saveDemo(d);return p}if(m&&method==='DELETE'){d.products=d.products.filter(x=>x._id!==m[1]);saveDemo(d);return {message:'Product deleted'}}
  if(path==='/admin/orders'&&method==='GET')return d.orders;
  m=path.match(/^\/admin\/orders\/([^/]+)\/status$/);if(m&&method==='PATCH'){const o=d.orders.find(x=>x._id===m[1]);if(o)o.status=b.status;saveDemo(d);return o}
  if(path==='/admin/customers'&&method==='GET')return d.customers;
  if(path==='/admin/messages'&&method==='GET')return d.messages;
  if(path==='/admin/paylater'&&method==='GET')return d.customers.filter(u=>u.payLater&&u.payLater.status!=='not_requested');
  m=path.match(/^\/admin\/paylater\/([^/]+)$/);if(m&&method==='PATCH'){const u=d.customers.find(x=>x._id===m[1]);if(u){u.payLater={...(u.payLater||{}),...b};if(b.status==='approved'&&!u.payLater.dueDate)u.payLater.dueDate=new Date(Date.now()+30*86400000).toISOString()}saveDemo(d);return u}
  m=path.match(/^\/admin\/paylater\/([^/]+)\/payment$/);if(m&&method==='POST'){const u=d.customers.find(x=>x._id===m[1]);const amount=Math.max(Number(b.amount)||0,0);if(u){u.payLater.used=Math.max(Number(u.payLater.used||0)-amount,0);d.cash.unshift({_id:id(),type:'income',amount,category:'PayLater Recovery',note:`Received from ${u.name}`,entryDate:now()})}saveDemo(d);return u}
  if(path==='/admin/stock'&&method==='GET')return d.products;
  m=path.match(/^\/admin\/stock\/([^/]+)$/);if(m&&method==='PATCH'){const p=d.products.find(x=>x._id===m[1]);if(p)Object.assign(p,b);saveDemo(d);return p}
  if(path==='/admin/reports'&&method==='GET'){const revenue=d.orders.filter(x=>x.status!=='Cancelled').reduce((s,x)=>s+Number(x.total||0),0);const groups={};d.orders.forEach(o=>{const date=o.createdAt.slice(0,10);groups[date]=(groups[date]||0)+Number(o.total||0)});return {revenue,grossProfit:Math.round(revenue*.18),averageOrder:Math.round(revenue/Math.max(d.orders.length,1)),orders:d.orders.length,stockCost:d.products.reduce((s,p)=>s+Number(p.costPrice||0)*Number(p.stock||0),0),stockRetail:d.products.reduce((s,p)=>s+Number(p.price||0)*Number(p.stock||0),0),salesByDay:Object.entries(groups).map(([date,total])=>({date,total})).sort((a,b)=>a.date.localeCompare(b.date))}}
  if(path==='/admin/workers'&&method==='GET')return d.workers;
  if(path==='/admin/workers'&&method==='POST'){const w={_id:id(),createdAt:now(),...b};d.workers.unshift(w);saveDemo(d);return w}
  m=path.match(/^\/admin\/workers\/([^/]+)$/);if(m&&method==='PATCH'){const w=d.workers.find(x=>x._id===m[1]);if(w)Object.assign(w,b);saveDemo(d);return w}if(m&&method==='DELETE'){d.workers=d.workers.filter(x=>x._id!==m[1]);saveDemo(d);return {message:'Worker deleted'}}
  if(path==='/admin/cash'&&method==='GET')return cashSummary(d);
  if(path==='/admin/cash'&&method==='POST'){const e={_id:id(),entryDate:now(),...b};d.cash.unshift(e);saveDemo(d);return e}
  m=path.match(/^\/admin\/cash\/([^/]+)$/);if(m&&method==='DELETE'){d.cash=d.cash.filter(x=>x._id!==m[1]);saveDemo(d);return {message:'Entry deleted'}}
  if(path==='/admin/admins'&&method==='GET')return d.admins;
  if(path==='/admin/admins'&&method==='POST'){if(d.admins.some(a=>a.email.toLowerCase()===String(b.email||'').toLowerCase()))throw new Error('Admin email already exists');const a={_id:id(),role:'admin',isActive:true,createdAt:now(),...b};delete a.password;d.admins.unshift(a);saveDemo(d);return a}
  m=path.match(/^\/admin\/admins\/([^/]+)$/);if(m&&method==='PATCH'){const a=d.admins.find(x=>x._id===m[1]);if(a)Object.assign(a,b);saveDemo(d);return a}
  throw new Error('This demo action needs the live backend');
}

export async function adminApi(path,options={}){
  const token=localStorage.getItem('sbn_admin_token');
  try{
    const res=await fetch(`${API_URL}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...(options.headers||{})}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.message||'Request failed');
    return data;
  }catch(error){
    if(error instanceof TypeError||String(error?.message||'').toLowerCase().includes('fetch'))return demoApi(path,options);
    throw error;
  }
}

import Product from '../models/Product.js';
import Order from '../models/Order.js';
import WalkInSale from '../models/WalkInSale.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Worker from '../models/Worker.js';
import CashEntry from '../models/CashEntry.js';
import RecoveryAction from '../models/RecoveryAction.js';

const money=n=>Math.round((Number(n)||0)*100)/100;
const safeAdminRecord=u=>({_id:u._id,name:u.name,email:u.email,phone:u.phone||'',role:u.role,isActive:u.isActive,twoFactorEnabled:Boolean(u.twoFactor?.enabled),lastPasswordChangedAt:u.lastPasswordChangedAt,createdAt:u.createdAt,updatedAt:u.updatedAt});
const PRODUCT_FIELDS=['name','brand','sku','barcode','category','price','mrp','costPrice','unit','stock','stockUnit','lowStockThreshold','customerBadge','dealRails','dealPriority','dealLabel','image','images','description','tags','featured'];
const productInput=body=>Object.fromEntries(PRODUCT_FIELDS.filter(key=>Object.prototype.hasOwnProperty.call(body||{},key)).map(key=>[key,body[key]]));
const profitFromOrders=orders=>money(orders.reduce((sum,o)=>sum+o.items.reduce((s,i)=>s+((i.price||0)-(i.costPrice||0))*(i.quantity||0),0),0));
const profitFromPos=sales=>money(sales.reduce((sum,o)=>sum+(o.items||[]).reduce((s,i)=>s+((i.price||0)-(i.costPrice||0))*(i.quantity||0),0)-(o.discount||0),0));

export async function dashboard(req,res,next){
  try{
    const [productDocs,orderDocs,posDocs,customers,recentOrders,workers,cash]=await Promise.all([
      Product.find(),Order.find().populate('user','name email').sort({createdAt:-1}),WalkInSale.find({paymentStatus:'Paid'}).sort({createdAt:-1}),User.countDocuments({role:'customer'}),Order.find().populate('user','name email').sort({createdAt:-1}).limit(7),Worker.countDocuments({status:'Active'}),CashEntry.find()
    ]);
    const valid=orderDocs.filter(o=>o.status!=='Cancelled');
    const onlineRevenue=money(valid.reduce((s,o)=>s+(o.total||0),0));
    const posRevenue=money(posDocs.reduce((s,o)=>s+(o.total||0),0));
    const revenue=money(onlineRevenue+posRevenue);
    const grossProfit=money(profitFromOrders(valid)+profitFromPos(posDocs));
    const payLaterDue=money(await User.aggregate([{$match:{role:'customer'}},{$group:{_id:null,total:{$sum:'$payLater.used'}}}]).then(r=>r[0]?.total||0));
    const lowStock=productDocs.filter(p=>p.stock<=p.lowStockThreshold).length;
    const today=new Date();today.setHours(0,0,0,0);
    const onlineToday=valid.filter(o=>new Date(o.createdAt)>=today).reduce((s,o)=>s+(o.total||0),0);
    const posToday=posDocs.filter(o=>new Date(o.createdAt)>=today).reduce((s,o)=>s+(o.total||0),0);
    const salesToday=money(onlineToday+posToday);
    const cashBalance=money(cash.reduce((s,e)=>s+(e.type==='income'?e.amount:-e.amount),0));
    res.json({products:productDocs.length,orders:orderDocs.length,posSales:posDocs.length,customers,revenue,onlineRevenue,posRevenue,grossProfit,payLaterDue,lowStock,workers,salesToday,cashBalance,recentOrders});
  }catch(e){next(e)}
}

export async function products(req,res,next){try{res.json(await Product.find().sort({createdAt:-1}))}catch(e){next(e)}}
export async function createProduct(req,res,next){try{res.status(201).json(await Product.create(productInput(req.body)))}catch(e){next(e)}}
export async function updateProduct(req,res,next){try{const p=await Product.findById(req.params.id);if(!p)return res.status(404).json({message:'Product not found'});Object.assign(p,productInput(req.body));await p.save();res.json(p)}catch(e){next(e)}}
export async function deleteProduct(req,res,next){try{const p=await Product.findByIdAndDelete(req.params.id);if(!p)return res.status(404).json({message:'Product not found'});res.json({message:'Product deleted'})}catch(e){next(e)}}

export async function orders(req,res,next){try{res.setHeader('Cache-Control','no-store, private');res.json(await Order.find().populate('user','name email phone payLater').sort({createdAt:-1}).limit(500))}catch(e){next(e)}}
export async function updateOrderStatus(req,res,next){
  try{
    const o=await Order.findById(req.params.id);
    if(!o)return res.status(404).json({message:'Order not found'});
    const previous=o.status;
    const nextStatus=req.body.status;
    if(!['Placed','Confirmed','Packed','Shipped','Delivered','Cancelled'].includes(nextStatus))return res.status(400).json({message:'Invalid order status'});
    if(previous==='Cancelled'&&nextStatus!=='Cancelled')return res.status(400).json({message:'Cancelled orders cannot be reopened'});
    if(nextStatus==='Cancelled'&&previous!=='Cancelled'){
      await Product.bulkWrite(o.items.filter(i=>i.product).map(i=>({updateOne:{filter:{_id:i.product},update:{$inc:{stock:i.quantity}}}})));
      if(o.paymentMethod==='PAYLATER'){
        const user=await User.findById(o.user);
        if(user){user.payLater.used=Math.max((user.payLater.used||0)-o.total,0);if(user.payLater.used===0)user.payLater.dueDate=null;await user.save()}
      }
      if(o.paymentStatus==='Paid')o.paymentStatus='Refunded';
    }
    o.status=nextStatus;
    if(nextStatus==='Delivered'&&o.paymentMethod==='COD')o.paymentStatus='Paid';
    await o.save();
    res.json(o);
  }catch(e){next(e)}
}

export async function customers(req,res,next){try{res.setHeader('Cache-Control','no-store, private');res.json(await User.find({role:'customer'}).sort({createdAt:-1}).limit(1000))}catch(e){next(e)}}
export async function messages(req,res,next){try{res.json(await Message.find().sort({createdAt:-1}).limit(500))}catch(e){next(e)}}

export async function payLaterCustomers(req,res,next){
  try{
    const users=await User.find({role:'customer','payLater.status':{$ne:'not_requested'}}).sort({'payLater.updatedAt':-1,createdAt:-1}).lean();
    const ids=users.map(u=>u._id);
    const [orderDocs,actionDocs]=await Promise.all([
      Order.find({user:{$in:ids}}).select('user shippingAddress createdAt').sort({createdAt:-1}).lean(),
      RecoveryAction.find({customer:{$in:ids}}).populate('admin','name email').sort({createdAt:-1}).lean()
    ]);
    const addressByUser=new Map();
    for(const o of orderDocs){const key=String(o.user);if(!addressByUser.has(key)&&o.shippingAddress)addressByUser.set(key,o.shippingAddress)}
    const actionsByUser=new Map();
    for(const a of actionDocs){const key=String(a.customer);const list=actionsByUser.get(key)||[];if(list.length<12)list.push(a);actionsByUser.set(key,list)}
    res.setHeader('Cache-Control','no-store, private');
    res.json(users.map(u=>({...u,latestAddress:addressByUser.get(String(u._id))||null,recoveryHistory:actionsByUser.get(String(u._id))||[]})));
  }catch(e){next(e)}
}

export async function updatePayLater(req,res,next){
  try{
    const user=await User.findOne({_id:req.params.id,role:'customer'});
    if(!user)return res.status(404).json({message:'Customer not found'});
    const previousStatus=user.payLater.status;
    const previousLimit=user.payLater.limit||0;
    const allowedStatus=['pending','approved','blocked','suspended','banned'];
    const status=req.body.status||user.payLater.status;
    if(!allowedStatus.includes(status))return res.status(400).json({message:'Invalid PayLater status'});
    const limit=req.body.limit===undefined?previousLimit:Math.max(Number(req.body.limit)||0,0);
    if(limit>100000)return res.status(400).json({message:'PayLater limit cannot exceed ₹1,00,000'});
    if(limit<(user.payLater.used||0))return res.status(400).json({message:'Limit cannot be lower than current outstanding amount'});
    user.payLater.status=status;
    user.payLater.limit=limit;
    user.payLater.note=String(req.body.note ?? user.payLater.note ?? '').replace(/[<>\u0000-\u001F]/g,'').slice(0,1500);
    user.payLater.updatedAt=new Date();
    if(status==='approved'&&['suspended','banned','blocked'].includes(previousStatus))user.payLater.recoveryStatus='current';
    await user.save();
    const logs=[];
    if(previousLimit!==limit)logs.push(RecoveryAction.create({customer:user._id,admin:req.user._id,type:'limit_change',previousLimit,newLimit:limit,note:user.payLater.note||`Limit changed from ₹${previousLimit} to ₹${limit}`}));
    if(previousStatus!==status)logs.push(RecoveryAction.create({customer:user._id,admin:req.user._id,type:'status_change',note:user.payLater.note||`PayLater status changed from ${previousStatus} to ${status}`}));
    await Promise.all(logs);
    res.json(user);
  }catch(e){next(e)}
}

export async function recordPayLaterPayment(req,res,next){
  try{
    const user=await User.findOne({_id:req.params.id,role:'customer'});
    if(!user)return res.status(404).json({message:'Customer not found'});
    const amount=Math.max(Number(req.body.amount)||0,0);
    if(amount<=0)return res.status(400).json({message:'Enter a valid payment amount'});
    if(amount>(user.payLater.used||0))return res.status(400).json({message:'Payment exceeds outstanding amount'});
    user.payLater.used=money((user.payLater.used||0)-amount);
    if(user.payLater.used===0){user.payLater.dueDate=null;user.payLater.recoveryStatus='closed'}
    else user.payLater.recoveryStatus='current';
    user.payLater.lastRecoveryAt=new Date();
    user.payLater.updatedAt=new Date();
    await user.save();
    const note=String(req.body.note||'').replace(/[<>\u0000-\u001F]/g,'').slice(0,1000);
    await Promise.all([
      CashEntry.create({type:'income',amount,category:'PayLater Recovery',note:`Payment from ${user.name}`,createdBy:req.user._id}),
      RecoveryAction.create({customer:user._id,admin:req.user._id,type:'payment_received',amount,note:note||`Payment received. Remaining outstanding ₹${user.payLater.used}`,outcome:'completed'})
    ]);
    res.json({message:'Payment recorded',payLater:user.payLater});
  }catch(e){next(e)}
}

export async function recordRecoveryAction(req,res,next){
  try{
    const user=await User.findOne({_id:req.params.id,role:'customer'});
    if(!user)return res.status(404).json({message:'Customer not found'});
    const allowed=['call','message','email','home_visit','legal_review','promise_to_pay','dispute','note'];
    const type=req.body.type;
    if(!allowed.includes(type))return res.status(400).json({message:'Invalid recovery action'});
    const scheduledFor=req.body.scheduledFor?new Date(req.body.scheduledFor):null;
    if(scheduledFor&&Number.isNaN(scheduledFor.getTime()))return res.status(400).json({message:'Invalid follow-up date'});
    if(type==='home_visit'&&!scheduledFor)return res.status(400).json({message:'Schedule a date/time for the home visit'});
    const now=new Date();
    user.payLater.lastRecoveryAt=now;
    if(type==='home_visit'){user.payLater.recoveryStatus='home_visit_scheduled';user.payLater.nextFollowUpAt=scheduledFor}
    else if(type==='legal_review'){user.payLater.recoveryStatus='legal_review'}
    else if(type==='promise_to_pay'){user.payLater.recoveryStatus='promise_to_pay';user.payLater.nextFollowUpAt=scheduledFor||user.payLater.nextFollowUpAt}
    else if(type==='dispute'){user.payLater.recoveryStatus='disputed'}
    else user.payLater.recoveryStatus='contact_in_progress';
    await user.save();
    const note=String(req.body.note||'').replace(/[<>\u0000-\u001F]/g,'').slice(0,1500);
    const action=await RecoveryAction.create({customer:user._id,admin:req.user._id,type,note,scheduledFor:scheduledFor||undefined,outcome:String(req.body.outcome||'logged').slice(0,100)});
    res.status(201).json({message:type==='legal_review'?'Legal review request logged. No legal action is automatic.':'Recovery activity logged',action,payLater:user.payLater});
  }catch(e){next(e)}
}

export async function stock(req,res,next){try{res.json(await Product.find().sort({stock:1,name:1}))}catch(e){next(e)}}
export async function updateStock(req,res,next){
  try{
    const p=await Product.findById(req.params.id);if(!p)return res.status(404).json({message:'Product not found'});
    if(req.body.stock!==undefined)p.stock=Math.max(Number(req.body.stock)||0,0);
    if(req.body.lowStockThreshold!==undefined)p.lowStockThreshold=Math.max(Number(req.body.lowStockThreshold)||0,0);
    await p.save();res.json(p);
  }catch(e){next(e)}
}

export async function reports(req,res,next){
  try{
    const [orderDocs,posDocs,productDocs]=await Promise.all([
      Order.find({status:{$ne:'Cancelled'}}).sort({createdAt:1}),
      WalkInSale.find({paymentStatus:'Paid'}).sort({createdAt:1}),
      Product.find()
    ]);
    const onlineRevenue=money(orderDocs.reduce((s,o)=>s+(o.total||0),0));
    const posRevenue=money(posDocs.reduce((s,o)=>s+(o.total||0),0));
    const revenue=money(onlineRevenue+posRevenue);
    const grossProfit=money(profitFromOrders(orderDocs)+profitFromPos(posDocs));
    const salesByDay={};
    for(const o of orderDocs){const key=new Date(o.createdAt).toISOString().slice(0,10);salesByDay[key]=(salesByDay[key]||0)+(o.total||0)}
    for(const o of posDocs){const key=new Date(o.createdAt).toISOString().slice(0,10);salesByDay[key]=(salesByDay[key]||0)+(o.total||0)}
    const stockCost=money(productDocs.reduce((s,p)=>s+(p.costPrice||0)*(p.stock||0),0));
    const stockRetail=money(productDocs.reduce((s,p)=>s+(p.price||0)*(p.stock||0),0));
    const totalTransactions=orderDocs.length+posDocs.length;
    res.json({revenue,onlineRevenue,posRevenue,grossProfit,orders:orderDocs.length,posSales:posDocs.length,totalTransactions,averageOrder:totalTransactions?money(revenue/totalTransactions):0,stockCost,stockRetail,salesByDay:Object.entries(salesByDay).sort(([a],[b])=>a.localeCompare(b)).slice(-30).map(([date,total])=>({date,total:money(total)}))});
  }catch(e){next(e)}
}

export async function workers(req,res,next){try{res.json(await Worker.find().sort({createdAt:-1}))}catch(e){next(e)}}
export async function createWorker(req,res,next){try{res.status(201).json(await Worker.create(req.body))}catch(e){next(e)}}
export async function updateWorker(req,res,next){try{const w=await Worker.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});if(!w)return res.status(404).json({message:'Worker not found'});res.json(w)}catch(e){next(e)}}
export async function deleteWorker(req,res,next){try{const w=await Worker.findByIdAndDelete(req.params.id);if(!w)return res.status(404).json({message:'Worker not found'});res.json({message:'Worker deleted'})}catch(e){next(e)}}

export async function cashEntries(req,res,next){
  try{
    const entries=await CashEntry.find().populate('createdBy','name').sort({entryDate:-1,createdAt:-1}).limit(2000);
    const income=money(entries.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0));
    const expense=money(entries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0));
    res.setHeader('Cache-Control','no-store, private');
    res.json({entries,income,expense,balance:money(income-expense)});
  }catch(e){next(e)}
}
export async function createCashEntry(req,res,next){try{res.status(201).json(await CashEntry.create({...req.body,createdBy:req.user._id}))}catch(e){next(e)}}
export async function deleteCashEntry(req,res,next){try{const x=await CashEntry.findByIdAndDelete(req.params.id);if(!x)return res.status(404).json({message:'Entry not found'});res.json({message:'Entry deleted'})}catch(e){next(e)}}

export async function admins(req,res,next){try{res.setHeader('Cache-Control','no-store, private');res.json(await User.find({role:'admin'}).sort({createdAt:-1}))}catch(e){next(e)}}
export async function createAdmin(req,res,next){
  try{
    const name=String(req.body.name||'').trim().slice(0,100),email=String(req.body.email||'').trim().toLowerCase().slice(0,160),phone=String(req.body.phone||'').trim().slice(0,20),password=String(req.body.password||'');
    if(!name||!email||!password)return res.status(400).json({message:'Name, email and password are required'});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({message:'Enter a valid email address'});
    const exists=await User.findOne({email});if(exists)return res.status(409).json({message:'Email already exists'});
    const created=await User.create({name,email,phone,password,role:'admin'});
    res.status(201).json(safeAdminRecord(created));
  }catch(e){next(e)}
}
export async function updateAdmin(req,res,next){
  try{
    const a=await User.findOne({_id:req.params.id,role:'admin'});if(!a)return res.status(404).json({message:'Admin not found'});
    if(req.body.name!==undefined)a.name=String(req.body.name||'').trim().slice(0,100);
    if(req.body.phone!==undefined)a.phone=String(req.body.phone||'').trim().slice(0,20);
    if(req.body.isActive!==undefined){
      const nextActive=Boolean(req.body.isActive);
      if(!nextActive&&a.isActive){
        const activeAdmins=await User.countDocuments({role:'admin',isActive:true});
        if(activeAdmins<=1)return res.status(409).json({message:'The last active admin account cannot be disabled'});
      }
      if(a.isActive!==nextActive){a.isActive=nextActive;a.sessionVersion=Number(a.sessionVersion||0)+1;}
    }
    await a.save();res.json(safeAdminRecord(a));
  }catch(e){next(e)}
}

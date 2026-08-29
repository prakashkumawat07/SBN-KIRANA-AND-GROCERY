import PayLaterApplication from '../models/PayLaterApplication.js';
import User from '../models/User.js';
import RecoveryAction from '../models/RecoveryAction.js';

const allowedProofs=['AADHAAR','VOTER_ID','PAN'];
const allowedMime=['image/jpeg','image/png','application/pdf'];
const clean=v=>String(v||'').trim();

export async function myPayLaterApplication(req,res,next){
  try{
    const app=await PayLaterApplication.findOne({user:req.user._id}).select('-proof.data').lean();
    res.json(app||null);
  }catch(e){next(e)}
}

export async function submitPayLaterApplication(req,res,next){
  try{
    if(['approved','suspended','banned','blocked'].includes(req.user.payLater?.status))return res.status(400).json({message:'Your existing PayLater account must be handled through store support.'});
    const requestedLimit=Math.max(Number(req.body.requestedLimit)||0,0);
    if(requestedLimit<=0)return res.status(400).json({message:'Enter a valid requested limit'});
    const proof=req.body.proof||{};
    if(!allowedProofs.includes(proof.type))return res.status(400).json({message:'Choose Aadhaar, Voter ID or PAN'});
    const last4=clean(proof.last4).replace(/\D/g,'').slice(-4);
    if(last4.length!==4)return res.status(400).json({message:'Enter only the last 4 digits of the ID'});
    if(!allowedMime.includes(proof.mimeType))return res.status(400).json({message:'Upload a masked JPG, PNG or PDF proof'});
    const size=Math.max(Number(proof.size)||0,0);
    if(size<=0||size>900000)return res.status(400).json({message:'Masked ID proof must be under 900 KB'});
    const data=clean(proof.data);
    if(!data.startsWith('data:'))return res.status(400).json({message:'ID proof file is required'});
    if(req.body.consent!==true)return res.status(400).json({message:'Consent is required for manual PayLater verification'});
    const a=req.body.address||{};
    if(!clean(a.houseNo)||!clean(a.city)||!clean(a.pincode))return res.status(400).json({message:'House number, city and pincode are required'});
    const payload={
      user:req.user._id,requestedLimit,phone:clean(req.body.phone||req.user.phone),email:clean(req.body.email||req.user.email),
      address:{houseNo:clean(a.houseNo),landmark:clean(a.landmark),village:clean(a.village),city:clean(a.city),district:clean(a.district),state:clean(a.state)||'Rajasthan',pincode:clean(a.pincode),locality:clean(a.locality)},
      proof:{type:proof.type,last4,fileName:clean(proof.fileName),mimeType:proof.mimeType,size,data},consent:true,status:'submitted',
      idVerified:false,addressVerified:false,phoneVerified:false,verificationNote:'',reviewedBy:null,reviewedAt:null
    };
    const application=await PayLaterApplication.findOneAndUpdate({user:req.user._id},{$set:payload},{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true}).select('-proof.data');
    req.user.phone=payload.phone||req.user.phone;
    req.user.payLater={...(req.user.payLater?.toObject?.()||req.user.payLater||{}),status:'pending',requestedLimit,updatedAt:new Date()};
    await req.user.save();
    res.status(201).json({message:'PayLater KYC application submitted for manual verification',application});
  }catch(e){next(e)}
}

export async function adminPayLaterApplication(req,res,next){
  try{
    const app=await PayLaterApplication.findOne({user:req.params.id}).populate('user','name email phone payLater').populate('reviewedBy','name email').lean();
    if(!app)return res.status(404).json({message:'PayLater KYC application not found'});
    res.json(app);
  }catch(e){next(e)}
}

export async function adminVerifyPayLaterApplication(req,res,next){
  try{
    const app=await PayLaterApplication.findOne({user:req.params.id});
    if(!app)return res.status(404).json({message:'PayLater KYC application not found'});
    if(req.body.idVerified!==undefined)app.idVerified=Boolean(req.body.idVerified);
    if(req.body.addressVerified!==undefined)app.addressVerified=Boolean(req.body.addressVerified);
    if(req.body.phoneVerified!==undefined)app.phoneVerified=Boolean(req.body.phoneVerified);
    if(req.body.verificationNote!==undefined)app.verificationNote=clean(req.body.verificationNote).slice(0,1500);
    if(req.body.status&&['submitted','under_review','approved','rejected','needs_update'].includes(req.body.status))app.status=req.body.status;
    else app.status='under_review';
    app.reviewedBy=req.user._id;app.reviewedAt=new Date();
    await app.save();
    res.json(app);
  }catch(e){next(e)}
}

export async function adminDecidePayLaterApplication(req,res,next){
  try{
    const app=await PayLaterApplication.findOne({user:req.params.id});
    const user=await User.findOne({_id:req.params.id,role:'customer'});
    if(!app||!user)return res.status(404).json({message:'Customer PayLater application not found'});
    const decision=req.body.decision;
    if(!['approve','reject','needs_update'].includes(decision))return res.status(400).json({message:'Invalid decision'});
    if(decision==='approve'){
      if(!(app.idVerified&&app.addressVerified&&app.phoneVerified))return res.status(400).json({message:'Verify ID proof, address and phone before approval'});
      const limit=Math.max(Number(req.body.limit)||0,0);
      if(limit<=0)return res.status(400).json({message:'Set an approved PayLater limit'});
      user.payLater.status='approved';user.payLater.limit=limit;user.payLater.requestedLimit=app.requestedLimit;user.payLater.note=clean(req.body.note);user.payLater.updatedAt=new Date();
      app.status='approved';
    }else if(decision==='reject'){
      user.payLater.status='not_requested';user.payLater.limit=0;user.payLater.note=clean(req.body.note)||'PayLater application was not approved after manual review.';user.payLater.updatedAt=new Date();
      app.status='rejected';
    }else{
      user.payLater.status='pending';user.payLater.note=clean(req.body.note)||'Please update your PayLater verification details.';user.payLater.updatedAt=new Date();
      app.status='needs_update';
    }
    app.verificationNote=clean(req.body.note)||app.verificationNote;app.reviewedBy=req.user._id;app.reviewedAt=new Date();
    await Promise.all([user.save(),app.save(),RecoveryAction.create({customer:user._id,admin:req.user._id,type:'note',note:`PayLater KYC decision: ${decision}. ${clean(req.body.note)}`,outcome:'completed'})]);
    res.json({message:`PayLater application ${decision==='approve'?'approved':decision==='reject'?'rejected':'returned for update'}`,user,application:app});
  }catch(e){next(e)}
}

import PayLaterApplication from '../models/PayLaterApplication.js';
import User from '../models/User.js';
import RecoveryAction from '../models/RecoveryAction.js';
import {encryptSensitive,decryptSensitive} from '../utils/crypto.js';

const allowedProofs=['AADHAAR','VOTER_ID','PAN'];
const allowedMime=['image/jpeg','image/png','application/pdf'];
const clean=v=>String(v||'').trim();
const safeText=(v,max=160)=>clean(v).replace(/[<>\u0000-\u001F]/g,'').slice(0,max);

export async function myPayLaterApplication(req,res,next){
  try{
    const app=await PayLaterApplication.findOne({user:req.user._id}).lean();
    res.json(app||null);
  }catch(e){next(e)}
}

export async function submitPayLaterApplication(req,res,next){
  try{
    if(['approved','suspended','banned','blocked'].includes(req.user.payLater?.status))return res.status(400).json({message:'Your existing PayLater account must be handled through store support.'});
    const requestedLimit=Math.max(Number(req.body.requestedLimit)||0,0);
    if(requestedLimit<=0||requestedLimit>100000)return res.status(400).json({message:'Enter a valid requested limit up to ₹1,00,000'});
    const proof=req.body.proof||{};
    if(!allowedProofs.includes(proof.type))return res.status(400).json({message:'Choose Aadhaar, Voter ID or PAN'});
    const last4=clean(proof.last4).replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(-4);
    if(last4.length!==4)return res.status(400).json({message:'Enter only the last 4 characters of the ID'});
    if(!allowedMime.includes(proof.mimeType))return res.status(400).json({message:'Upload a masked JPG, PNG or PDF proof'});
    const size=Math.max(Number(proof.size)||0,0);
    if(size<=0||size>900000)return res.status(400).json({message:'Masked ID proof must be under 900 KB'});
    const data=clean(proof.data);
    const expectedPrefix=proof.mimeType==='application/pdf'?'data:application/pdf;base64,':proof.mimeType==='image/png'?'data:image/png;base64,':'data:image/jpeg;base64,';
    if(!data.startsWith(expectedPrefix))return res.status(400).json({message:'ID proof file content does not match the selected file type'});
    if(req.body.consent!==true)return res.status(400).json({message:'Consent is required for manual PayLater verification'});
    const a=req.body.address||{};
    const pincode=clean(a.pincode).replace(/\D/g,'').slice(0,6);
    if(!safeText(a.houseNo,100)||!safeText(a.city,100)||pincode.length!==6)return res.status(400).json({message:'House number, city and a valid 6-digit pincode are required'});
    const encrypted=encryptSensitive(data);
    const payload={
      user:req.user._id,requestedLimit,phone:safeText(req.body.phone||req.user.phone,20),email:safeText(req.body.email||req.user.email,160).toLowerCase(),
      address:{houseNo:safeText(a.houseNo,100),landmark:safeText(a.landmark,120),village:safeText(a.village,100),city:safeText(a.city,100),district:safeText(a.district,100),state:safeText(a.state,80)||'Rajasthan',pincode,locality:safeText(a.locality,120)},
      proof:{type:proof.type,last4,fileName:safeText(proof.fileName,180),mimeType:proof.mimeType,size,...encrypted},consent:true,status:'submitted',
      idVerified:false,addressVerified:false,phoneVerified:false,verificationNote:'',reviewedBy:null,reviewedAt:null
    };
    const application=await PayLaterApplication.findOneAndUpdate({user:req.user._id},{$set:payload},{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true});
    req.user.phone=payload.phone||req.user.phone;
    req.user.payLater={...(req.user.payLater?.toObject?.()||req.user.payLater||{}),status:'pending',requestedLimit,updatedAt:new Date()};
    await req.user.save();
    res.status(201).json({message:'PayLater KYC application submitted for manual verification',application});
  }catch(e){next(e)}
}

export async function adminPayLaterApplications(req,res,next){
  try{
    const apps=await PayLaterApplication.find().populate('user','name email phone payLater').populate('reviewedBy','name email').sort({updatedAt:-1}).lean();
    res.json(apps);
  }catch(e){next(e)}
}

export async function adminPayLaterApplication(req,res,next){
  try{
    const app=await PayLaterApplication.findOne({user:req.params.id}).select('+proof.encryptedData +proof.iv +proof.authTag').populate('user','name email phone payLater').populate('reviewedBy','name email').lean();
    if(!app)return res.status(404).json({message:'PayLater KYC application not found'});
    const encrypted={encryptedData:app.proof?.encryptedData,iv:app.proof?.iv,authTag:app.proof?.authTag};
    if(app.proof){app.proof.data=decryptSensitive(encrypted);delete app.proof.encryptedData;delete app.proof.iv;delete app.proof.authTag}
    res.setHeader('Cache-Control','no-store, private');
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
    if(req.body.verificationNote!==undefined)app.verificationNote=safeText(req.body.verificationNote,1500);
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
    const note=safeText(req.body.note,1500);
    if(decision==='approve'){
      if(!(app.idVerified&&app.addressVerified&&app.phoneVerified))return res.status(400).json({message:'Verify ID proof, address and phone before approval'});
      const limit=Math.max(Number(req.body.limit)||0,0);
      if(limit<=0||limit>100000)return res.status(400).json({message:'Set a valid approved PayLater limit up to ₹1,00,000'});
      user.payLater.status='approved';user.payLater.limit=limit;user.payLater.requestedLimit=app.requestedLimit;user.payLater.note=note;user.payLater.updatedAt=new Date();
      app.status='approved';
    }else if(decision==='reject'){
      user.payLater.status='not_requested';user.payLater.limit=0;user.payLater.note=note||'PayLater application was not approved after manual review.';user.payLater.updatedAt=new Date();
      app.status='rejected';
    }else{
      user.payLater.status='pending';user.payLater.note=note||'Please update your PayLater verification details.';user.payLater.updatedAt=new Date();
      app.status='needs_update';
    }
    app.verificationNote=note||app.verificationNote;app.reviewedBy=req.user._id;app.reviewedAt=new Date();
    await Promise.all([user.save(),app.save(),RecoveryAction.create({customer:user._id,admin:req.user._id,type:'note',note:`PayLater KYC decision: ${decision}. ${note}`,outcome:'completed'})]);
    res.json({message:`PayLater application ${decision==='approve'?'approved':decision==='reject'?'rejected':'returned for update'}`,user,application:app});
  }catch(e){next(e)}
}

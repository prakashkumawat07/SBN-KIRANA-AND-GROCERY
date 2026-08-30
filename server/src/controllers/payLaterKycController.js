import PayLaterApplication from '../models/PayLaterApplication.js';
import User from '../models/User.js';
import RecoveryAction from '../models/RecoveryAction.js';
import {encryptSensitive,decryptSensitive} from '../utils/crypto.js';
import {inspectDataUri} from '../utils/dataUri.js';

const allowedProofs=['AADHAAR','VOTER_ID','PAN'];
const allowedMime=['image/jpeg','image/png','application/pdf'];
const allowedRequirementTypes=['text','textarea','phone','email','document'];
const allowedDocumentTypes=['ANY','AADHAAR','VOTER_ID','PAN','ADDRESS_PROOF','BUSINESS_PROOF','OTHER'];
const clean=v=>String(v||'').trim();
const safeText=(v,max=160)=>clean(v).replace(/[<>\u0000-\u001F]/g,'').slice(0,max);

function validateUpload(file={},label='Document'){
  if(!allowedMime.includes(file.mimeType))throw Object.assign(new Error(`${label} must be JPG, PNG or PDF`),{status:400});
  const size=Math.max(Number(file.size)||0,0);
  if(size<=0||size>900000)throw Object.assign(new Error(`${label} must be under 900 KB`),{status:400});
  const data=clean(file.data);
  if(!inspectDataUri(data,{allowedMime,maxBytes:900000,declaredBytes:size}))throw Object.assign(new Error(`${label} content does not match the selected file type or size`),{status:400});
  return {size,data};
}

export async function myPayLaterApplication(req,res,next){
  try{
    const app=await PayLaterApplication.findOne({user:req.user._id}).lean();
    res.setHeader('Cache-Control','no-store, private');
    res.json(app||null);
  }catch(e){next(e)}
}

export async function submitPayLaterApplication(req,res,next){
  try{
    const existing=await PayLaterApplication.exists({user:req.user._id});
    if(existing)return res.status(409).json({message:'Your PayLater application has already been submitted. Any additional information will be requested separately by store management.'});
    if(['approved','suspended','banned','blocked'].includes(req.user.payLater?.status))return res.status(400).json({message:'Your existing PayLater account must be handled through store support.'});
    const requestedLimit=Math.max(Number(req.body.requestedLimit)||0,0);
    if(requestedLimit<=0||requestedLimit>100000)return res.status(400).json({message:'Enter a valid requested limit up to ₹1,00,000'});
    const proof=req.body.proof||{};
    if(!allowedProofs.includes(proof.type))return res.status(400).json({message:'Choose Aadhaar, Voter ID or PAN'});
    const last4=clean(proof.last4).replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(-4);
    if(last4.length!==4)return res.status(400).json({message:'Enter only the last 4 characters of the ID'});
    const {size,data}=validateUpload(proof,'Masked ID proof');
    if(req.body.consent!==true)return res.status(400).json({message:'Consent is required for manual PayLater verification'});
    const a=req.body.address||{};
    const pincode=clean(a.pincode).replace(/\D/g,'').slice(0,6);
    if(!safeText(a.houseNo,100)||!safeText(a.city,100)||pincode.length!==6)return res.status(400).json({message:'House number, city and a valid 6-digit pincode are required'});
    const encrypted=encryptSensitive(data);
    const payload={
      user:req.user._id,requestedLimit,phone:safeText(req.body.phone||req.user.phone,20),email:safeText(req.body.email||req.user.email,160).toLowerCase(),
      address:{houseNo:safeText(a.houseNo,100),landmark:safeText(a.landmark,120),village:safeText(a.village,100),city:safeText(a.city,100),district:safeText(a.district,100),state:safeText(a.state,80)||'Rajasthan',pincode,locality:safeText(a.locality,120)},
      proof:{type:proof.type,last4,fileName:safeText(proof.fileName,180),mimeType:proof.mimeType,size,...encrypted},consent:true,status:'submitted',requirements:[],
      idVerified:false,addressVerified:false,phoneVerified:false,verificationNote:'',reviewedBy:null,reviewedAt:null
    };
    const application=await PayLaterApplication.create(payload);
    req.user.phone=payload.phone||req.user.phone;
    req.user.payLater={...(req.user.payLater?.toObject?.()||req.user.payLater||{}),status:'pending',requestedLimit,updatedAt:new Date()};
    await req.user.save();
    res.status(201).json({message:'PayLater KYC application submitted for manual verification. The original form is now locked.',application});
  }catch(e){next(e)}
}

export async function submitPayLaterFollowUp(req,res,next){
  try{
    const app=await PayLaterApplication.findOne({user:req.user._id});
    if(!app)return res.status(404).json({message:'PayLater application not found'});
    const pending=app.requirements.filter(r=>r.status==='requested');
    if(!pending.length)return res.status(400).json({message:'There are no additional information requests waiting for you'});
    const answers=Array.isArray(req.body.answers)?req.body.answers:[];
    const answerMap=new Map(answers.map(a=>[String(a.id),a]));
    for(const requirement of pending){
      const answer=answerMap.get(String(requirement._id))||{};
      if(requirement.type==='document'){
        const file=answer.file||{};
        if(requirement.required&&!file.data)return res.status(400).json({message:`Upload ${requirement.label}`});
        if(file.data){
          const {size,data}=validateUpload(file,requirement.label);
          requirement.file={fileName:safeText(file.fileName,180),mimeType:file.mimeType,size,...encryptSensitive(data)};
        }
      }else{
        const value=safeText(answer.value,2000);
        if(requirement.required&&!value)return res.status(400).json({message:`Enter ${requirement.label}`});
        if(requirement.type==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))return res.status(400).json({message:`Enter a valid ${requirement.label}`});
        requirement.value=value;
      }
      requirement.status='submitted';
      requirement.submittedAt=new Date();
    }
    app.status='under_review';
    app.reviewedAt=null;
    await app.save();
    if(!['approved','suspended','banned','blocked'].includes(req.user.payLater?.status)){
      req.user.payLater.status='pending';req.user.payLater.updatedAt=new Date();await req.user.save();
    }
    res.json({message:'Requested information submitted. Store management will review it.',application:app});
  }catch(e){next(e)}
}

export async function adminPayLaterApplications(req,res,next){
  try{
    const apps=await PayLaterApplication.find().populate('user','name email phone payLater').populate('reviewedBy','name email').sort({updatedAt:-1}).lean();
    res.setHeader('Cache-Control','no-store, private');
    res.json(apps);
  }catch(e){next(e)}
}

export async function adminPayLaterApplication(req,res,next){
  try{
    const app=await PayLaterApplication.findOne({user:req.params.id}).select('+proof.encryptedData +proof.iv +proof.authTag +requirements.file.encryptedData +requirements.file.iv +requirements.file.authTag').populate('user','name email phone payLater').populate('reviewedBy','name email').lean();
    if(!app)return res.status(404).json({message:'PayLater KYC application not found'});
    const encrypted={encryptedData:app.proof?.encryptedData,iv:app.proof?.iv,authTag:app.proof?.authTag};
    if(app.proof){app.proof.data=decryptSensitive(encrypted);delete app.proof.encryptedData;delete app.proof.iv;delete app.proof.authTag}
    for(const r of app.requirements||[]){
      if(r.type==='document'&&r.file?.encryptedData){
        r.file.data=decryptSensitive(r.file);delete r.file.encryptedData;delete r.file.iv;delete r.file.authTag;
      }
    }
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

export async function adminRequestPayLaterRequirements(req,res,next){
  try{
    const app=await PayLaterApplication.findOne({user:req.params.id});
    const user=await User.findOne({_id:req.params.id,role:'customer'});
    if(!app||!user)return res.status(404).json({message:'Customer PayLater application not found'});
    if(app.status==='approved')return res.status(400).json({message:'Approved applications cannot be moved back into KYC follow-up. Use PayLater account management instead.'});
    const requested=Array.isArray(req.body.requirements)?req.body.requirements.slice(0,8):[];
    if(!requested.length)return res.status(400).json({message:'Select at least one additional information requirement'});
    const created=[];
    for(const row of requested){
      const label=safeText(row.label,140);const type=String(row.type||'text');
      if(!label||!allowedRequirementTypes.includes(type))return res.status(400).json({message:'Invalid additional information requirement'});
      const documentType=allowedDocumentTypes.includes(row.documentType)?row.documentType:'ANY';
      app.requirements.push({label,type,prompt:safeText(row.prompt,500),documentType,required:row.required!==false,status:'requested',requestedBy:req.user._id,requestedAt:new Date()});
      created.push(label);
    }
    app.status='needs_update';app.reviewedBy=req.user._id;app.reviewedAt=new Date();
    app.verificationNote=safeText(req.body.note||`Additional information requested: ${created.join(', ')}`,1500);
    user.payLater.status='pending';user.payLater.note=app.verificationNote;user.payLater.updatedAt=new Date();
    await Promise.all([app.save(),user.save(),RecoveryAction.create({customer:user._id,admin:req.user._id,type:'note',note:`PayLater follow-up requested: ${created.join(', ')}`,outcome:'logged'})]);
    res.json({message:'Additional information request sent to customer',application:app});
  }catch(e){next(e)}
}

export async function adminReviewPayLaterRequirement(req,res,next){
  try{
    const app=await PayLaterApplication.findOne({user:req.params.id});
    const user=await User.findOne({_id:req.params.id,role:'customer'});
    if(!app||!user)return res.status(404).json({message:'Customer PayLater application not found'});
    const requirement=app.requirements.id(req.params.requirementId);
    if(!requirement)return res.status(404).json({message:'Follow-up requirement not found'});
    const action=String(req.body.action||'');
    if(action==='accept'){
      if(requirement.status!=='submitted')return res.status(400).json({message:'Customer has not submitted this information yet'});
      requirement.status='accepted';requirement.reviewedAt=new Date();
      if(app.requirements.every(r=>r.status==='accepted'))app.status='under_review';
    }else if(action==='ask_again'){
      requirement.status='requested';requirement.value='';requirement.file={};requirement.submittedAt=null;requirement.reviewedAt=null;
      if(req.body.prompt!==undefined)requirement.prompt=safeText(req.body.prompt,500);
      app.status='needs_update';user.payLater.status='pending';user.payLater.updatedAt=new Date();await user.save();
    }else return res.status(400).json({message:'Choose accept or ask_again'});
    app.reviewedBy=req.user._id;app.reviewedAt=new Date();await app.save();
    res.json({message:action==='accept'?'Information accepted':'Customer asked to submit this information again',application:app});
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
      const incomplete=(app.requirements||[]).filter(r=>r.status!=='accepted');
      if(incomplete.length)return res.status(400).json({message:'Review and accept all requested additional information before approval'});
      const limit=Math.max(Number(req.body.limit)||0,0);
      if(limit<=0||limit>100000)return res.status(400).json({message:'Set a valid approved PayLater limit up to ₹1,00,000'});
      user.payLater.status='approved';user.payLater.limit=limit;user.payLater.requestedLimit=app.requestedLimit;user.payLater.note=note;user.payLater.updatedAt=new Date();
      app.status='approved';
    }else if(decision==='reject'){
      user.payLater.status='not_requested';user.payLater.limit=0;user.payLater.note=note||'PayLater application was not approved after manual review.';user.payLater.updatedAt=new Date();
      app.status='rejected';
    }else{
      const waiting=(app.requirements||[]).some(r=>r.status==='requested');
      if(!waiting)return res.status(400).json({message:'Use “Request more information” to specify exactly what the customer must submit.'});
      user.payLater.status='pending';user.payLater.note=note||'Additional information is required for PayLater verification.';user.payLater.updatedAt=new Date();
      app.status='needs_update';
    }
    app.verificationNote=note||app.verificationNote;app.reviewedBy=req.user._id;app.reviewedAt=new Date();
    await Promise.all([user.save(),app.save(),RecoveryAction.create({customer:user._id,admin:req.user._id,type:'note',note:`PayLater KYC decision: ${decision}. ${note}`,outcome:'completed'})]);
    res.json({message:`PayLater application ${decision==='approve'?'approved':decision==='reject'?'rejected':'returned for update'}`,user,application:app});
  }catch(e){next(e)}
}

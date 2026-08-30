import mongoose from 'mongoose';
import PayLaterPayment from '../models/PayLaterPayment.js';
import User from '../models/User.js';
import CashEntry from '../models/CashEntry.js';
import RecoveryAction from '../models/RecoveryAction.js';
import {encryptPaymentProof,decryptPaymentProof} from '../utils/paymentProofCrypto.js';
import {inspectDataUri} from '../utils/dataUri.js';

const methods=['ONLINE','UPI','BANK_TRANSFER','CASH_AT_STORE'];
const proofMime=['image/jpeg','image/png'];
const money=n=>Math.round((Number(n)||0)*100)/100;
const safe=(v,max=500)=>String(v||'').trim().replace(/[<>\u0000-\u001F]/g,'').slice(0,max);
function fail(message,status=400){const e=new Error(message);e.status=status;throw e}
function safePayment(doc){
  const p=doc?.toObject?doc.toObject():doc||{};
  if(p.proof){delete p.proof.encryptedData;delete p.proof.iv;delete p.proof.authTag;p.proof.hasProof=Boolean(p.proof.fileName)}
  return p;
}

export async function myPayLaterPayments(req,res,next){
  try{
    const docs=await PayLaterPayment.find({user:req.user._id}).populate('reviewedBy','name').sort({createdAt:-1}).limit(100).lean();
    res.setHeader('Cache-Control','no-store, private');
    res.json(docs.map(safePayment));
  }catch(e){next(e)}
}

export async function submitPayLaterPayment(req,res,next){
  try{
    const outstanding=money(req.user.payLater?.used||0);
    if(outstanding<=0)return res.status(400).json({message:'There is no PayLater outstanding to clear'});
    const amount=money(req.body.amount);
    if(amount<=0)return res.status(400).json({message:'Enter a valid payment amount'});
    const method=String(req.body.method||'').toUpperCase();
    if(!methods.includes(method))return res.status(400).json({message:'Choose a valid payment method'});
    const pending=await PayLaterPayment.aggregate([{$match:{user:req.user._id,status:'pending'}},{$group:{_id:null,total:{$sum:'$amount'}}}]).then(r=>money(r[0]?.total||0));
    const availableToSubmit=money(Math.max(outstanding-pending,0));
    if(amount>availableToSubmit)return res.status(409).json({message:`You already have payment requests under verification. You can submit up to ₹${availableToSubmit.toLocaleString('en-IN')} more.`});
    const reference=safe(req.body.reference,120);
    const note=safe(req.body.note,800);
    let proof={};
    if(method!=='CASH_AT_STORE'){
      if(!reference)return res.status(400).json({message:'Transaction / reference ID is required'});
      const incoming=req.body.proof||{};
      if(!proofMime.includes(incoming.mimeType))return res.status(400).json({message:'Upload payment screenshot as JPG or PNG'});
      const size=Math.max(Number(incoming.size)||0,0);
      if(size<=0||size>900000)return res.status(400).json({message:'Payment screenshot must be under 900 KB'});
      const data=String(incoming.data||'').trim();
      if(!inspectDataUri(data,{allowedMime:proofMime,maxBytes:900000,declaredBytes:size}))return res.status(400).json({message:'Payment screenshot content does not match the file type or size'});
      proof={fileName:safe(incoming.fileName,180),mimeType:incoming.mimeType,size,...encryptPaymentProof(data)};
    }
    const payment=await PayLaterPayment.create({user:req.user._id,amount,method,reference:method==='CASH_AT_STORE'?'':reference,note,proof,status:'pending',outstandingAtSubmit:outstanding});
    res.status(201).json({message:method==='CASH_AT_STORE'?'Cash-at-store payment request created. Outstanding will update after store staff confirms the cash receipt.':'Payment proof submitted. Outstanding will update after admin verification.',payment:safePayment(payment)});
  }catch(e){next(e)}
}

export async function adminPayLaterPayments(req,res,next){
  try{
    const docs=await PayLaterPayment.find().populate('user','name email phone payLater').populate('reviewedBy','name email').sort({createdAt:-1}).limit(500).lean();
    res.setHeader('Cache-Control','no-store, private');
    res.json(docs.map(safePayment));
  }catch(e){next(e)}
}

export async function adminPayLaterPaymentProof(req,res,next){
  try{
    const payment=await PayLaterPayment.findById(req.params.id).select('+proof.encryptedData +proof.iv +proof.authTag').lean();
    if(!payment)return res.status(404).json({message:'Payment request not found'});
    if(!payment.proof?.encryptedData)return res.status(404).json({message:'This payment method has no screenshot'});
    const data=decryptPaymentProof(payment.proof);
    res.setHeader('Cache-Control','no-store, private');
    res.json({fileName:payment.proof.fileName,mimeType:payment.proof.mimeType,size:payment.proof.size,data});
  }catch(e){next(e)}
}

export async function adminReviewPayLaterPayment(req,res,next){
  let session;
  try{
    const decision=String(req.body.decision||'').toLowerCase();
    if(!['verify','reject'].includes(decision))return res.status(400).json({message:'Choose verify or reject'});
    const adminNote=safe(req.body.note,1000);
    if(decision==='reject'){
      const payment=await PayLaterPayment.findOneAndUpdate({_id:req.params.id,status:'pending'},{$set:{status:'rejected',reviewedBy:req.user._id,reviewedAt:new Date(),adminNote:adminNote||'Payment proof could not be verified. Please contact the store or submit a new payment request.'}},{new:true}).populate('user','name email phone payLater').populate('reviewedBy','name email');
      if(!payment)return res.status(409).json({message:'Payment request was already reviewed or does not exist'});
      return res.json({message:'Payment request rejected. Outstanding was not changed.',payment:safePayment(payment)});
    }

    session=await mongoose.startSession();
    let paymentId;
    await session.withTransaction(async()=>{
      const payment=await PayLaterPayment.findOne({_id:req.params.id,status:'pending'}).session(session);
      if(!payment)fail('Payment request was already reviewed or does not exist',409);
      const user=await User.findOne({_id:payment.user,role:'customer'}).session(session);
      if(!user)fail('Customer not found',404);
      const outstanding=money(user.payLater?.used||0);
      if(payment.amount>outstanding)fail('Payment amount is now greater than the current outstanding. Reject this request and ask the customer to resubmit the correct amount.',409);
      const remaining=money(outstanding-payment.amount);
      user.payLater.used=remaining;
      user.payLater.lastRecoveryAt=new Date();
      user.payLater.updatedAt=new Date();
      if(remaining===0){user.payLater.dueDate=null;user.payLater.recoveryStatus='closed'}else user.payLater.recoveryStatus='current';
      await user.save({session});
      payment.status='verified';payment.reviewedBy=req.user._id;payment.reviewedAt=new Date();payment.adminNote=adminNote||'Payment verified by store management';payment.outstandingAfter=remaining;
      await payment.save({session});
      await CashEntry.create([{type:'income',amount:payment.amount,category:'PayLater Recovery',note:`Verified ${payment.method.replaceAll('_',' ')} payment from ${user.name}`,createdBy:req.user._id}],{session});
      await RecoveryAction.create([{customer:user._id,admin:req.user._id,type:'payment_received',amount:payment.amount,note:`Customer Pay Now request verified (${payment.method.replaceAll('_',' ')}). Remaining outstanding ₹${remaining}`,outcome:'completed'}],{session});
      paymentId=payment._id;
    },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'}});
    const verified=await PayLaterPayment.findById(paymentId).populate('user','name email phone payLater').populate('reviewedBy','name email').lean();
    res.json({message:verified?.outstandingAfter===0?'Payment verified. PayLater outstanding is fully cleared.':'Payment verified and PayLater outstanding updated.',payment:safePayment(verified)});
  }catch(e){next(e)}finally{if(session)await session.endSession().catch(()=>{})}
}

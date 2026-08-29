import PayLaterApplication from '../models/PayLaterApplication.js';

export async function getMyPayLater(req,res,next){
  try{
    const p=req.user.payLater||{};
    res.json({
      status:p.status||'not_requested',
      requestedLimit:p.requestedLimit||0,
      limit:p.limit||0,
      used:p.used||0,
      available:Math.max((p.limit||0)-(p.used||0),0),
      dueDate:p.dueDate||null,
      note:p.note||'',
      recoveryStatus:p.recoveryStatus||'current',
      nextFollowUpAt:p.nextFollowUpAt||null,
      lastRecoveryAt:p.lastRecoveryAt||null
    });
  }catch(e){next(e)}
}

export async function requestPayLater(req,res,next){
  try{
    const requestedLimit=Math.max(Number(req.body.requestedLimit)||0,0);
    if(requestedLimit<=0)return res.status(400).json({message:'Enter a valid requested limit'});
    if(req.user.payLater?.status==='approved')return res.status(400).json({message:'PayLater is already active on your account'});
    if(['suspended','banned','blocked'].includes(req.user.payLater?.status))return res.status(400).json({message:'PayLater access is currently restricted. Contact store support for review.'});
    const application=await PayLaterApplication.findOne({user:req.user._id});
    if(!application)return res.status(400).json({message:'Complete the PayLater KYC application before requesting store credit'});
    application.requestedLimit=requestedLimit;
    if(['rejected','needs_update'].includes(application.status))application.status='submitted';
    await application.save();
    req.user.payLater={
      ...(req.user.payLater?.toObject?.()||req.user.payLater||{}),
      status:'pending',requestedLimit,updatedAt:new Date()
    };
    await req.user.save();
    res.json({message:'PayLater request submitted for manual KYC review',payLater:req.user.payLater});
  }catch(e){next(e)}
}

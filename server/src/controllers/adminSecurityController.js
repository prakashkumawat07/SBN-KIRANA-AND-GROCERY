import User from '../models/User.js';
import AdminLoginEvent from '../models/AdminLoginEvent.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import {validatePassword,recordTwoFactorFailure,clearTwoFactorThrottle} from '../middleware/security.js';
import {signSessionToken,verifyTwoFactorChallenge} from '../utils/authToken.js';
import {
  generateAuthenticatorSecret,encryptTwoFactorSecret,decryptTwoFactorSecret,verifyAuthenticatorCode,authenticatorUri,
  generateRecoveryCodes,recoveryCodeHash,recoveryCodeIndex,ipOf,userAgentOf
} from '../utils/adminSecurity.js';

const sensitiveSelect='+password +twoFactor.secretEnc +twoFactor.pendingSecretEnc +twoFactor.recoveryCodeHashes';

async function audit(req,action,statusCode=200){
  try{await AdminAuditLog.create({admin:req.user?._id||req.body?._adminId,action,method:req.method,path:req.originalUrl?.split('?')[0]||'',statusCode,ip:ipOf(req),userAgent:userAgentOf(req)})}catch{}
}
async function loginEvent(req,user,outcome){
  try{await AdminLoginEvent.create({admin:user?._id||null,email:user?.email||'',outcome,ip:ipOf(req),userAgent:userAgentOf(req)})}catch{}
}
function safeAdmin(user){return {id:user._id,name:user.name,email:user.email,phone:user.phone,role:user.role,isActive:user.isActive,twoFactorEnabled:Boolean(user.twoFactor?.enabled)}}
function factorResult(user,code){
  const value=String(code||'').trim();
  if(/^\d{6}$/.test(value)&&user.twoFactor?.secretEnc){
    try{if(verifyAuthenticatorCode(decryptTwoFactorSecret(user.twoFactor.secretEnc),value))return {ok:true,recoveryIndex:-1}}catch{}
  }
  const index=recoveryCodeIndex(user.twoFactor?.recoveryCodeHashes||[],value);
  return {ok:index>=0,recoveryIndex:index};
}

export async function securityOverview(req,res,next){
  try{
    const user=await User.findById(req.user._id).select('+twoFactor.recoveryCodeHashes');
    const history=await AdminLoginEvent.find({admin:req.user._id}).sort({createdAt:-1}).limit(40).lean();
    res.setHeader('Cache-Control','no-store, private');
    res.json({
      twoFactor:{enabled:Boolean(user.twoFactor?.enabled),enabledAt:user.twoFactor?.enabledAt||null,recoveryCodesRemaining:user.twoFactor?.recoveryCodeHashes?.length||0},
      lastPasswordChangedAt:user.lastPasswordChangedAt||null,
      loginHistory:history
    });
  }catch(e){next(e)}
}

export async function setupTwoFactor(req,res,next){
  try{
    const user=await User.findById(req.user._id).select(sensitiveSelect);
    if(!user||user.role!=='admin')return res.status(403).json({message:'Admin access required'});
    if(user.twoFactor?.enabled)return res.status(409).json({message:'Two-factor authentication is already enabled'});
    const secret=generateAuthenticatorSecret();
    let encrypted;
    try{encrypted=encryptTwoFactorSecret(secret)}catch{return res.status(503).json({message:'ADMIN_2FA_ENCRYPTION_KEY is not configured on the API'})}
    user.twoFactor.pendingSecretEnc=encrypted;
    user.twoFactor.pendingExpiresAt=new Date(Date.now()+10*60*1000);
    await user.save();
    await audit(req,'2FA setup started');
    res.json({secret,otpauthUri:authenticatorUri(secret,user.email),expiresAt:user.twoFactor.pendingExpiresAt});
  }catch(e){next(e)}
}

export async function enableTwoFactor(req,res,next){
  try{
    const user=await User.findById(req.user._id).select(sensitiveSelect);
    if(!user||user.role!=='admin')return res.status(403).json({message:'Admin access required'});
    if(user.twoFactor?.enabled)return res.status(409).json({message:'Two-factor authentication is already enabled'});
    if(!user.twoFactor?.pendingSecretEnc||!user.twoFactor?.pendingExpiresAt||new Date(user.twoFactor.pendingExpiresAt)<new Date())return res.status(400).json({message:'Two-factor setup expired. Start setup again.'});
    let secret;
    try{secret=decryptTwoFactorSecret(user.twoFactor.pendingSecretEnc)}catch{return res.status(503).json({message:'Two-factor encryption key is unavailable'})}
    if(!verifyAuthenticatorCode(secret,req.body.code)){await recordTwoFactorFailure(req);return res.status(400).json({message:'Invalid authenticator code'})}
    const recoveryCodes=generateRecoveryCodes(8);
    user.twoFactor.enabled=true;
    user.twoFactor.secretEnc=user.twoFactor.pendingSecretEnc;
    user.twoFactor.pendingSecretEnc='';
    user.twoFactor.pendingExpiresAt=null;
    user.twoFactor.recoveryCodeHashes=recoveryCodes.map(recoveryCodeHash);
    user.twoFactor.enabledAt=new Date();
    user.sessionVersion=Number(user.sessionVersion||0)+1;
    await user.save();
    await clearTwoFactorThrottle(req);
    await audit(req,'2FA enabled');
    res.json({message:'Two-factor authentication enabled',token:signSessionToken(user),user:safeAdmin(user),recoveryCodes});
  }catch(e){next(e)}
}

export async function verifyAdminTwoFactorLogin(req,res,next){
  let user=null;
  try{
    const raw=String(req.body.challengeToken||'');
    const code=String(req.body.code||'');
    const payload=verifyTwoFactorChallenge(raw);
    user=await User.findById(payload.id).select(sensitiveSelect);
    if(!user||user.role!=='admin'||user.isActive===false||Number(payload.sv||0)!==Number(user.sessionVersion||0))return res.status(401).json({message:'Login verification expired. Sign in again.'});
    if(!user.twoFactor?.enabled)return res.status(400).json({message:'Two-factor authentication is not enabled'});
    const result=factorResult(user,code);
    if(!result.ok){await recordTwoFactorFailure(req);await loginEvent(req,user,'two_factor_failed');return res.status(401).json({message:'Invalid authenticator or recovery code'});}
    if(result.recoveryIndex>=0){user.twoFactor.recoveryCodeHashes.splice(result.recoveryIndex,1);await user.save()}
    await clearTwoFactorThrottle(req);
    await loginEvent(req,user,'success');
    res.json({user:safeAdmin(user),token:signSessionToken(user),recoveryCodeUsed:result.recoveryIndex>=0});
  }catch(e){
    await recordTwoFactorFailure(req);
    if(user)await loginEvent(req,user,'two_factor_failed');
    res.status(401).json({message:'Login verification expired or invalid'});
  }
}

export async function changePassword(req,res,next){
  try{
    const currentPassword=String(req.body.currentPassword||''),newPassword=String(req.body.newPassword||'');
    const error=validatePassword(newPassword);if(error)return res.status(400).json({message:error});
    const user=await User.findById(req.user._id).select(sensitiveSelect);
    if(!user||!(await user.comparePassword(currentPassword)))return res.status(401).json({message:'Current password is incorrect'});
    if(await user.comparePassword(newPassword))return res.status(400).json({message:'New password must be different from the current password'});
    user.password=newPassword;
    user.sessionVersion=Number(user.sessionVersion||0)+1;
    await user.save();
    await audit(req,'Admin password changed');
    res.json({message:'Password changed. Other sessions were signed out.',token:signSessionToken(user),user:safeAdmin(user)});
  }catch(e){next(e)}
}

export async function logoutAllDevices(req,res,next){
  try{
    const user=await User.findById(req.user._id);
    user.sessionVersion=Number(user.sessionVersion||0)+1;
    await user.save();
    await audit(req,'Logged out all devices');
    res.json({message:'All admin sessions have been invalidated'});
  }catch(e){next(e)}
}

export async function regenerateRecoveryCodes(req,res,next){
  try{
    const user=await User.findById(req.user._id).select(sensitiveSelect);
    if(!user?.twoFactor?.enabled)return res.status(400).json({message:'Enable two-factor authentication first'});
    if(!(await user.comparePassword(String(req.body.password||''))))return res.status(401).json({message:'Password is incorrect'});
    const result=factorResult(user,req.body.code);
    if(!result.ok)return res.status(401).json({message:'Invalid authenticator or recovery code'});
    const recoveryCodes=generateRecoveryCodes(8);
    user.twoFactor.recoveryCodeHashes=recoveryCodes.map(recoveryCodeHash);
    await user.save();
    await audit(req,'2FA recovery codes regenerated');
    res.json({message:'New recovery codes generated. Previous codes are invalid.',recoveryCodes});
  }catch(e){next(e)}
}

export async function disableTwoFactor(req,res,next){
  try{
    const user=await User.findById(req.user._id).select(sensitiveSelect);
    if(!user?.twoFactor?.enabled)return res.status(400).json({message:'Two-factor authentication is not enabled'});
    if(!(await user.comparePassword(String(req.body.password||''))))return res.status(401).json({message:'Password is incorrect'});
    const result=factorResult(user,req.body.code);
    if(!result.ok)return res.status(401).json({message:'Invalid authenticator or recovery code'});
    user.twoFactor.enabled=false;
    user.twoFactor.secretEnc='';user.twoFactor.pendingSecretEnc='';user.twoFactor.pendingExpiresAt=null;user.twoFactor.recoveryCodeHashes=[];user.twoFactor.enabledAt=null;
    user.sessionVersion=Number(user.sessionVersion||0)+1;
    await user.save();
    await audit(req,'2FA disabled');
    res.json({message:'Two-factor authentication disabled',token:signSessionToken(user),user:safeAdmin(user)});
  }catch(e){next(e)}
}

export async function adminAuditLogs(req,res,next){
  try{
    const logs=await AdminAuditLog.find().populate('admin','name email').sort({createdAt:-1}).limit(250).lean();
    res.setHeader('Cache-Control','no-store, private');
    res.json(logs);
  }catch(e){next(e)}
}

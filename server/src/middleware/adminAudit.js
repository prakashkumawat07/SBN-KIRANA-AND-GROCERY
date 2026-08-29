import AdminAuditLog from '../models/AdminAuditLog.js';
import {ipOf,userAgentOf} from '../utils/adminSecurity.js';

const writes=new Set(['POST','PUT','PATCH','DELETE']);

export function auditAdminWrites(req,res,next){
  if(!writes.has(req.method))return next();
  res.on('finish',()=>{
    if(!req.user?._id)return;
    const targetId=String(req.params?.id||req.params?.customerId||req.params?.productId||'').slice(0,120);
    const path=String(req.originalUrl||req.baseUrl||req.path||'').split('?')[0].slice(0,500);
    AdminAuditLog.create({
      admin:req.user._id,
      action:`${req.method} ${path}`,
      method:req.method,
      path,
      targetId,
      statusCode:res.statusCode,
      ip:ipOf(req),
      userAgent:userAgentOf(req)
    }).catch(()=>{});
  });
  next();
}

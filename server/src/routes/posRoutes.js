import {Router} from 'express';
import {protect,posOnly} from '../middleware/auth.js';
import {posSales,posSummary,createPosSale,updatePosPayment} from '../controllers/posController.js';

const r=Router();
r.use(protect,posOnly);
r.get('/session',(req,res)=>{res.setHeader('Cache-Control','no-store, private');res.json({user:{id:req.user._id,name:req.user.name,email:req.user.email,phone:req.user.phone||'',role:req.user.role}})});
r.get('/sales',posSales);
r.get('/summary',posSummary);
r.post('/sales',createPosSale);
r.patch('/sales/:id/payment',updatePosPayment);
export default r;

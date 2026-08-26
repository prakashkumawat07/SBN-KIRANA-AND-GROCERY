import {Router} from 'express';
import {activeOffers,validateCoupon} from '../controllers/marketingController.js';
const r=Router();
r.get('/',activeOffers);
r.post('/validate',validateCoupon);
export default r;

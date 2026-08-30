import {Router} from 'express';
import {activeOffers,validateCoupon} from '../controllers/marketingController.js';
import {couponThrottle} from '../middleware/security.js';
const r=Router();
r.get('/',activeOffers);
r.post('/validate',couponThrottle,validateCoupon);
export default r;

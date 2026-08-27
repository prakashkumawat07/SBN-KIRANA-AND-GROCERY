import {Router} from 'express';
import {protect} from '../middleware/auth.js';
import {productReviews,upsertReview} from '../controllers/reviewController.js';
const r=Router();
r.get('/:productId',productReviews);
r.post('/:productId',protect,upsertReview);
export default r;

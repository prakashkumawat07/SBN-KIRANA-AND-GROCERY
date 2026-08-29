import {Router} from 'express';
import {protect} from '../middleware/auth.js';
import {productReviews,reviewEligibility,reviewOpportunities,upsertReview} from '../controllers/reviewController.js';
const r=Router();
r.get('/opportunities',protect,reviewOpportunities);
r.get('/:productId/eligibility',protect,reviewEligibility);
r.get('/:productId',productReviews);
r.post('/:productId',protect,upsertReview);
export default r;

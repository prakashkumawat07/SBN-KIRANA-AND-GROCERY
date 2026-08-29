import {Router} from 'express';
import {protect} from '../middleware/auth.js';
import {createBulkOrder,myBulkOrders,bulkOrderDetail,customerDecision} from '../controllers/bulkOrderController.js';

const r=Router();
r.use(protect);
r.post('/',createBulkOrder);
r.get('/mine',myBulkOrders);
r.get('/:id',bulkOrderDetail);
r.patch('/:id/decision',customerDecision);
export default r;

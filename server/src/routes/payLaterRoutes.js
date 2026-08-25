import {Router} from 'express';
import {protect} from '../middleware/auth.js';
import {getMyPayLater,requestPayLater} from '../controllers/payLaterController.js';

const r=Router();
r.use(protect);
r.get('/',getMyPayLater);
r.post('/request',requestPayLater);
export default r;

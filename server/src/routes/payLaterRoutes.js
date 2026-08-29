import {Router} from 'express';
import {protect} from '../middleware/auth.js';
import {getMyPayLater,requestPayLater} from '../controllers/payLaterController.js';
import {myPayLaterApplication,submitPayLaterApplication} from '../controllers/payLaterKycController.js';

const r=Router();
r.use(protect);
r.get('/',getMyPayLater);
r.get('/application',myPayLaterApplication);
r.post('/application',submitPayLaterApplication);
r.post('/request',requestPayLater);
export default r;

import {Router} from 'express';
import {createMessage} from '../controllers/contactController.js';
import {contactThrottle} from '../middleware/security.js';

const r=Router();
r.post('/',contactThrottle,createMessage);
export default r;

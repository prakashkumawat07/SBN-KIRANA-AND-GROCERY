import {Router} from 'express';
import {register,login,me} from '../controllers/authController.js';
import {protect} from '../middleware/auth.js';
import {checkLoginThrottle,registrationThrottle} from '../middleware/security.js';

const r=Router();
r.post('/register',registrationThrottle,register);
r.post('/login',checkLoginThrottle,login);
r.get('/me',protect,me);
export default r;

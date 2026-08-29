import {Router} from 'express';
import {register,login,me} from '../controllers/authController.js';
import {
  securityOverview,setupTwoFactor,enableTwoFactor,verifyAdminTwoFactorLogin,changePassword,
  logoutAllDevices,regenerateRecoveryCodes,disableTwoFactor
} from '../controllers/adminSecurityController.js';
import {protect,adminOnly} from '../middleware/auth.js';
import {checkLoginThrottle,registrationThrottle,checkTwoFactorThrottle} from '../middleware/security.js';

const r=Router();
r.post('/register',registrationThrottle,register);
r.post('/login',checkLoginThrottle,login);
r.post('/2fa/verify-login',checkTwoFactorThrottle,verifyAdminTwoFactorLogin);
r.get('/me',protect,me);
r.get('/security',protect,adminOnly,securityOverview);
r.post('/2fa/setup',protect,adminOnly,setupTwoFactor);
r.post('/2fa/enable',protect,adminOnly,checkTwoFactorThrottle,enableTwoFactor);
r.post('/2fa/recovery-codes',protect,adminOnly,checkTwoFactorThrottle,regenerateRecoveryCodes);
r.post('/2fa/disable',protect,adminOnly,checkTwoFactorThrottle,disableTwoFactor);
r.post('/change-password',protect,adminOnly,changePassword);
r.post('/logout-all',protect,adminOnly,logoutAllDevices);
export default r;

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const issuer='sbn-kirana-api';
const sessionAudience='sbn-kirana-web';
const challengeAudience='sbn-kirana-admin-2fa';

function jwtSecret(){
  const value=process.env.JWT_SECRET||'';
  if(!value)throw new Error('JWT secret is not configured');
  return value;
}

export function signSessionToken(user){
  return jwt.sign({id:user._id,sv:Number(user.sessionVersion||0),jti:crypto.randomUUID()},jwtSecret(),{
    expiresIn:'24h',algorithm:'HS256',issuer,audience:sessionAudience
  });
}

export function verifySessionToken(raw){
  return jwt.verify(raw,jwtSecret(),{algorithms:['HS256'],issuer,audience:sessionAudience});
}

export function signTwoFactorChallenge(user){
  return jwt.sign({id:user._id,sv:Number(user.sessionVersion||0),purpose:'admin-2fa-login',jti:crypto.randomUUID()},jwtSecret(),{
    expiresIn:'5m',algorithm:'HS256',issuer,audience:challengeAudience
  });
}

export function verifyTwoFactorChallenge(raw){
  const payload=jwt.verify(raw,jwtSecret(),{algorithms:['HS256'],issuer,audience:challengeAudience});
  if(payload.purpose!=='admin-2fa-login')throw new Error('Invalid two-factor challenge');
  return payload;
}

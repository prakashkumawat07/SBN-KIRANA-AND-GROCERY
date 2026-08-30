import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const issuer='sbn-kirana-api';
const sessionAudience='sbn-kirana-web';
const challengeAudience='sbn-kirana-admin-2fa';

function jwtSecret(){
  const value=process.env.JWT_SECRET||'';
  if(!value)throw new Error('JWT secret is not configured');
  if(process.env.NODE_ENV==='production'&&value.length<32)throw new Error('JWT secret must contain at least 32 characters in production');
  return value;
}

export function signSessionToken(user){
  const expiresIn=user?.role==='admin'?'8h':user?.role==='pos'?'12h':'24h';
  return jwt.sign({id:user._id,sv:Number(user.sessionVersion||0),jti:crypto.randomUUID()},jwtSecret(),{
    expiresIn,algorithm:'HS256',issuer,audience:sessionAudience
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

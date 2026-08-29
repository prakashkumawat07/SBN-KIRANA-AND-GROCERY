import crypto from 'crypto';

const CONTEXT='sbn-kirana-kyc-v1';

function key(){
  const source=process.env.KYC_ENCRYPTION_KEY||process.env.JWT_SECRET||'';
  if(!source)throw new Error('KYC encryption secret is not configured');
  return crypto.createHash('sha256').update(`${CONTEXT}:${source}`).digest();
}

export function encryptSensitive(value){
  const text=String(value||'');
  if(!text)return {encryptedData:'',iv:'',authTag:''};
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);
  const encrypted=Buffer.concat([cipher.update(text,'utf8'),cipher.final()]);
  return {encryptedData:encrypted.toString('base64'),iv:iv.toString('base64'),authTag:cipher.getAuthTag().toString('base64')};
}

export function decryptSensitive(payload={}){
  if(!payload.encryptedData)return '';
  const decipher=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(payload.iv,'base64'));
  decipher.setAuthTag(Buffer.from(payload.authTag,'base64'));
  return Buffer.concat([decipher.update(Buffer.from(payload.encryptedData,'base64')),decipher.final()]).toString('utf8');
}

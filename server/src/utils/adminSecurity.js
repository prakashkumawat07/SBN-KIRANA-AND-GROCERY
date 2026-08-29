import crypto from 'crypto';

const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function encryptionKey(){
  const value=process.env.ADMIN_2FA_ENCRYPTION_KEY||'';
  if(value.length<32)throw new Error('ADMIN_2FA_ENCRYPTION_KEY must be configured with at least 32 characters');
  return crypto.createHash('sha256').update(value).digest();
}

export function encryptTwoFactorSecret(value){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',encryptionKey(),iv);
  const encrypted=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptTwoFactorSecret(value){
  const [ivText,tagText,dataText]=String(value||'').split('.');
  if(!ivText||!tagText||!dataText)throw new Error('Invalid encrypted two-factor secret');
  const decipher=crypto.createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(ivText,'base64url'));
  decipher.setAuthTag(Buffer.from(tagText,'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataText,'base64url')),decipher.final()]).toString('utf8');
}

function base32Encode(buffer){
  let bits=0,value=0,out='';
  for(const byte of buffer){
    value=(value<<8)|byte;bits+=8;
    while(bits>=5){out+=ALPHABET[(value>>>(bits-5))&31];bits-=5}
  }
  if(bits>0)out+=ALPHABET[(value<<(5-bits))&31];
  return out;
}

function base32Decode(text){
  const clean=String(text||'').toUpperCase().replace(/[^A-Z2-7]/g,'');
  let bits=0,value=0;const bytes=[];
  for(const char of clean){
    const idx=ALPHABET.indexOf(char);if(idx<0)continue;
    value=(value<<5)|idx;bits+=5;
    if(bits>=8){bytes.push((value>>>(bits-8))&255);bits-=8}
  }
  return Buffer.from(bytes);
}

function totpAt(secret,counter){
  const counterBuffer=Buffer.alloc(8);counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest=crypto.createHmac('sha1',base32Decode(secret)).update(counterBuffer).digest();
  const offset=digest[digest.length-1]&15;
  const binary=((digest[offset]&127)<<24)|((digest[offset+1]&255)<<16)|((digest[offset+2]&255)<<8)|(digest[offset+3]&255);
  return String(binary%1000000).padStart(6,'0');
}

export function generateAuthenticatorSecret(){return base32Encode(crypto.randomBytes(20))}

export function verifyAuthenticatorCode(secret,code,window=1){
  const candidate=String(code||'').replace(/\s/g,'');
  if(!/^\d{6}$/.test(candidate))return false;
  const counter=Math.floor(Date.now()/30000);
  for(let offset=-window;offset<=window;offset++){
    const expected=totpAt(secret,counter+offset);
    if(crypto.timingSafeEqual(Buffer.from(candidate),Buffer.from(expected)))return true;
  }
  return false;
}

export function authenticatorUri(secret,email){
  const issuer='SBN Kirana Admin';
  const label=`${issuer}:${String(email||'admin').toLowerCase()}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function generateRecoveryCodes(count=8){
  return Array.from({length:count},()=>{
    const raw=crypto.randomBytes(5).toString('hex').toUpperCase();
    return `${raw.slice(0,5)}-${raw.slice(5)}`;
  });
}

export function recoveryCodeHash(code){
  const normalized=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function recoveryCodeIndex(hashes,code){
  const target=recoveryCodeHash(code);
  return (hashes||[]).findIndex(hash=>{
    const a=Buffer.from(String(hash||''));const b=Buffer.from(target);
    return a.length===b.length&&crypto.timingSafeEqual(a,b);
  });
}

export function ipOf(req){return String(req.headers['x-forwarded-for']||req.ip||req.socket?.remoteAddress||'unknown').split(',')[0].trim().slice(0,80)}
export function userAgentOf(req){return String(req.headers['user-agent']||'Unknown device').slice(0,400)}

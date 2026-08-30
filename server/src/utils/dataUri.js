const BASE64=/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function hasExpectedSignature(buffer,mimeType){
  if(mimeType==='image/jpeg')return buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff;
  if(mimeType==='image/png')return buffer.length>=8&&buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if(mimeType==='image/webp')return buffer.length>=12&&buffer.subarray(0,4).toString('ascii')==='RIFF'&&buffer.subarray(8,12).toString('ascii')==='WEBP';
  if(mimeType==='application/pdf')return buffer.length>=5&&buffer.subarray(0,5).toString('ascii')==='%PDF-';
  if(mimeType==='text/plain'||mimeType==='text/csv')return !buffer.includes(0);
  return false;
}

export function inspectDataUri(value,{allowedMime,maxBytes,declaredBytes}={}){
  const text=String(value||'').trim();
  const match=/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/.exec(text);
  if(!match)return null;
  const mimeType=match[1].toLowerCase();
  const encoded=match[2];
  if(allowedMime&&!allowedMime.includes(mimeType))return null;
  if(!BASE64.test(encoded))return null;
  const buffer=Buffer.from(encoded,'base64');
  if(!buffer.length||buffer.toString('base64').replace(/=+$/,'')!==encoded.replace(/=+$/,''))return null;
  if(maxBytes&&buffer.length>maxBytes)return null;
  if(declaredBytes!==undefined&&Number(declaredBytes)!==buffer.length)return null;
  if(!hasExpectedSignature(buffer,mimeType))return null;
  return {mimeType,bytes:buffer.length};
}

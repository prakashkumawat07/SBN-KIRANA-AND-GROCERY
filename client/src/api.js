const DEV_API_URL=import.meta.env.VITE_API_URL||'http://localhost:5000/api';

function productionGateway(path){
  const [pathname,...rest]=String(path||'').split('?');
  const params=new URLSearchParams(rest.join('?'));
  params.set('__route',pathname.startsWith('/')?pathname:`/${pathname}`);
  return `/service/health?${params.toString()}`;
}

function isAuthAttempt(path){
  const pathname=String(path||'').split('?')[0];
  return pathname==='/auth/login'||pathname==='/auth/register';
}

export async function api(path,options={}){
  const token=localStorage.getItem('sbn_token');
  const sendToken=token&&!isAuthAttempt(path);
  const headers={
    ...(sendToken?{Authorization:`Bearer ${token}`}:{}) ,
    ...(options.body?{'Content-Type':'application/json'}:{}),
    ...(options.headers||{})
  };
  const target=import.meta.env.PROD?productionGateway(path):`${DEV_API_URL}${path}`;
  const res=await fetch(target,{...options,headers});
  const contentType=res.headers.get('content-type')||'';
  if(!contentType.includes('application/json'))throw new TypeError('Live API unavailable');
  const data=await res.json().catch(()=>({}));
  if(!res.ok){
    if(res.status===401&&token&&!isAuthAttempt(path)){
      localStorage.removeItem('sbn_token');
      localStorage.removeItem('sbn_user');
      if(typeof window!=='undefined')setTimeout(()=>window.location.reload(),0);
      throw new Error('Session expired. Please sign in again.');
    }
    throw new Error(data.message||'Something went wrong');
  }
  return data;
}

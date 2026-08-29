const DEV_API=import.meta.env.VITE_API_URL||'http://localhost:5000/api';

function urlFor(path){
  if(!import.meta.env.PROD)return `${DEV_API}${path}`;
  const [pathname,...rest]=String(path||'').split('?');
  const params=new URLSearchParams(rest.join('?'));
  params.set('__route',pathname.startsWith('/')?pathname:`/${pathname}`);
  return `/service/health?${params.toString()}`;
}

export async function posApi(path,options={}){
  const token=localStorage.getItem('sbn_pos_token');
  const res=await fetch(urlFor(path),{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...(options.headers||{})}});
  const type=res.headers.get('content-type')||'';
  if(!type.includes('application/json'))throw new Error('POS service is temporarily unavailable');
  const data=await res.json().catch(()=>({}));
  if(!res.ok){if(res.status===401)localStorage.removeItem('sbn_pos_token');throw new Error(data.message||'Request failed')}
  return data;
}

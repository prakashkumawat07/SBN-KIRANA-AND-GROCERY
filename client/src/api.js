const DEV_API_URL=import.meta.env.VITE_API_URL||'http://localhost:5000/api';

function productionGateway(path){
  const [pathname,...rest]=String(path||'').split('?');
  const params=new URLSearchParams(rest.join('?'));
  params.set('__route',pathname.startsWith('/')?pathname:`/${pathname}`);
  return `/service/health?${params.toString()}`;
}

export async function api(path,options={}){
  const token=localStorage.getItem('sbn_token');
  const headers={
    ...(token?{Authorization:`Bearer ${token}`}:{}) ,
    ...(options.body?{'Content-Type':'application/json'}:{}),
    ...(options.headers||{})
  };
  const target=import.meta.env.PROD?productionGateway(path):`${DEV_API_URL}${path}`;
  const res=await fetch(target,{...options,headers});
  const contentType=res.headers.get('content-type')||'';
  if(!contentType.includes('application/json'))throw new TypeError('Live API unavailable');
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.message||'Something went wrong');
  return data;
}

const API_URL=import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_URL||'http://localhost:5000/api');

export async function api(path,options={}){
  const token=localStorage.getItem('sbn_token');
  const headers={
    ...(token?{Authorization:`Bearer ${token}`}:{}) ,
    ...(options.body?{'Content-Type':'application/json'}:{}),
    ...(options.headers||{})
  };
  const res=await fetch(`${API_URL}${path}`,{
    ...options,
    headers
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.message||'Something went wrong');
  return data;
}

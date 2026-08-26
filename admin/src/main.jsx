import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import {AdminAuthProvider} from './context/AdminAuthContext';
import './styles.css';
import './brand.css';

const nativeFetch=window.fetch.bind(window);

function gatewayTarget(url){
  if(typeof url!=='string'||!url.startsWith('/service/')||url.startsWith('/service/health'))return url;
  const relative=url.slice('/service'.length);
  const [pathname,...rest]=relative.split('?');
  const params=new URLSearchParams(rest.join('?'));
  params.set('__route',pathname.startsWith('/')?pathname:`/${pathname}`);
  return `/service/health?${params.toString()}`;
}

window.fetch=async(input,init)=>{
  const originalUrl=typeof input==='string'?input:(input?.url||'');
  const target=typeof input==='string'?gatewayTarget(input):input;
  const response=await nativeFetch(target,init);
  if(originalUrl.includes('/api')||originalUrl.includes('/service')){
    const contentType=response.headers.get('content-type')||'';
    const redirectedToVercelAuth=response.redirected&&response.url.includes('vercel.com');
    if(redirectedToVercelAuth||!contentType.includes('application/json')){
      throw new TypeError('Failed to fetch');
    }
  }
  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><AdminAuthProvider><App/></AdminAuthProvider></BrowserRouter></React.StrictMode>
);

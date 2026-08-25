import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import {AdminAuthProvider} from './context/AdminAuthContext';
import './styles.css';
import './brand.css';

const nativeFetch=window.fetch.bind(window);
window.fetch=async(input,init)=>{
  const url=typeof input==='string'?input:(input?.url||'');
  const response=await nativeFetch(input,init);
  if(url.includes('/api')){
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

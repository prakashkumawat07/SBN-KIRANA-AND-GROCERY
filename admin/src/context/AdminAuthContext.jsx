import {createContext,useContext,useState} from 'react';
import {adminApi} from '../api';
const C=createContext();
export const useAdminAuth=()=>useContext(C);

function initialAdmin(){
  if(import.meta.env.PROD&&localStorage.getItem('sbn_admin_token')==='sbn-demo-admin-token'){
    localStorage.removeItem('sbn_admin_token');
    localStorage.removeItem('sbn_admin');
    return null;
  }
  try{return JSON.parse(localStorage.getItem('sbn_admin')||'null')}catch{return null}
}

export function AdminAuthProvider({children}){
  const [admin,setAdmin]=useState(initialAdmin);
  function saveSession(data){
    if(!data?.token||!data?.user)throw new Error('Invalid admin session response');
    if(data.user.role!=='admin')throw new Error('Admin access only');
    localStorage.setItem('sbn_admin_token',data.token);
    localStorage.setItem('sbn_admin',JSON.stringify(data.user));
    setAdmin(data.user);
  }
  async function login(email,password){
    const data=await adminApi('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
    if(data.requiresTwoFactor)return data;
    saveSession(data);
    return {requiresTwoFactor:false};
  }
  async function verifyTwoFactor(challengeToken,code){
    const data=await adminApi('/auth/2fa/verify-login',{method:'POST',body:JSON.stringify({challengeToken,code})});
    saveSession(data);
    return data;
  }
  function updateSession(data){saveSession(data)}
  function logout(){localStorage.removeItem('sbn_admin_token');localStorage.removeItem('sbn_admin');setAdmin(null)}
  return <C.Provider value={{admin,login,verifyTwoFactor,updateSession,logout}}>{children}</C.Provider>
}

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
  async function login(email,password){
    const d=await adminApi('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
    if(d.user.role!=='admin')throw new Error('Admin access only');
    localStorage.setItem('sbn_admin_token',d.token);
    localStorage.setItem('sbn_admin',JSON.stringify(d.user));
    setAdmin(d.user);
  }
  function logout(){localStorage.removeItem('sbn_admin_token');localStorage.removeItem('sbn_admin');setAdmin(null)}
  return <C.Provider value={{admin,login,logout}}>{children}</C.Provider>
}

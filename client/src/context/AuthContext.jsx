import {createContext,useContext,useEffect,useState} from 'react';import {api} from '../api';
const AuthContext=createContext();export const useAuth=()=>useContext(AuthContext);
export function AuthProvider({children}){
  const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem('sbn_user')||'null'));
  useEffect(()=>{if(user)localStorage.setItem('sbn_user',JSON.stringify(user));else localStorage.removeItem('sbn_user')},[user]);
  useEffect(()=>{if(localStorage.getItem('sbn_token'))api('/auth/me').then(d=>d?.user&&setUser(d.user)).catch(()=>{})},[]);
  const authenticate=async(path,payload)=>{const data=await api(path,{method:'POST',body:JSON.stringify(payload)});localStorage.setItem('sbn_token',data.token);setUser(data.user);return data.user};
  const login=(email,password)=>authenticate('/auth/login',{email,password});const register=(payload)=>authenticate('/auth/register',payload);const logout=()=>{localStorage.removeItem('sbn_token');setUser(null)};
  return <AuthContext.Provider value={{user,login,register,logout}}>{children}</AuthContext.Provider>
}

import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAdminAuth} from '../context/AdminAuthContext';

export default function Login(){
  const [form,setForm]=useState({email:'',password:''});
  const [challenge,setChallenge]=useState(null);
  const [code,setCode]=useState('');
  const [err,setErr]=useState('');
  const [busy,setBusy]=useState(false);
  const {login,verifyTwoFactor}=useAdminAuth();const nav=useNavigate();
  async function submit(e){e.preventDefault();setErr('');setBusy(true);try{const result=await login(form.email,form.password);if(result?.requiresTwoFactor){setChallenge(result);setCode('');return}nav('/')}catch(e){setErr(e.message)}finally{setBusy(false)}}
  async function verify(e){e.preventDefault();setErr('');setBusy(true);try{await verifyTwoFactor(challenge.challengeToken,code);nav('/')}catch(e){setErr(e.message)}finally{setBusy(false)}}
  return <div className="admin-login"><form onSubmit={challenge?verify:submit}><img className="admin-login-logo" src="/sbn-kirana-logo.svg" alt="SBN KIRANA"/><small>SECURE ADMIN PORTAL</small>{challenge?<><h1>Two-factor verification</h1><p>Enter the 6-digit code from your Authenticator app. A one-time recovery code also works.</p>{challenge.admin?.email&&<div className="admin-login-security-email">🔐 {challenge.admin.email}</div>}</>:<><h1>Welcome back</h1><p>Sign in to manage your digital grocery store.</p></>}{err&&<div className="admin-alert">{err}</div>}{challenge?<><label>Authenticator / Recovery code<input autoFocus autoComplete="one-time-code" required value={code} onChange={e=>setCode(e.target.value)} placeholder="123456 or XXXXX-XXXXX"/></label><button disabled={busy}>{busy?'Verifying...':'Verify & Enter Dashboard →'}</button><button type="button" className="login-secondary" onClick={()=>{setChallenge(null);setCode('');setErr('')}}>← Use a different account</button></>:<><label>Admin email<input type="email" autoComplete="username" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Password<input type="password" autoComplete="current-password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><button disabled={busy}>{busy?'Checking...':'Enter Dashboard →'}</button></>}</form></div>
}

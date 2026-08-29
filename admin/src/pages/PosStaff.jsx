import {useEffect,useState} from 'react';
import {adminApi} from '../api';
import '../pos-staff.css';

const blank={name:'',email:'',password:''};
export default function PosStaff(){
  const [users,setUsers]=useState([]),[form,setForm]=useState(blank),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  async function load(){try{setUsers(await adminApi('/admin/pos-users'))}catch(e){setError(e.message)}}
  useEffect(()=>{load()},[]);
  async function create(e){e.preventDefault();setBusy(true);setError('');setMessage('');try{await adminApi('/admin/pos-users',{method:'POST',body:JSON.stringify(form)});setForm(blank);setMessage('POS staff login created');await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
  async function toggle(user){setError('');try{await adminApi(`/admin/pos-users/${user._id}`,{method:'PATCH',body:JSON.stringify({isActive:!user.isActive})});await load()}catch(e){setError(e.message)}}
  async function signout(user){if(!confirm(`Sign out ${user.name} from all POS devices?`))return;setError('');try{await adminApi(`/admin/pos-users/${user._id}/signout`,{method:'POST',body:'{}'});setMessage(`${user.name} signed out from all POS devices`);await load()}catch(e){setError(e.message)}}
  async function resetPassword(user){const password=prompt(`Enter a new strong password for ${user.name}`);if(!password)return;setError('');try{await adminApi(`/admin/pos-users/${user._id}/password`,{method:'POST',body:JSON.stringify({password})});setMessage(`Password changed for ${user.name}. Previous POS sessions were signed out.`)}catch(e){setError(e.message)}}

  const activeCount=users.filter(u=>u.isActive).length;
  return <div className="pos-staff-page">
    <div className="admin-title pos-staff-title"><div><small>ACCESS CONTROL</small><h1>POS Staff</h1><p>Create restricted cashier logins for the separate POS Billing portal.</p></div><span className="pos-active-count">{activeCount} active</span></div>
    {error&&<div className="admin-alert">{error}</div>}
    {message&&<div className="admin-note">{message}</div>}

    <div className="pos-staff-grid">
      <form className="panel pos-create-card" onSubmit={create}>
        <div className="pos-card-head"><div><small>NEW CASHIER ACCESS</small><h2>Create POS login</h2><p>Billing-only credentials for store counter staff.</p></div><span>POS ONLY</span></div>

        <div className="pos-form-stack">
          <label className="pos-field"><span>Staff name</span><input required autoComplete="name" placeholder="Enter staff name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label className="pos-field"><span>Email / Login ID</span><input type="email" required autoComplete="username" placeholder="staff@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
          <label className="pos-field"><span>Temporary password</span><input type="password" required minLength="10" autoComplete="new-password" placeholder="Minimum 10 characters" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><small>Use a unique strong password. The staff member can be signed out from all POS devices at any time.</small></label>
        </div>

        <div className="pos-permission-note"><b>Restricted access</b><span>This login cannot access Products, Customers, PayLater, Security Center or Admin Management.</span></div>
        <button className="pos-create-button" disabled={busy}>{busy?'Creating POS Login...':'Create POS Staff Login'}</button>
      </form>

      <section className="panel pos-accounts-card">
        <div className="pos-card-head"><div><small>ACCESS ACCOUNTS</small><h2>POS staff accounts</h2><p>Connected to the same inventory and sales database.</p></div><span>{users.length} TOTAL</span></div>
        <div className="pos-account-list">
          {users.map(u=><article className="pos-account-item" key={u._id}>
            <div className="pos-account-avatar">{String(u.name||'P').charAt(0).toUpperCase()}</div>
            <div className="pos-account-info"><div className="pos-account-name"><b>{u.name}</b><span className={u.isActive?'pos-status active':'pos-status disabled'}>{u.isActive?'ACTIVE':'DISABLED'}</span></div><small>{u.email}</small><p>Billing-only POS access</p></div>
            <div className="pos-account-actions">
              <button type="button" className="pos-action secondary" onClick={()=>resetPassword(u)}>🔑 Change Password</button>
              <button type="button" className="pos-action neutral" onClick={()=>signout(u)}>↪ Logout All Devices</button>
              <button type="button" className={u.isActive?'pos-action danger':'pos-action success'} onClick={()=>toggle(u)}>{u.isActive?'⛔ Disable':'✓ Enable'}</button>
            </div>
          </article>)}
          {!users.length&&<div className="pos-empty-state"><span>👤</span><b>No POS staff accounts yet</b><p>Create the first billing-only login using the form.</p></div>}
        </div>
      </section>
    </div>
  </div>;
}

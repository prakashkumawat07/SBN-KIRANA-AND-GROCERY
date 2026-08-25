import {useEffect,useState} from 'react';
import {api} from '../api';

export default function PayLater(){
  const [data,setData]=useState(null);const [amount,setAmount]=useState(3000);const [msg,setMsg]=useState('');const [error,setError]=useState('');
  const load=()=>api('/paylater').then(setData).catch(e=>setError(e.message));
  useEffect(()=>{load()},[]);
  async function request(e){e.preventDefault();setError('');setMsg('');try{const r=await api('/paylater/request',{method:'POST',body:JSON.stringify({requestedLimit:Number(amount)})});setMsg(r.message);load()}catch(e){setError(e.message)}}
  if(!data)return <main className="section"><div className="loading">Loading PayLater...</div></main>;
  const pct=data.limit?Math.min((data.used/data.limit)*100,100):0;
  return <main className="paylater-page">
    <section className="credit-hero"><div><span className="credit-chip">SBN PAYLATER</span><h1>Shop today.<br/>Pay from your store credit later.</h1><p>A simple SBN Kirana store-credit facility. Every request and limit change is reviewed manually by store management.</p></div><div className="credit-card"><small>AVAILABLE CREDIT</small><strong>₹{data.available.toLocaleString()}</strong><div className="credit-meter"><i style={{width:`${pct}%`}}></i></div><span>Used ₹{data.used.toLocaleString()} of ₹{data.limit.toLocaleString()}</span></div></section>
    <section className="credit-grid">
      <div className="credit-panel"><h2>Account status</h2><div className={`credit-status ${data.status}`}>{data.status.replace('_',' ').toUpperCase()}</div><p>Requested limit: <b>₹{data.requestedLimit.toLocaleString()}</b></p><p>Approved limit: <b>₹{data.limit.toLocaleString()}</b></p><p>Outstanding: <b>₹{data.used.toLocaleString()}</b></p><p>Due date: <b>{data.dueDate?new Date(data.dueDate).toLocaleDateString('en-IN'):'No amount due'}</b></p>{data.note&&<div className="credit-note">Store note: {data.note}</div>}</div>
      <div className="credit-panel"><h2>{data.status==='approved'?'PayLater is active':'Request PayLater'}</h2>{data.status==='approved'?<><p>You can select <b>SBN PayLater</b> at checkout whenever your available limit covers the order total.</p><div className="safe-credit">✓ Manual store approval<br/>✓ No automatic credit scoring<br/>✓ Outstanding balance visible anytime</div></>:<form onSubmit={request}><label>Requested store-credit limit<input type="number" min="1" value={amount} onChange={e=>setAmount(e.target.value)}/></label><button>Submit for manual review</button></form>}{msg&&<div className="notice">{msg}</div>}{error&&<div className="alert">{error}</div>}</div>
    </section>
  </main>
}

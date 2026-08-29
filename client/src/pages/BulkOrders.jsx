import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../api';
import {useAuth} from '../context/AuthContext';

const money=n=>`₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
const date=v=>v?new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';
const blankItem=()=>({name:'',quantity:1,unit:'pcs',note:''});
const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

export default function BulkOrders(){
  const {user}=useAuth();
  const [orders,setOrders]=useState([]);
  const [items,setItems]=useState([blankItem()]);
  const [attachment,setAttachment]=useState(null);
  const [fileName,setFileName]=useState('');
  const [form,setForm]=useState({name:user?.name||'',email:user?.email||'',phone:user?.phone||'',businessName:'',gstNumber:'',address:'',city:'',state:'Rajasthan',pincode:'',customerNote:''});
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
  const load=()=>api('/bulk-orders/mine').then(setOrders).catch(e=>setError(e.message));
  useEffect(()=>{load()},[]);

  const activeCount=useMemo(()=>orders.filter(o=>!['Delivered','Rejected','Cancelled'].includes(o.status)).length,[orders]);
  function itemChange(index,key,value){setItems(x=>x.map((i,n)=>n===index?{...i,[key]:value}:i))}
  function removeItem(index){setItems(x=>x.length===1?[blankItem()]:x.filter((_,n)=>n!==index))}

  async function handleFile(e){
    setError('');const file=e.target.files?.[0];if(!file)return;
    const allowed=['text/plain','text/csv','application/pdf','image/jpeg','image/png'];
    if(!allowed.includes(file.type))return setError('Use TXT, CSV, PDF, JPG or PNG file.');
    if(file.size>1.5*1024*1024)return setError('File must be 1.5 MB or smaller.');
    const reader=new FileReader();
    const data=await new Promise((resolve,reject)=>{reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});
    setAttachment({name:file.name,type:file.type,size:file.size,data});setFileName(file.name);
    if(['text/plain','text/csv'].includes(file.type)){
      const text=await file.text();
      const parsed=text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map((line,index)=>{
        const parts=line.split(/[,\t]/).map(x=>x.trim());
        if(index===0&&/^(item|product|name)$/i.test(parts[0]))return null;
        return {name:parts[0]||'',quantity:Number(parts[1])||1,unit:parts[2]||'pcs',note:parts.slice(3).join(' ')||''};
      }).filter(x=>x?.name);
      if(parsed.length)setItems(parsed);
    }
  }

  async function submit(e){
    e.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      const requestedItems=items.map(i=>({...i,quantity:Number(i.quantity)||1})).filter(i=>i.name.trim());
      await api('/bulk-orders',{method:'POST',body:JSON.stringify({contact:{name:form.name,email:form.email,phone:form.phone,businessName:form.businessName,gstNumber:form.gstNumber,address:form.address,city:form.city,state:form.state,pincode:form.pincode},customerNote:form.customerNote,requestedItems,attachment})});
      setItems([blankItem()]);setAttachment(null);setFileName('');setForm(x=>({...x,businessName:'',gstNumber:'',customerNote:''}));setMessage('Bulk order request submitted. Store management will review your list and send a quotation here.');await load();
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }

  async function decide(id,decision){
    const note=decision==='Rejected'?prompt('Optional: tell us why you are rejecting this quotation.')||'':'';
    if(decision==='Accepted'&&!confirm('Accept this quotation and proceed with the bulk order?'))return;
    try{await api(`/bulk-orders/${id}/decision`,{method:'PATCH',body:JSON.stringify({decision,note})});await load()}catch(e){alert(e.message)}
  }

  function printQuote(o){
    const q=o.quotation||{};const w=window.open('','_blank','width=900,height=900');if(!w)return alert('Allow pop-ups to print quotation.');
    const rows=(q.items||[]).map((i,n)=>`<tr><td>${n+1}</td><td>${esc(i.name)}</td><td>${esc(i.quantity)} ${esc(i.unit)}</td><td>${money(i.rate)}</td><td>${money(i.amount)}</td></tr>`).join('');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(q.quoteNo||'Bulk Quotation')}</title><style>*{box-sizing:border-box}body{font-family:Arial;margin:0;background:#eef3ef;color:#17231b}.bar{max-width:820px;margin:15px auto;text-align:right}.bar button{border:0;background:#126b42;color:#fff;padding:10px 16px;border-radius:9px;font-weight:700}.sheet{max-width:820px;margin:auto;background:#fff;padding:34px;box-shadow:0 15px 50px #1232}.head{display:flex;justify-content:space-between;border-bottom:3px solid #126b42;padding-bottom:18px}.head img{width:165px}.head h1{color:#126b42;margin:0}.meta{text-align:right;font-size:12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:24px 0}.card{border:1px solid #dfe6e1;border-radius:12px;padding:14px;font-size:12px;line-height:1.6}table{width:100%;border-collapse:collapse}th{background:#143d2a;color:#fff;text-align:left;padding:10px;font-size:11px}td{padding:10px;border-bottom:1px solid #e5eae6;font-size:12px}th:last-child,td:last-child{text-align:right}.totals{width:320px;margin:20px 0 20px auto}.totals div{display:flex;justify-content:space-between;padding:7px}.grand{border-top:1px solid #bbb;font-size:18px;font-weight:800;color:#126b42}.note{background:#f5f8f5;padding:14px;border-radius:10px;font-size:11px}.foot{margin-top:35px;display:flex;justify-content:space-between;font-size:11px;color:#637067}.sign{border-top:1px solid #777;padding-top:7px;margin-top:35px;text-align:center}@media print{body{background:#fff}.bar{display:none}.sheet{box-shadow:none;margin:0;max-width:none}}@page{size:A4;margin:10mm}</style></head><body><div class="bar"><button onclick="window.print()">Print / Save PDF</button></div><main class="sheet"><section class="head"><div><img src="${esc(window.location.origin)}/sbn-kirana-logo.svg"><h1>Bulk Order Quotation</h1></div><div class="meta"><b>${esc(q.quoteNo||o.requestNo)}</b><br>Request: ${esc(o.requestNo)}<br>Date: ${date(q.createdAt||o.createdAt)}<br>Valid until: ${date(q.validUntil)}</div></section><section class="grid"><div class="card"><b>Customer</b><br>${esc(o.contact?.name)}<br>${esc(o.contact?.phone)}<br>${esc(o.contact?.email)}</div><div class="card"><b>Delivery Address</b><br>${esc([o.contact?.address,o.contact?.city,o.contact?.state,o.contact?.pincode].filter(Boolean).join(', '))}</div></section><table><thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><section class="totals"><div><span>Subtotal</span><b>${money(q.subtotal)}</b></div><div><span>Discount</span><b>- ${money(q.discount)}</b></div><div><span>Tax</span><b>${money(q.tax)}</b></div><div><span>Delivery</span><b>${money(q.deliveryFee)}</b></div><div class="grand"><span>Total</span><span>${money(q.total)}</span></div></section><div class="note"><b>Quotation note:</b> ${esc(q.note||'Prices and availability are subject to this quotation validity period.')}<br><br>Payment and delivery details will be confirmed after quotation acceptance.</div><footer class="foot"><div><b>SBN KIRANA AND GROCERY</b><br>Customer support via website</div><div class="sign">Authorized Quotation<br>SBN Kirana</div></footer></main></body></html>`);w.document.close();
  }

  return <main className="bulk-page">
    <section className="bulk-hero"><div><span>BULK & BUSINESS ORDERS</span><h1>Send your grocery list. Get a clear quotation.</h1><p>For offices, events, families, retailers and recurring requirements. Upload a list or enter items manually, then track quotation, payment and delivery in one place.</p><div className="bulk-trust"><span>✓ Manual quotation</span><span>✓ Item-wise pricing</span><span>✓ Delivery tracking</span><span>✓ Printable bill</span></div></div><div className="bulk-hero-stat"><small>ACTIVE REQUESTS</small><b>{activeCount}</b><span>{orders.length} total requests</span></div></section>

    <section className="bulk-layout"><form className="bulk-request-card" onSubmit={submit}><div className="bulk-card-head"><div><span>NEW REQUEST</span><h2>Bulk shopping list</h2></div><small>TXT · CSV · PDF · JPG · PNG</small></div>{message&&<div className="bulk-success">✓ {message}</div>}{error&&<div className="bulk-error">{error}</div>}
      <div className="bulk-contact-grid"><label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Phone<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Business / Company<input value={form.businessName} onChange={e=>setForm({...form,businessName:e.target.value})} placeholder="Optional"/></label><label>GST Number<input value={form.gstNumber} onChange={e=>setForm({...form,gstNumber:e.target.value})} placeholder="Optional"/></label><label>City<input required value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label><label className="wide">Delivery address<input required value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label><label>State<input required value={form.state} onChange={e=>setForm({...form,state:e.target.value})}/></label><label>Pincode<input required value={form.pincode} onChange={e=>setForm({...form,pincode:e.target.value})}/></label></div>
      <div className="bulk-upload"><input id="bulk-list-file" type="file" accept=".txt,.csv,.pdf,.jpg,.jpeg,.png" onChange={handleFile}/><label htmlFor="bulk-list-file"><span>⇧</span><div><b>{fileName||'Upload shopping list'}</b><small>{fileName?'File attached. Choose again to replace it.':'Maximum 1.5 MB. CSV/TXT items are auto-added below.'}</small></div></label>{attachment&&<button type="button" onClick={()=>{setAttachment(null);setFileName('')}}>Remove</button>}</div>
      <div className="bulk-items-head"><div><span>ITEM LIST</span><h3>Add or correct items</h3></div><button type="button" onClick={()=>setItems(x=>[...x,blankItem()])}>＋ Add row</button></div><div className="bulk-item-list">{items.map((i,n)=><div className="bulk-item-row" key={n}><span className="row-no">{n+1}</span><input placeholder="Product / item name" value={i.name} onChange={e=>itemChange(n,'name',e.target.value)}/><input type="number" min="0.01" step="0.01" value={i.quantity} onChange={e=>itemChange(n,'quantity',e.target.value)}/><input placeholder="kg / pcs / box" value={i.unit} onChange={e=>itemChange(n,'unit',e.target.value)}/><input placeholder="Brand / note" value={i.note} onChange={e=>itemChange(n,'note',e.target.value)}/><button type="button" onClick={()=>removeItem(n)}>×</button></div>)}</div>
      <label className="bulk-note">Notes for quotation<textarea value={form.customerNote} onChange={e=>setForm({...form,customerNote:e.target.value})} placeholder="Preferred brands, substitutions, delivery timing, invoice/GST requirements..."/></label><button className="bulk-submit" disabled={busy}>{busy?'Submitting...':'Request Bulk Quotation →'}</button><p className="bulk-policy">Submitting a request does not place a paid order. Store management reviews availability and sends a quotation first.</p>
    </form>

    <aside className="bulk-how"><span>HOW IT WORKS</span><h2>Simple 4-step process</h2><ol><li><b>1</b><div><strong>Send your list</strong><p>Upload a file or type items.</p></div></li><li><b>2</b><div><strong>We prepare quotation</strong><p>Rates, discount, tax and delivery are shown clearly.</p></div></li><li><b>3</b><div><strong>You approve</strong><p>Accept or reject the quotation from this page.</p></div></li><li><b>4</b><div><strong>Payment & delivery</strong><p>Track payment and fulfilment until delivery.</p></div></li></ol><Link to="/contact">Need help? Contact SBN support →</Link></aside></section>

    <section className="bulk-history"><div className="bulk-history-head"><div><span>YOUR REQUESTS</span><h2>Quotations & fulfilment</h2></div><b>{orders.length}</b></div>{orders.map(o=><article className="bulk-order-card" key={o._id}><header><div><small>{o.requestNo||`#${o._id.slice(-8)}`}</small><h3>{o.contact?.businessName||'Bulk grocery request'}</h3><span>Requested {date(o.createdAt)}</span></div><span className={`bulk-status ${o.status.toLowerCase().replaceAll(' ','-')}`}>{o.status}</span></header><div className="bulk-request-summary"><div><small>ITEMS</small><b>{o.requestedItems?.length||0}</b></div><div><small>ATTACHMENT</small><b>{o.attachment?.name||'—'}</b></div><div><small>QUOTE TOTAL</small><b>{o.quotation?.total?money(o.quotation.total):'Waiting'}</b></div><div><small>PAYMENT</small><b>{o.payment?.status||'Pending'}</b></div><div><small>DELIVERY</small><b>{o.delivery?.status||'Pending'}</b></div></div>{o.requestedItems?.length>0&&<div className="bulk-requested-items">{o.requestedItems.slice(0,8).map(i=><span key={i._id||i.name}>{i.name} · {i.quantity} {i.unit}</span>)}{o.requestedItems.length>8&&<span>+{o.requestedItems.length-8} more</span>}</div>}{o.attachment?.data&&<a className="bulk-attachment" href={o.attachment.data} download={o.attachment.name}>⇩ Download submitted list</a>}
      {o.quotation?.items?.length>0&&<section className="customer-quote"><div className="quote-title"><div><small>QUOTATION</small><h4>{o.quotation.quoteNo}</h4><span>Valid until {date(o.quotation.validUntil)}</span></div><button onClick={()=>printQuote(o)}>Print / PDF</button></div><div className="quote-lines">{o.quotation.items.map(i=><div key={i._id||i.name}><span>{i.name}<small>{i.quantity} {i.unit} × {money(i.rate)}</small></span><b>{money(i.amount)}</b></div>)}</div><div className="quote-total"><span>Subtotal {money(o.quotation.subtotal)} · Discount {money(o.quotation.discount)} · Tax {money(o.quotation.tax)} · Delivery {money(o.quotation.deliveryFee)}</span><strong>{money(o.quotation.total)}</strong></div>{o.quotation.note&&<p className="quote-note">{o.quotation.note}</p>}{o.status==='Quoted'&&<div className="quote-decision"><button className="reject" onClick={()=>decide(o._id,'Rejected')}>Reject quotation</button><button onClick={()=>decide(o._id,'Accepted')}>Accept & Proceed</button></div>}</section>}
      {['Accepted','Confirmed','Preparing','Out for Delivery','Delivered'].includes(o.status)&&<div className="bulk-progress"><div><small>PAYMENT</small><b>{o.payment?.method||'Not selected'} · {o.payment?.status||'Pending'}</b><span>{o.payment?.amountPaid?`${money(o.payment.amountPaid)} received`:o.payment?.note||'Store will update payment confirmation here.'}</span></div><div><small>DELIVERY</small><b>{o.delivery?.mode||'Door Delivery'} · {o.delivery?.status||'Pending'}</b><span>{o.delivery?.expectedDate?`Expected ${date(o.delivery.expectedDate)}`:o.delivery?.note||'Delivery schedule will appear here.'}</span></div>{o.billing?.invoiceNo&&<div><small>INVOICE</small><b>{o.billing.invoiceNo}</b><span>Bill number assigned after acceptance.</span></div>}</div>}</article>)}{!orders.length&&<div className="bulk-empty"><span>📋</span><h3>No bulk requests yet</h3><p>Your quotations and delivery tracking will appear here after you send your first list.</p></div>}</section>
  </main>;
}

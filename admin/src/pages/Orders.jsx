import {useEffect,useState} from 'react';
import {adminApi} from '../api';
import '../order-enhancements.css';

const statuses=['Placed','Confirmed','Packed','Shipped','Delivered','Cancelled'];

const STORE={
  name:import.meta.env.VITE_STORE_NAME||'SBN KIRANA AND GROCERY',
  tagline:'Fresh groceries • Daily essentials • Local delivery',
  phone:import.meta.env.VITE_STORE_PHONE||'Customer support via website',
  email:import.meta.env.VITE_STORE_EMAIL||'admin@sbnkirana.com',
  address:import.meta.env.VITE_STORE_ADDRESS||'Store address available on the SBN Kirana Contact page',
  website:import.meta.env.VITE_STORE_WEBSITE||'sbn-kirana-store.vercel.app'
};

const money=value=>`₹${Number(value||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
const date=value=>value?new Date(value).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';
const dateTime=value=>value?new Date(value).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
const orderNo=o=>`SBN-${new Date(o.createdAt||Date.now()).toISOString().slice(0,10).replaceAll('-','')}-${o._id.slice(-6).toUpperCase()}`;
const addressText=a=>[a?.address,a?.city,a?.state,a?.pincode].filter(Boolean).join(', ')||'Address not available';
const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

export default function Orders(){
  const [orders,setOrders]=useState([]);
  const [selected,setSelected]=useState(null);
  const load=()=>adminApi('/admin/orders').then(setOrders);
  useEffect(()=>{load()},[]);

  async function change(id,status){
    await adminApi(`/admin/orders/${id}/status`,{method:'PATCH',body:JSON.stringify({status})});
    load();
  }

  function printInvoice(o){
    const w=window.open('','_blank','width=980,height=900');
    if(!w)return alert('Please allow pop-ups to print the invoice.');
    const a=o.shippingAddress||{};
    const itemRows=o.items.map((i,index)=>`<tr><td>${index+1}</td><td><strong>${esc(i.name)}</strong></td><td>${money(i.price)}</td><td>${i.quantity}</td><td>${money((i.price||0)*(i.quantity||0))}</td></tr>`).join('');
    const payLater=o.paymentMethod==='PAYLATER'&&o.payLaterDueDate?`<div class="due">PayLater due date: <strong>${date(o.payLaterDueDate)}</strong></div>`:'';
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(orderNo(o))}</title><style>
      *{box-sizing:border-box}body{margin:0;background:#eef3ef;color:#17231b;font-family:Arial,Helvetica,sans-serif}.sheet{width:min(860px,calc(100% - 32px));margin:24px auto;background:#fff;box-shadow:0 18px 60px #17321f20;border-radius:18px;overflow:hidden}.topline{height:8px;background:linear-gradient(90deg,#126b42,#48a947,#f1b600,#ff7600)}.head{display:flex;justify-content:space-between;gap:24px;padding:30px 34px 22px;border-bottom:1px solid #e6ebe7}.brand{display:flex;gap:18px;align-items:center}.brand img{width:170px;max-height:58px;object-fit:contain}.brand h1{font-size:16px;margin:0 0 6px}.brand p,.meta p{margin:3px 0;color:#5d6b62;font-size:12px}.invoice-title{text-align:right}.invoice-title strong{display:block;font-size:28px;letter-spacing:1px;color:#126b42}.invoice-title span{font-size:12px;color:#647168}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:24px 34px}.card{border:1px solid #e4eae5;border-radius:14px;padding:16px}.card h3{font-size:10px;letter-spacing:1.3px;color:#16804e;margin:0 0 10px;text-transform:uppercase}.card p{font-size:12px;line-height:1.65;margin:2px 0}.summary-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.tag{font-size:10px;font-weight:700;background:#edf8ef;color:#217344;border-radius:999px;padding:6px 9px}.due{margin-top:9px;background:#fff6d9;border:1px solid #f5dd8d;border-radius:9px;padding:9px;font-size:11px;color:#705600}.items{padding:0 34px 20px}.items table{width:100%;border-collapse:collapse}.items th{background:#133f2a;color:#fff;padding:11px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.6px}.items td{border-bottom:1px solid #e7ece8;padding:12px 10px;font-size:12px}.items th:last-child,.items td:last-child{text-align:right}.totals{margin:0 34px 24px auto;width:310px;border:1px solid #e4eae5;border-radius:12px;padding:14px 16px}.totals div{display:flex;justify-content:space-between;padding:7px 0;font-size:12px}.totals .grand{font-size:17px;font-weight:800;border-top:1px solid #dce4de;margin-top:5px;padding-top:12px;color:#126b42}.note{margin:0 34px 24px;padding:14px 16px;background:#f5f8f5;border-radius:12px;font-size:11px;line-height:1.6;color:#526158}.foot{display:grid;grid-template-columns:1fr 220px;gap:30px;padding:22px 34px 30px;border-top:1px solid #e4eae5}.foot p{font-size:11px;color:#617067;line-height:1.65;margin:3px 0}.sign{text-align:center;align-self:end}.sign .line{border-top:1px solid #66736b;margin-top:46px;padding-top:7px;font-size:11px;font-weight:700}.printbar{width:min(860px,calc(100% - 32px));margin:18px auto 0;display:flex;justify-content:flex-end;gap:8px}.printbar button{border:0;background:#126b42;color:white;padding:10px 16px;border-radius:10px;font-weight:700;cursor:pointer}.printbar .secondary{background:#fff;color:#26372d;border:1px solid #d7dfd9}@media print{body{background:#fff}.printbar{display:none}.sheet{width:100%;margin:0;box-shadow:none;border-radius:0}.topline{-webkit-print-color-adjust:exact;print-color-adjust:exact}.items th{-webkit-print-color-adjust:exact;print-color-adjust:exact}.tag,.due,.note{-webkit-print-color-adjust:exact;print-color-adjust:exact}}@page{size:A4;margin:10mm}
    </style></head><body>
      <div class="printbar"><button class="secondary" onclick="window.close()">Close</button><button onclick="window.print()">Print / Save PDF</button></div>
      <main class="sheet"><div class="topline"></div><section class="head"><div class="brand"><img src="${esc(window.location.origin)}/sbn-kirana-logo.svg" alt="SBN Kirana"><div><h1>${esc(STORE.name)}</h1><p>${esc(STORE.tagline)}</p><p>${esc(STORE.website)}</p></div></div><div class="invoice-title"><strong>INVOICE</strong><span>${esc(orderNo(o))}</span><div class="meta"><p>Order date: ${dateTime(o.createdAt)}</p><p>Status: ${esc(o.status)}</p></div></div></section>
      <section class="grid"><div class="card"><h3>Bill / Deliver To</h3><p><strong>${esc(a.fullName||o.user?.name||'Customer')}</strong></p><p>${esc(a.phone||o.user?.phone||'Phone not available')}</p><p>${esc(o.user?.email||'Email not available')}</p><p>${esc(addressText(a))}</p></div><div class="card"><h3>Payment & Order</h3><p>Payment method: <strong>${esc(o.paymentMethod)}</strong></p><p>Payment status: <strong>${esc(o.paymentStatus||'Pending')}</strong></p><p>Fulfilment: <strong>${esc(o.status)}</strong></p><p>Total items: <strong>${o.items.reduce((s,i)=>s+(i.quantity||0),0)}</strong></p><div class="summary-tags"><span class="tag">${esc(o.paymentMethod)}</span><span class="tag">${esc(o.paymentStatus||'Pending')}</span></div>${payLater}</div></section>
      <section class="items"><table><thead><tr><th>#</th><th>Item</th><th>Rate</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${itemRows}</tbody></table></section>
      <section class="totals"><div><span>Subtotal</span><strong>${money(o.subtotal??o.total)}</strong></div><div><span>Delivery fee</span><strong>${money(o.deliveryFee||0)}</strong></div><div class="grand"><span>Grand Total</span><span>${money(o.total)}</span></div></section>
      <div class="note"><strong>Thank you for shopping with SBN Kirana.</strong><br>Goods once delivered are subject to our return/refund policy. Please keep this invoice for order, payment and PayLater reference.</div>
      <footer class="foot"><div><p><strong>${esc(STORE.name)}</strong></p><p>Address: ${esc(STORE.address)}</p><p>Contact: ${esc(STORE.phone)} • ${esc(STORE.email)}</p><p>Website: ${esc(STORE.website)}</p></div><div class="sign"><div class="line">Authorized Signatory<br>${esc(STORE.name)}</div></div></footer>
      </main></body></html>`);
    w.document.close();
  }

  return <>
    <div className="admin-title"><div><small>ORDER MANAGEMENT</small><h1>Orders & Fulfilment</h1><p>Track payment method, PayLater dues and fulfilment status.</p></div><span>{orders.length} total</span></div>
    <section className="panel order-panel"><div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Payment Status</th><th>Fulfilment</th><th>Actions</th></tr></thead><tbody>{orders.map(o=><tr key={o._id}><td><b>#{o._id.slice(-8)}</b><small className="table-sub">{date(o.createdAt)}</small></td><td><b>{o.user?.name||o.shippingAddress?.fullName||'Customer'}</b><small className="table-sub">{o.user?.email||o.shippingAddress?.phone}</small></td><td>{o.items.reduce((s,i)=>s+i.quantity,0)}</td><td><b>{money(o.total)}</b></td><td><span className={o.paymentMethod==='PAYLATER'?'badge credit-badge':'badge'}>{o.paymentMethod}</span>{o.payLaterDueDate&&<small className="table-sub">Due {date(o.payLaterDueDate)}</small>}</td><td>{o.paymentStatus||'Pending'}</td><td><select value={o.status} onChange={e=>change(o._id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td><td><div className="order-actions"><button className="order-btn" onClick={()=>setSelected(o)}>Details</button><button className="order-btn primary" onClick={()=>printInvoice(o)}>Invoice</button></div></td></tr>)}</tbody></table></div></section>

    {selected&&<div className="order-modal-backdrop" onMouseDown={()=>setSelected(null)}><section className="order-modal" onMouseDown={e=>e.stopPropagation()}><header><div><small>CUSTOMER & ORDER DETAILS</small><h2>#{selected._id.slice(-8)}</h2><p>{orderNo(selected)} • {dateTime(selected.createdAt)}</p></div><button className="modal-close" onClick={()=>setSelected(null)}>×</button></header><div className="order-detail-grid"><div className="detail-card"><span>Customer</span><strong>{selected.shippingAddress?.fullName||selected.user?.name||'Customer'}</strong><p>{selected.user?.email||'Email not available'}</p><p>{selected.shippingAddress?.phone||selected.user?.phone||'Phone not available'}</p></div><div className="detail-card"><span>Delivery Address</span><strong>{addressText(selected.shippingAddress)}</strong><p>{selected.shippingAddress?.state||''} {selected.shippingAddress?.pincode||''}</p></div><div className="detail-card"><span>Payment</span><strong>{selected.paymentMethod} • {selected.paymentStatus||'Pending'}</strong><p>{selected.paymentMethod==='PAYLATER'&&selected.payLaterDueDate?`Due ${date(selected.payLaterDueDate)}`:'No PayLater due date'}</p></div><div className="detail-card"><span>Fulfilment</span><strong>{selected.status}</strong><p>{selected.items.reduce((s,i)=>s+(i.quantity||0),0)} items • {money(selected.total)}</p></div></div><div className="modal-items"><h3>Ordered Items</h3>{selected.items.map(i=><div className="modal-item" key={i._id||i.name}><div><strong>{i.name}</strong><span>{money(i.price)} × {i.quantity}</span></div><b>{money((i.price||0)*(i.quantity||0))}</b></div>)}</div><div className="modal-summary"><div><span>Subtotal</span><b>{money(selected.subtotal??selected.total)}</b></div><div><span>Delivery</span><b>{money(selected.deliveryFee||0)}</b></div><div className="grand"><span>Total</span><strong>{money(selected.total)}</strong></div></div><footer><button className="order-btn" onClick={()=>setSelected(null)}>Close</button><button className="order-btn primary" onClick={()=>printInvoice(selected)}>Print Invoice</button></footer></section></div>}
  </>;
}

import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {api} from '../api';
import {useCart} from '../context/CartContext';

export default function Orders(){
  const [orders,setOrders]=useState([]);const [busy,setBusy]=useState('');const [msg,setMsg]=useState('');const {addToCart}=useCart();const nav=useNavigate();
  useEffect(()=>{api('/orders/mine').then(setOrders).catch(()=>{})},[]);
  async function buyAgain(order){setBusy(order._id);setMsg('');try{let added=0;let skipped=0;for(const item of order.items){if(!item.product){skipped++;continue}try{const p=await api(`/products/${item.product}`);if(!p?.stock){skipped++;continue}const qty=Math.min(Number(item.quantity)||1,p.stock);for(let n=0;n<qty;n++)addToCart(p);added+=qty}catch{skipped++}}if(!added)return setMsg('These products are currently unavailable.');setMsg(`${added} item${added===1?'':'s'} added to cart${skipped?` · ${skipped} unavailable`:''}.`);nav('/cart')}finally{setBusy('')}}
  return <main className="section"><div className="page-title"><span className="eyebrow">Account</span><h1>My Orders</h1><p>Track purchases and quickly rebuild a previous basket using current prices and stock.</p></div>{msg&&<div className="buy-again-msg">{msg}</div>}<div className="orders">{orders.map(o=><article className="order-card" key={o._id}><div className="order-head"><div><small>ORDER</small><b>#{o._id.slice(-8).toUpperCase()}</b></div><div><small>DATE</small><b>{new Date(o.createdAt).toLocaleDateString('en-IN')}</b></div><div><small>TOTAL</small><b>₹{o.total}</b></div><span className={`status ${o.status.toLowerCase()}`}>{o.status}</span></div>{o.items.map(i=><div className="order-line" key={i._id}><span>{i.name} × {i.quantity}</span><b>₹{i.price*i.quantity}</b></div>)}<div className="order-repeat"><span>Need the same groceries again?</span><button disabled={busy===o._id} onClick={()=>buyAgain(o)}>{busy===o._id?'Checking stock...':'↻ Buy Again'}</button></div></article>)}{!orders.length&&<div className="empty"><h2>No orders yet</h2><p>Your placed orders will appear here.</p></div>}</div></main>
}

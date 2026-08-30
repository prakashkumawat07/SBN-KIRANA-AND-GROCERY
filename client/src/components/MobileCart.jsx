import {Link,useNavigate} from 'react-router-dom';
import {useCart} from '../context/CartContext';
import {useAuth} from '../context/AuthContext';
import {productAvailable,productOrderLimit} from '../utils/productAvailability';

const WISH='sbn_wishlist';
export default function MobileCart(){
  const {items,updateQty,remove,subtotal,clear,addToCart}=useCart();
  const {user}=useAuth();
  const nav=useNavigate();
  function saveForLater(item){
    let ids=[];try{ids=JSON.parse(localStorage.getItem(WISH)||'[]')}catch{}
    if(!ids.includes(item._id))ids=[item._id,...ids];
    localStorage.setItem(WISH,JSON.stringify(ids));
    remove(item._id);
  }
  function buyNow(item){clear();addToCart(item);nav(user?'/checkout':'/login')}
  if(!items.length)return <main className="mobile-cart-view mobile-cart-empty"><span>🛒</span><h1>Your cart is empty</h1><p>Add groceries and daily essentials to continue.</p><Link to="/products">Start shopping</Link></main>;
  const mrpTotal=items.reduce((s,i)=>s+Number(i.mrp||i.price)*i.qty,0);
  const savings=Math.max(mrpTotal-subtotal,0);
  return <main className="mobile-cart-view">
    <div className="mobile-cart-title"><h1>My Cart</h1><span>{items.length} item{items.length===1?'':'s'}</span></div>
    <section className="mobile-cart-address"><div><small>Deliver to</small><b>{user?.name||'Customer'}</b><span>Delivery address will be confirmed at checkout.</span></div><Link to={user?'/checkout':'/login'}>Change</Link></section>
    <section className="mobile-cart-items">{items.map(item=>{
      const cover=item.image||(Array.isArray(item.images)&&item.images.length?(typeof item.images[0]==='string'?item.images[0]:item.images[0]?.thumbnail||item.images[0]?.src):'');
      const discount=item.mrp>item.price?Math.round((1-item.price/item.mrp)*100):0;
      const stockCount=Math.max(1,productOrderLimit(item));
      const available=productAvailable(item);
      return <article className="mobile-cart-item" key={item._id}>
        <Link to={`/product/${item._id}`} className="mobile-cart-image"><img src={cover} alt={item.name}/><small>Tap to view</small></Link>
        <div className="mobile-cart-copy"><Link to={`/product/${item._id}`}><h2>{item.name}</h2></Link><p>{item.unit||'Pack'}</p><div className="mobile-cart-rating">★ {Number(item.rating||item.averageRating||4.5).toFixed(1)} <span>• {available?'In stock':'Check stock'}</span></div><div className="mobile-cart-price">{discount>0&&<strong>↓{discount}%</strong>}{item.mrp>item.price&&<del>₹{item.mrp}</del>}<b>₹{item.price}</b></div></div>
        <label className="mobile-cart-qty">Qty:<select value={Math.min(item.qty,stockCount)} onChange={e=>updateQty(item._id,e.target.value)}>{Array.from({length:stockCount},(_,n)=><option value={n+1} key={n+1}>{n+1}</option>)}</select></label>
        <div className="mobile-cart-actions"><button onClick={()=>remove(item._id)}>🗑 Remove</button><button onClick={()=>saveForLater(item)}>♡ Save for later</button><button onClick={()=>buyNow(item)}>⚡ Buy this now</button></div>
      </article>})}</section>
    <section className="mobile-cart-price-box"><h2>Price details</h2><p><span>MRP total</span><b>₹{mrpTotal}</b></p><p><span>Product discount</span><b className="green">− ₹{savings}</b></p><p><span>Delivery</span><b>Shown at checkout</b></p><hr/><p className="mobile-cart-grand"><span>Basket total</span><b>₹{subtotal}</b></p></section>
    <div className="mobile-cart-orderbar"><div>{savings>0&&<del>₹{mrpTotal}</del>}<strong>₹{subtotal}</strong><small>Delivery calculated at checkout</small></div><Link to={user?'/checkout':'/login'}>Place Order</Link></div>
  </main>;
}

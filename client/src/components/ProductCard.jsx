import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useCart} from '../context/CartContext';
const WISH='sbn_wishlist';
export default function ProductCard({product}){
  const {addToCart}=useCart();
  const nav=useNavigate();
  const [saved,setSaved]=useState(()=>{try{return JSON.parse(localStorage.getItem(WISH)||'[]').includes(product._id)}catch{return false}});
  const [added,setAdded]=useState(false);
  const saving=product.mrp>product.price?product.mrp-product.price:0;
  function toggle(){let ids=[];try{ids=JSON.parse(localStorage.getItem(WISH)||'[]')}catch{}ids=ids.includes(product._id)?ids.filter(x=>x!==product._id):[product._id,...ids];localStorage.setItem(WISH,JSON.stringify(ids));setSaved(ids.includes(product._id))}
  function add(){if(!product.stock)return;addToCart(product);setAdded(true);setTimeout(()=>setAdded(false),1200)}
  function buyNow(){if(!product.stock)return;addToCart(product);nav('/checkout')}
  return <article className="product-card conversion-product-card">
    <div className="product-image">
      <Link to={`/product/${product._id}`}><img src={product.image} alt={product.name}/></Link>
      {product.discount>0&&<span className="discount">{product.discount}% OFF</span>}
      <button className="wish-btn" aria-label="Save item" onClick={toggle}>{saved?'♥':'♡'}</button>
    </div>
    <div className="product-body">
      <span className="category">{product.category}</span>
      <h3><Link to={`/product/${product._id}`}>{product.name}</Link></h3>
      <p className="unit">{product.unit}</p>
      <div className="price-row"><strong>₹{product.price}</strong>{product.mrp>product.price&&<del>₹{product.mrp}</del>}</div>
      <div className="product-value-line">{saving>0?<small className="saving">Save ₹{saving}</small>:<small className="saving neutral">Everyday value</small>}<span className={product.stock?'stock-mini':'stock-mini out'}>{product.stock?'In stock':'Out of stock'}</span></div>
      <div className="product-buy-actions">
        <button className={`add-btn ${added?'added':''}`} disabled={!product.stock} onClick={add}>{product.stock?(added?'✓ Added':'＋ Add to Cart'):'Out of stock'}</button>
        <button className="buy-now-btn" disabled={!product.stock} onClick={buyNow}>Buy Now</button>
      </div>
      {product.stock>0&&<small className="fast-checkout-note">Fast checkout · Delivery shown at checkout</small>}
    </div>
  </article>
}

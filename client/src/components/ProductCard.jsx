import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useCart} from '../context/CartContext';
const WISH='sbn_wishlist';
export default function ProductCard({product}){
  const {addToCart}=useCart();
  const [saved,setSaved]=useState(()=>{try{return JSON.parse(localStorage.getItem(WISH)||'[]').includes(product._id)}catch{return false}});
  const saving=product.mrp>product.price?product.mrp-product.price:0;
  function toggle(){let ids=[];try{ids=JSON.parse(localStorage.getItem(WISH)||'[]')}catch{}ids=ids.includes(product._id)?ids.filter(x=>x!==product._id):[product._id,...ids];localStorage.setItem(WISH,JSON.stringify(ids));setSaved(ids.includes(product._id))}
  return <article className="product-card">
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
      {saving>0&&<small className="saving">You save ₹{saving}</small>}
      <button className="add-btn" disabled={!product.stock} onClick={()=>addToCart(product)}><span>{product.stock?'＋ Add':'Out of stock'}</span>{product.stock&&<small>Cart</small>}</button>
    </div>
  </article>
}

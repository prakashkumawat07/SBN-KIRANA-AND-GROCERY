import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
const WISH='sbn_wishlist';
const BADGES={limited:'Limited Stock',selling_fast:'Selling Fast',few_left:'Few Left',in_stock:'In Stock',popular:'Popular choice',fresh:'Fresh arrival',best_value:'Best value',hot_deal:'Hot deal',trending:'Trending now',today_pick:"Today's pick"};
export default function ProductCard({product}){
  const nav=useNavigate();
  const [saved,setSaved]=useState(()=>{try{return JSON.parse(localStorage.getItem(WISH)||'[]').includes(product._id)}catch{return false}});
  const saving=product.mrp>product.price?product.mrp-product.price:0;
  const cover=product.image||(Array.isArray(product.images)&&product.images.length?(typeof product.images[0]==='string'?product.images[0]:product.images[0]?.thumbnail||product.images[0]?.src):'');
  const badge=BADGES[product.customerBadge]||'';
  const marketing=String(product.dealLabel||badge||'').trim();
  function toggle(e){e?.stopPropagation();let ids=[];try{ids=JSON.parse(localStorage.getItem(WISH)||'[]')}catch{}ids=ids.includes(product._id)?ids.filter(x=>x!==product._id):[product._id,...ids];localStorage.setItem(WISH,JSON.stringify(ids));setSaved(ids.includes(product._id))}
  function open(){nav(`/product/${product._id}`)}
  return <article className="product-card conversion-product-card product-card-clickable" role="link" tabIndex="0" onClick={open} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}}}>
    <div className="product-image">
      <img src={cover} alt={product.name}/>
      {product.discount>0&&<span className="discount">{product.discount}% OFF</span>}
      <button type="button" className="wish-btn" aria-label="Save item" onClick={toggle}>{saved?'♥':'♡'}</button>
    </div>
    <div className="product-body">
      <span className="category">{product.category}</span>
      <h3>{product.name}</h3>
      <p className="unit">{product.unit}</p>
      <div className="price-row"><strong>₹{product.price}</strong>{product.mrp>product.price&&<del>₹{product.mrp}</del>}</div>
      <div className="product-value-line">{saving>0?<small className="saving">Save ₹{saving}</small>:<small className="saving neutral">Everyday value</small>}<span className={product.stock?'stock-mini':'stock-mini out'}>{product.stock?(marketing||'View product'):'Unavailable'}</span></div>
      <div className="product-card-view">Tap for details <span>→</span></div>
    </div>
  </article>
}

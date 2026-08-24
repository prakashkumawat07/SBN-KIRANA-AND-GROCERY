import { useCart } from '../context/CartContext';

export default function ProductCard({product}){
  const {addToCart}=useCart();
  const saving=product.mrp>product.price?product.mrp-product.price:0;
  return <article className="product-card">
    <div className="product-image">
      <img src={product.image} alt={product.name}/>
      {product.discount>0&&<span className="discount">{product.discount}% OFF</span>}
      <button className="wish-btn" aria-label="Save item">♡</button>
    </div>
    <div className="product-body">
      <span className="category">{product.category}</span>
      <h3>{product.name}</h3>
      <p className="unit">{product.unit}</p>
      <div className="price-row"><strong>₹{product.price}</strong>{product.mrp>product.price&&<del>₹{product.mrp}</del>}</div>
      {saving>0&&<small className="saving">You save ₹{saving}</small>}
      <button className="add-btn" disabled={!product.stock} onClick={()=>addToCart(product)}><span>{product.stock?'＋ Add':'Out of stock'}</span>{product.stock&&<small>Cart</small>}</button>
    </div>
  </article>
}

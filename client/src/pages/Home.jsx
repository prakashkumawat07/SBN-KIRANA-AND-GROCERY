import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../api';
import ProductCard from '../components/ProductCard';

const categories=[['🥬','Vegetables'],['🍎','Fruits'],['🥛','Dairy'],['🌾','Atta & Grains'],['🍚','Rice & Dal'],['🍪','Snacks'],['🥤','Beverages'],['🧼','Home Care']];

export default function Home(){
  const [products,setProducts]=useState([]);useEffect(()=>{api('/products?featured=true').then(setProducts).catch(()=>{})},[]);
  return <main className="market-home">
    <section className="market-hero">
      <div className="hero-main-card"><div className="hero-copy-new"><span className="hero-kicker">EVERYDAY VALUE • LOCAL SPEED</span><h1>Everything your home needs, <em>one smart basket away.</em></h1><p>Shop fresh groceries, pantry essentials, snacks and home care with quick local fulfilment.</p><div className="hero-buttons"><Link className="shop-now" to="/products">Shop now →</Link><Link className="outline-btn" to="/paylater">Explore PayLater</Link></div><div className="trust-row"><span>✓ Fresh picks</span><span>✓ Secure account</span><span>✓ Easy support</span></div></div><div className="hero-art"><div className="basket-visual"><span>🥦</span><span>🍊</span><span>🥖</span><span>🥛</span><span>🍅</span></div><div className="price-pop"><small>FREE DELIVERY</small><b>Orders ₹499+</b></div></div></div>
      <div className="hero-side"><Link to="/paylater" className="side-card credit-side"><span>₹</span><div><small>SBN PAYLATER</small><h3>Buy essentials on approved store credit</h3><p>Manual approval • Clear limit • Track dues</p></div></Link><Link to="/products" className="side-card deal-side"><span>⚡</span><div><small>QUICK SHOP</small><h3>Daily essentials ready to add</h3><p>Groceries for your weekly basket</p></div></Link></div>
    </section>

    <section className="category-rail"><div className="rail-title"><h2>Shop by category</h2><Link to="/products">View all →</Link></div><div className="rail-items">{categories.map(([icon,name])=><Link to={`/products?search=${encodeURIComponent(name)}`} key={name}><span>{icon}</span><b>{name}</b></Link>)}</div></section>

    <section className="deal-band"><div><span className="deal-icon">🏷️</span><div><small>SBN VALUE DAYS</small><h2>Smart prices on everyday staples</h2></div></div><Link to="/products">Browse all deals →</Link></section>

    <section className="market-section"><div className="market-section-head"><div><small>TOP PICKS</small><h2>Popular products</h2><p>Customer favourites and everyday essentials.</p></div><Link to="/products">See everything →</Link></div><div className="product-grid">{products.slice(0,8).map(p=><ProductCard key={p._id} product={p}/>)}</div></section>

    <section className="service-cards"><div><span>🚚</span><b>Fast local fulfilment</b><p>Simple doorstep delivery for everyday orders.</p></div><div><span>💳</span><b>SBN PayLater</b><p>Store credit after manual approval from management.</p></div><div><span>📦</span><b>Bulk & business orders</b><p>Support for recurring and larger grocery requirements.</p></div><div><span>🤝</span><b>Dealers & suppliers</b><p>Business enquiry channel for brands and distributors.</p></div></section>

    <section className="paylater-banner"><div><span>PAYLATER</span><h2>Running short before the next payment day?</h2><p>Approved customers can use an assigned SBN Kirana store-credit limit at checkout and track outstanding dues from their account.</p><Link to="/paylater">Open PayLater →</Link></div><div className="big-rupee">₹</div></section>
  </main>
}

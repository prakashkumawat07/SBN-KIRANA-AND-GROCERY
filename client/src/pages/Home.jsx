import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../api';
import ProductCard from '../components/ProductCard';
import {fallbackProducts} from '../data/fallbackProducts';

const categories=[['🌾','Staples'],['🥛','Dairy'],['🍪','Snacks'],['🥤','Beverages'],['🧼','Home Care'],['☕','Tea & Breakfast'],['🛒','Daily Essentials'],['📦','Bulk Orders']];

export default function Home(){
  const [products,setProducts]=useState(fallbackProducts);
  const [offers,setOffers]=useState([]);
  useEffect(()=>{
    api('/products').then(data=>{if(Array.isArray(data)&&data.length)setProducts(data)}).catch(()=>{});
    api('/offers').then(d=>setOffers(Array.isArray(d)?d:[])).catch(()=>{});
  },[]);
  const featuredOffer=offers.find(o=>o.featured)||offers[0];
  const dealProducts=useMemo(()=>[...products].sort((a,b)=>(b.discount||0)-(a.discount||0)||(a.price||0)-(b.price||0)).slice(0,8),[products]);
  const offerValue=featuredOffer?(featuredOffer.type==='percent'?`${featuredOffer.value}% OFF`:`₹${featuredOffer.value} OFF`):'SMART SAVINGS';
  return <main className="market-home conversion-home">
    <section className="market-hero conversion-hero">
      <div className="hero-main-card marketing-hero-card">
        <div className="hero-copy-new">
          <span className="hero-kicker">SBN SMART SAVINGS • FAST LOCAL FULFILMENT</span>
          <div className="marketing-pill">🏷️ {featuredOffer?`${offerValue} · Code ${featuredOffer.code}`:'Everyday grocery offers'}</div>
          <h1>Fill your basket. <em>Save more today.</em></h1>
          <p>{featuredOffer?.description||'Shop groceries, staples, dairy, snacks and home essentials with quick checkout, transparent prices and doorstep delivery.'}</p>
          <div className="hero-buttons"><Link className="shop-now" to="/products">Shop best deals →</Link><Link className="outline-btn" to="/bulk-orders">Bulk order quotation</Link></div>
          <div className="trust-row"><span>✓ Buy Now on products</span><span>✓ Free delivery ₹499+</span><span>✓ Order tracking</span></div>
        </div>
        <div className="hero-art marketing-stage">
          <div className="hero-sale-orb"><small>TODAY'S VALUE</small><strong>{offerValue}</strong><span>{featuredOffer?.code?`Use ${featuredOffer.code} at checkout`:'Shop products at current store prices'}</span><Link to="/products">Shop now</Link></div>
          <div className="marketing-float top"><small>FAST CHECKOUT</small><b>Add → Buy → Delivered</b></div>
          <div className="marketing-float bottom"><small>FREE DELIVERY</small><b>Basket ₹499+</b></div>
        </div>
      </div>
      <div className="hero-side marketing-side">
        <Link to="/products" className="side-card deal-side marketing-deal-card"><span>★</span><div><small>QUICK BUY</small><h3>Best prices, one-click Buy Now</h3><p>Add to cart or go directly to checkout.</p></div></Link>
        <Link to="/paylater" className="side-card credit-side"><span>₹</span><div><small>SBN PAYLATER</small><h3>Approved store credit for essentials</h3><p>Clear limit • Due tracking • Manual approval</p></div></Link>
        <Link to="/bulk-orders" className="side-card bulk-marketing-card"><span>📋</span><div><small>BULK & BUSINESS</small><h3>Upload a list. Get your quotation.</h3><p>Item-wise rates • Payment • Delivery • Invoice</p></div></Link>
      </div>
    </section>

    <section className="conversion-proof-strip"><div><b>⚡ Quick checkout</b><span>Buy Now available on every in-stock product</span></div><div><b>🚚 Local delivery</b><span>Free delivery on eligible ₹499+ baskets</span></div><div><b>🔒 Clear payment</b><span>COD, UPI and approved PayLater options</span></div><div><b>📦 Bigger requirement?</b><span><Link to="/bulk-orders">Request a bulk quotation →</Link></span></div></section>

    {featuredOffer&&<section className="live-offer-banner conversion-offer"><div><span>LIVE STORE OFFER</span><h2>{featuredOffer.title}</h2><p>{featuredOffer.description||`Use code ${featuredOffer.code} at checkout.`}</p></div><div className="live-offer-code"><small>COUPON CODE</small><b>{featuredOffer.code}</b><span>{featuredOffer.type==='percent'?`${featuredOffer.value}% OFF`:`₹${featuredOffer.value} OFF`}{featuredOffer.minOrder?` · Min ₹${featuredOffer.minOrder}`:''}</span></div><Link to="/products">Use this offer →</Link></section>}

    <section className="category-rail"><div className="rail-title"><div><small className="home-section-kicker">QUICK SHOP</small><h2>Shop what you need</h2></div><Link to="/products">View all →</Link></div><div className="rail-items">{categories.map(([icon,name])=>name==='Bulk Orders'?<Link to="/bulk-orders" key={name}><span>{icon}</span><b>{name}</b></Link>:<Link to={`/products?search=${encodeURIComponent(name)}`} key={name}><span>{icon}</span><b>{name}</b></Link>)}</div></section>

    <section className="deal-band conversion-deal-band"><div><span className="deal-icon">🔥</span><div><small>SHOP WITHOUT WAITING</small><h2>Add to Cart for a basket, or tap Buy Now for faster checkout.</h2></div></div><Link to="/products">Start shopping →</Link></section>

    <section className="market-section conversion-products"><div className="market-section-head"><div><small>BEST VALUE PICKS</small><h2>Popular products ready to order</h2><p>See the current price, saving and stock. Add multiple items or use Buy Now when you want it fast.</p></div><Link to="/products">See all products →</Link></div><div className="product-grid">{dealProducts.map(p=><ProductCard key={p._id} product={p}/>)}</div></section>

    <section className="why-order-grid"><article><span>01</span><div><b>See the real price</b><p>MRP, selling price and savings are visible before checkout.</p></div></article><article><span>02</span><div><b>Choose how you shop</b><p>Add several products to Cart or use Buy Now for direct checkout.</p></div></article><article><span>03</span><div><b>Track after ordering</b><p>Orders, payment method and fulfilment stay visible in My Account.</p></div></article></section>

    <section className="service-cards"><div><span>🚚</span><b>Fast local fulfilment</b><p>Simple doorstep delivery for everyday orders.</p></div><div><span>💳</span><b>SBN PayLater</b><p>Store credit after manual approval from management.</p></div><div><span>📦</span><b>Bulk & business orders</b><p>Upload your list, receive item-wise quotation and track payment/delivery.</p><Link to="/bulk-orders">Request quotation →</Link></div><div><span>☎</span><b>Customer support</b><p>Get help for orders, payments, products and account queries.</p><Link to="/contact">Contact us →</Link></div></section>

    <section className="paylater-banner"><div><span>PAYLATER</span><h2>Keep essentials moving when you need flexibility.</h2><p>Approved customers can use an assigned SBN Kirana store-credit limit at checkout and track outstanding dues from their account.</p><Link to="/paylater">Open PayLater →</Link></div><div className="big-rupee">₹</div></section>
  </main>}

import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../api';
import ProductCard from '../components/ProductCard';

const categories=[
  ['🥦','Fresh Vegetables','Up to 20% off'],
  ['🍎','Fresh Fruits','Farm picked'],
  ['🥛','Dairy & Breakfast','Daily essentials'],
  ['🍚','Atta, Rice & Dal','Kitchen staples'],
  ['🥤','Cold Drinks & Juices','Chilled & ready'],
  ['🧴','Home & Personal Care','Everyday care']
];

export default function Home(){
  const [products,setProducts]=useState([]);
  useEffect(()=>{api('/products?featured=true').then(setProducts).catch(()=>{})},[]);
  return <main>
    <section className="hero-wrap">
      <div className="hero">
        <div className="hero-copy">
          <div className="delivery-chip"><span>⚡</span> Delivery in 15–30 minutes</div>
          <h1>Groceries that come<br/><em>before you miss them.</em></h1>
          <p>Fresh produce, pantry staples and everyday essentials delivered from your trusted neighbourhood grocery store.</p>
          <div className="hero-actions">
            <Link className="primary" to="/products">Shop groceries <span>→</span></Link>
            <Link className="secondary" to="/products">Explore offers</Link>
          </div>
          <div className="hero-proof">
            <div><b>4.8★</b><span>Customer rating</span></div>
            <div><b>1000+</b><span>Happy orders</span></div>
            <div><b>7 Days</b><span>Open every week</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-orb orb-one"></div><div className="hero-orb orb-two"></div>
          <div className="grocery-bag"><span className="bag-mark">SBN</span><div className="bag-items">🥬 🍅 🥖<br/>🥛 🍊 🥚</div><b>Fresh. Fast. Local.</b></div>
          <div className="floating-card fc-one"><span>🥬</span><div><small>Fresh today</small><b>Green Veggies</b></div></div>
          <div className="floating-card fc-two"><span>🛵</span><div><small>Fast delivery</small><b>At your door</b></div></div>
        </div>
      </div>
    </section>

    <section className="quick-benefits">
      <div><span>⚡</span><div><b>Quick Delivery</b><small>Fast doorstep service</small></div></div>
      <div><span>🥬</span><div><b>Fresh Quality</b><small>Handpicked everyday</small></div></div>
      <div><span>₹</span><div><b>Best Prices</b><small>Value on every basket</small></div></div>
      <div><span>🛡️</span><div><b>Secure Shopping</b><small>Safe checkout experience</small></div></div>
    </section>

    <section className="section category-section">
      <div className="section-head"><div><span className="eyebrow">Shop your way</span><h2>Popular categories</h2></div><Link to="/products">See all products →</Link></div>
      <div className="category-grid">{categories.map(([icon,title,sub])=><Link to="/products" className="category-card" key={title}><div className="category-icon">{icon}</div><b>{title}</b><small>{sub}</small><span>Shop now →</span></Link>)}</div>
    </section>

    <section className="promo-row">
      <div className="promo-card promo-green"><small>WEEKEND SAVINGS</small><h3>Save more on your monthly essentials.</h3><Link to="/products">Shop deals →</Link></div>
      <div className="promo-card promo-yellow"><small>FRESH PICKS</small><h3>Fruits & vegetables selected every morning.</h3><Link to="/products">Explore fresh →</Link></div>
    </section>

    <section className="section featured-section">
      <div className="section-head"><div><span className="eyebrow">Picked for you</span><h2>Popular right now</h2><p>Everyday favourites at prices worth adding to cart.</p></div><Link to="/products">View all →</Link></div>
      <div className="product-grid">{products.slice(0,8).map(p=><ProductCard key={p._id} product={p}/>)}</div>
    </section>
  </main>
}

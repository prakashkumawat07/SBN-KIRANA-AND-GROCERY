import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../api';
import ProductCard from '../components/ProductCard';
import {fallbackProducts} from '../data/fallbackProducts';

const visible=p=>p?.category!=='Fruits & Vegetables';
export default function Deals(){
  const [products,setProducts]=useState(fallbackProducts.filter(visible));
  const [offers,setOffers]=useState([]);
  useEffect(()=>{
    api('/products').then(d=>Array.isArray(d)&&d.length&&setProducts(d.filter(visible))).catch(()=>{});
    api('/offers').then(d=>setOffers(Array.isArray(d)?d:[])).catch(()=>{});
  },[]);
  const deals=useMemo(()=>[...products].sort((a,b)=>(b.discount||0)-(a.discount||0)||(b.featured?1:0)-(a.featured?1:0)||(a.price||0)-(b.price||0)),[products]);
  const best=deals.slice(0,12);
  const offer=offers.find(o=>o.featured)||offers[0];
  return <main className="section mobile-deals-page">
    <div className="mobile-deals-hero"><div><small>TOP DEALS</small><h1>Deals worth opening the app for.</h1><p>Featured products, current savings and store offers in one place.</p></div><span>％</span></div>
    {offer&&<section className="mobile-live-coupon"><div><small>LIVE COUPON</small><strong>{offer.code||'STORE OFFER'}</strong><span>{offer.title}</span></div><Link to="/products">Shop now →</Link></section>}
    <div className="mobile-deal-chips"><Link to="/products?category=Staples">🌾 Staples</Link><Link to="/products?category=Dairy">🥛 Dairy</Link><Link to="/products?category=Snacks">🍪 Snacks</Link><Link to="/products">🛒 All deals</Link></div>
    <div className="mobile-section-heading"><div><small>HANDPICKED</small><h2>Suggested for you</h2></div><Link to="/products">View all →</Link></div>
    <div className="product-grid mobile-deals-grid">{best.map(p=><ProductCard key={p._id} product={p}/>)}</div>
  </main>;
}

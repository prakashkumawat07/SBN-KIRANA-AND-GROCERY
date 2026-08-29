import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../api';
import ProductCard from '../components/ProductCard';
import {fallbackProducts} from '../data/fallbackProducts';
import '../top-deals.css';

const visible=p=>p?.category!=='Fruits & Vegetables';
const unique=rows=>[...new Map(rows.filter(Boolean).map(p=>[String(p._id||p.name),p])).values()];
const sortDeals=rows=>[...rows].sort((a,b)=>(Number(b.dealPriority)||0)-(Number(a.dealPriority)||0)||(Number(b.discount)||0)-(Number(a.discount)||0)||(b.featured?1:0)-(a.featured?1:0)||(Number(a.price)||0)-(Number(b.price)||0));

export default function Deals(){
  const [products,setProducts]=useState(fallbackProducts.filter(visible));
  const [offers,setOffers]=useState([]);
  useEffect(()=>{
    api('/products').then(d=>Array.isArray(d)&&d.length&&setProducts(d.filter(visible))).catch(()=>{});
    api('/offers').then(d=>setOffers(Array.isArray(d)?d:[])).catch(()=>{});
  },[]);

  const rails=useMemo(()=>{
    const all=unique(products);
    const assigned=key=>sortDeals(all.filter(p=>Array.isArray(p.dealRails)&&p.dealRails.includes(key)));
    const withFallback=(key,fallback)=>{
      const selected=assigned(key);
      return unique([...(selected.length?selected:fallback()),...sortDeals(all)]).slice(0,14);
    };
    return [
      {key:'hot_deals',icon:'🔥',eyebrow:'LIMITED-TIME VALUE',title:'Hot deals today',subtitle:'Higher savings and store-picked offers.',to:'/products',items:withFallback('hot_deals',()=>sortDeals(all.filter(p=>(p.discount||0)>=8)))},
      {key:'trending',icon:'⚡',eyebrow:'CUSTOMER FAVOURITES',title:'Trending right now',subtitle:'Popular products customers are checking first.',to:'/products',items:withFallback('trending',()=>sortDeals(all.filter(p=>p.featured||['selling_fast','popular','trending'].includes(p.customerBadge))))},
      {key:'best_value',icon:'₹',eyebrow:'SMART SAVINGS',title:'Best value picks',subtitle:'Everyday products with strong price value.',to:'/products',items:withFallback('best_value',()=>sortDeals(all.filter(p=>(p.discount||0)>0||p.customerBadge==='best_value')))},
      {key:'top_picks',icon:'★',eyebrow:'HANDPICKED',title:'Top picks for you',subtitle:'Featured essentials selected by SBN Kirana.',to:'/products',items:withFallback('top_picks',()=>sortDeals(all.filter(p=>p.featured)))},
      {key:'daily_essentials',icon:'🛒',eyebrow:'EVERYDAY NEEDS',title:'Daily essentials',subtitle:'Quick basket builders for regular shopping.',to:'/products?search=Daily%20Essentials',items:withFallback('daily_essentials',()=>sortDeals(all.filter(p=>['Staples','Cooking','Household','Home Care'].includes(p.category))))},
      {key:'staples',icon:'🌾',eyebrow:'PANTRY DEALS',title:'Staples & cooking',subtitle:'Atta, rice, oil, pulses and pantry basics.',to:'/products?search=Staples',items:withFallback('staples',()=>sortDeals(all.filter(p=>['Staples','Cooking'].includes(p.category))))},
      {key:'dairy',icon:'🥛',eyebrow:'BREAKFAST PICKS',title:'Dairy & breakfast',subtitle:'Milk and breakfast essentials in one swipe.',to:'/products?search=Dairy',items:withFallback('dairy',()=>sortDeals(all.filter(p=>['Dairy','Tea & Breakfast'].includes(p.category))))},
      {key:'snacks',icon:'🍪',eyebrow:'CRAVINGS',title:'Snacks & beverages',subtitle:'Quick snacks, drinks and refreshment picks.',to:'/products?search=Snacks',items:withFallback('snacks',()=>sortDeals(all.filter(p=>['Snacks','Beverages'].includes(p.category))))},
      {key:'home_care',icon:'🧼',eyebrow:'HOME SAVINGS',title:'Home & personal care',subtitle:'Useful household and care products.',to:'/products?search=Home%20Care',items:withFallback('home_care',()=>sortDeals(all.filter(p=>['Home Care','Personal Care','Household','Baby Care'].includes(p.category))))}
    ].filter(r=>r.items.length);
  },[products]);

  const offer=offers.find(o=>o.featured)||offers[0];
  return <main className="top-deals-page">
    <section className="top-deals-hero">
      <div><small>⚡ SBN KIRANA TOP DEALS</small><h1>More choices. More savings. Swipe every section.</h1><p>Independent deal shelves make it easy to compare products without losing your place.</p><div className="top-deals-hero-actions"><Link to="/products">Shop all products →</Link>{offer&&<span>Coupon <b>{offer.code}</b></span>}</div></div>
      <div className="top-deals-hero-art"><b>％</b><span>Fresh deals<br/>updated by store</span></div>
    </section>

    {offer&&<section className="top-deals-coupon"><div><small>LIVE STORE OFFER</small><strong>{offer.title}</strong><span>{offer.description||'Apply the coupon at checkout when eligible.'}</span></div><div><b>{offer.code||'OFFER'}</b><small>{offer.type==='percent'?`${offer.value}% OFF`:`₹${offer.value} OFF`}{offer.minOrder?` · Min ₹${offer.minOrder}`:''}</small></div><Link to="/products">Use offer →</Link></section>}

    <nav className="top-deal-chips" aria-label="Deal categories">{rails.slice(0,7).map(r=><a key={r.key} href={`#deal-${r.key}`}>{r.icon} {r.title}</a>)}</nav>

    <div className="top-deal-rail-stack">{rails.map(rail=><section className="top-deal-rail" id={`deal-${rail.key}`} key={rail.key}>
      <header className="top-deal-rail-head"><div><small>{rail.eyebrow}</small><h2><span>{rail.icon}</span>{rail.title}</h2><p>{rail.subtitle}</p></div><Link to={rail.to}>View all →</Link></header>
      <div className="top-deal-track">{rail.items.map(p=><ProductCard key={`${rail.key}-${p._id}`} product={p}/>)}<Link className="top-deal-more-card" to={rail.to}><span>→</span><b>Explore more</b><small>{rail.title}</small></Link></div>
    </section>)}</div>

    <section className="top-deals-trust"><div><b>✓ Clear prices</b><span>MRP and current selling price shown before buying.</span></div><div><b>★ Store-picked badges</b><span>Marketing badges are controlled by SBN Kirana admin.</span></div><div><b>🔒 Stock stays private</b><span>Customers see availability, not internal inventory quantity.</span></div></section>
  </main>;
}

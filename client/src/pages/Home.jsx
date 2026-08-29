import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../api';
import ProductCard from '../components/ProductCard';
import {fallbackProducts} from '../data/fallbackProducts';
import '../home-promo-slider.css';

const categories=[['🌾','Staples'],['🥛','Dairy'],['🍪','Snacks'],['🥤','Beverages'],['🧼','Home Care'],['☕','Tea & Breakfast'],['🛒','Daily Essentials'],['📦','Bulk Orders']];
const visible=p=>p?.category!=='Fruits & Vegetables';
const unique=rows=>[...new Map(rows.filter(Boolean).map(p=>[String(p._id||p.name),p])).values()];

export default function Home(){
  const [products,setProducts]=useState(fallbackProducts.filter(visible));
  const [offers,setOffers]=useState([]);
  const [promoSlide,setPromoSlide]=useState(0);
  const [promoPaused,setPromoPaused]=useState(false);
  useEffect(()=>{
    api('/products').then(data=>{if(Array.isArray(data)&&data.length)setProducts(data.filter(visible))}).catch(()=>{});
    api('/offers').then(d=>setOffers(Array.isArray(d)?d:[])).catch(()=>{});
  },[]);
  const featuredOffer=offers.find(o=>o.featured)||offers[0];
  const dealProducts=useMemo(()=>[...products].sort((a,b)=>(b.featured?1:0)-(a.featured?1:0)||(b.discount||0)-(a.discount||0)||(a.price||0)-(b.price||0)).slice(0,8),[products]);
  const mobileShelves=useMemo(()=>{
    const all=unique(products);
    const discounted=[...all].sort((a,b)=>(b.discount||0)-(a.discount||0)||(b.featured?1:0)-(a.featured?1:0));
    const featured=[...all].sort((a,b)=>(b.featured?1:0)-(a.featured?1:0)||(b.discount||0)-(a.discount||0));
    const pick=(cats,offset=0)=>{
      const preferred=all.filter(p=>cats.includes(p.category));
      const rotated=[...all.slice(offset),...all.slice(0,offset)];
      return unique([...preferred,...rotated]).slice(0,10);
    };
    return [
      {key:'top',eyebrow:'FOR YOU',title:'Top picks for your basket',to:'/products',items:featured.slice(0,10)},
      {key:'deals',eyebrow:'SAVE MORE',title:'Best deals today',to:'/deals',items:discounted.slice(0,10)},
      {key:'daily',eyebrow:'EVERYDAY',title:'Daily essentials',to:'/products?search=Daily%20Essentials',items:pick(['Staples','Cooking','Household'],2)},
      {key:'staples',eyebrow:'PANTRY',title:'Staples & cooking',to:'/products?search=Staples',items:pick(['Staples','Cooking'],4)},
      {key:'dairy',eyebrow:'FRESH PICKS',title:'Dairy & breakfast',to:'/products?search=Dairy',items:pick(['Dairy','Tea & Breakfast'],6)},
      {key:'snacks',eyebrow:'CRAVINGS',title:'Snacks & beverages',to:'/products?search=Snacks',items:pick(['Snacks','Beverages'],8)},
      {key:'homecare',eyebrow:'HOME NEEDS',title:'Home & personal care',to:'/products?search=Home%20Care',items:pick(['Home Care','Personal Care','Baby Care'],1)}
    ].filter(s=>s.items.length);
  },[products]);
  const offerValue=featuredOffer?(featuredOffer.type==='percent'?`${featuredOffer.value}% OFF`:`₹${featuredOffer.value} OFF`):'BEST VALUE';
  const promoSlides=useMemo(()=>[
    {
      eyebrow:featuredOffer?'LIVE STORE OFFER':'SBN VALUE DROP',
      title:featuredOffer?.title||'Smart savings on everyday essentials',
      description:featuredOffer?.description||'Current catalogue prices, useful deals and quick shopping in one place.',
      cta:featuredOffer?.code?'Use this offer':'Shop best deals',
      to:'/products',tone:'lime',icon:'⚡',
      stat:offerValue,
      mini:featuredOffer?.code?`CODE ${featuredOffer.code}`:'LIVE PRICES',
      note:featuredOffer?.minOrder?`Min basket ₹${featuredOffer.minOrder}`:'Tap products to compare price'
    },
    {
      eyebrow:'FAST BASKET BUILDER',
      title:'Tap a product. See details. Buy with confidence.',
      description:'Best picks appear first so customers can explore price, images, reviews and offers before ordering.',
      cta:'Start shopping',to:'/products',tone:'orange',icon:'🛒',
      stat:`${products.length}+ PICKS`,mini:'READY TO EXPLORE',note:'Details before checkout'
    },
    {
      eyebrow:'SBN PAYLATER',
      title:'Approved credit for your daily essentials.',
      description:'Eligible customers can shop within their assigned limit and track outstanding dues clearly.',
      cta:'Explore PayLater',to:'/paylater',tone:'green',icon:'₹',
      stat:'PAY LATER',mini:'MANUAL APPROVAL',note:'Limit & due tracking in account'
    },
    {
      eyebrow:'BULK & BUSINESS',
      title:'Upload your list. Get one clear quotation.',
      description:'Perfect for homes, offices and larger requirements with item-wise rates and delivery tracking.',
      cta:'Request bulk quote',to:'/bulk-orders',tone:'blue',icon:'📋',
      stat:'BULK DEAL',mini:'QUOTATION',note:'List upload · rates · invoice'
    }
  ],[featuredOffer,offerValue,products.length]);
  useEffect(()=>{
    if(promoPaused||promoSlides.length<2)return;
    const timer=setInterval(()=>setPromoSlide(i=>(i+1)%promoSlides.length),5000);
    return()=>clearInterval(timer);
  },[promoPaused,promoSlides.length]);
  useEffect(()=>{if(promoSlide>=promoSlides.length)setPromoSlide(0)},[promoSlide,promoSlides.length]);
  const activePromo=promoSlides[promoSlide]||promoSlides[0];
  const movePromo=direction=>setPromoSlide(i=>(i+direction+promoSlides.length)%promoSlides.length);

  return <main className="market-home product-first-home">
    <section className="home-product-first">
      <div className="home-promo-shell" onMouseEnter={()=>setPromoPaused(true)} onMouseLeave={()=>setPromoPaused(false)}>
        <div className={`home-promo-slide tone-${activePromo.tone}`} key={`${promoSlide}-${activePromo.eyebrow}`}>
          <div className="home-promo-copy">
            <div className="home-promo-kicker"><span>{activePromo.icon}</span>{activePromo.eyebrow}</div>
            <h1>{activePromo.title}</h1>
            <p>{activePromo.description}</p>
            <div className="home-promo-actions"><Link to={activePromo.to}>{activePromo.cta} →</Link><span>✓ Quick shop&nbsp;&nbsp; ✓ Clear prices</span></div>
          </div>
          <div className="home-promo-visual" aria-hidden="true">
            <div className="promo-orbit orbit-one"></div><div className="promo-orbit orbit-two"></div>
            <div className="promo-stat-card"><small>{activePromo.mini}</small><strong>{activePromo.stat}</strong><span>{activePromo.note}</span></div>
            <div className="promo-floating-chip chip-a">★ Smart picks</div>
            <div className="promo-floating-chip chip-b">⚡ Fast action</div>
          </div>
        </div>
        <button type="button" className="home-promo-arrow prev" onClick={()=>movePromo(-1)} aria-label="Previous promotion">‹</button>
        <button type="button" className="home-promo-arrow next" onClick={()=>movePromo(1)} aria-label="Next promotion">›</button>
        <div className="home-promo-dots" aria-label="Promotion slides">{promoSlides.map((slide,index)=><button type="button" key={slide.eyebrow} className={index===promoSlide?'active':''} onClick={()=>setPromoSlide(index)} aria-label={`Show promotion ${index+1}`}><i></i></button>)}</div>
      </div>

      <div className="desktop-home-products"><div className="product-grid home-first-product-grid">{dealProducts.map(p=><ProductCard key={p._id} product={p}/>)}</div></div>
      <div className="mobile-home-shelves">{mobileShelves.map(s=><section className="mobile-product-shelf" key={s.key}><div className="mobile-shelf-head"><div><small>{s.eyebrow}</small><h2>{s.title}</h2></div><Link to={s.to}>View all →</Link></div><div className="mobile-product-rail">{s.items.map(p=><ProductCard key={`${s.key}-${p._id}`} product={p}/>)}<Link className="mobile-shelf-more" to={s.to}><b>More</b><span>→</span></Link></div></section>)}</div>
      <div className="home-first-footer"><span>✓ Current selling price</span><span>✓ Tap for full product details</span><span>✓ Stock managed securely by store</span><Link to="/products">View complete catalogue →</Link></div>
    </section>

    <section className="home-marketing-showcase">
      <Link to="/products" className="home-marketing-card orange"><span>★</span><small>QUICK SHOP</small><h2>Explore before you buy</h2><p>Tap any product for full images, price, ratings and buying options.</p><b>Shop products →</b></Link>
      <Link to="/paylater" className="home-marketing-card green"><span>₹</span><small>SBN PAYLATER</small><h2>Approved store credit</h2><p>Clear limits, due tracking and manual store approval.</p><b>View PayLater →</b></Link>
      <Link to="/bulk-orders" className="home-marketing-card blue"><span>📋</span><small>BULK & BUSINESS</small><h2>Upload a list. Get a quotation.</h2><p>Item-wise rates, payment, delivery and printable invoice.</p><b>Request quotation →</b></Link>
    </section>

    {featuredOffer&&<section className="live-offer-banner conversion-offer"><div><span>LIVE STORE OFFER</span><h2>{featuredOffer.title}</h2><p>{featuredOffer.description||`Use code ${featuredOffer.code} at checkout.`}</p></div><div className="live-offer-code"><small>COUPON CODE</small><b>{featuredOffer.code}</b><span>{featuredOffer.type==='percent'?`${featuredOffer.value}% OFF`:`₹${featuredOffer.value} OFF`}{featuredOffer.minOrder?` · Min ₹${featuredOffer.minOrder}`:''}</span></div><Link to="/products">Use this offer →</Link></section>}

    <section className="category-rail"><div className="rail-title"><div><small className="home-section-kicker">QUICK SHOP</small><h2>Shop what you need</h2></div><Link to="/products">View all →</Link></div><div className="rail-items">{categories.map(([icon,name])=>name==='Bulk Orders'?<Link to="/bulk-orders" key={name}><span>{icon}</span><b>{name}</b></Link>:<Link to={`/products?search=${encodeURIComponent(name)}`} key={name}><span>{icon}</span><b>{name}</b></Link>)}</div></section>

    <section className="conversion-proof-strip home-proof-lower"><div><b>⚡ Quick checkout</b><span>Buying options available on the product page</span></div><div><b>🚚 Local delivery</b><span>Delivery availability and charges shown at checkout</span></div><div><b>🔒 Clear payment</b><span>COD, UPI and approved PayLater options</span></div><div><b>📦 Bigger requirement?</b><span><Link to="/bulk-orders">Request a bulk quotation →</Link></span></div></section>

    <section className="deal-band conversion-deal-band"><div><span className="deal-icon">🔥</span><div><small>SMART SHOPPING</small><h2>Compare price, read product reviews and order with confidence.</h2></div></div><Link to="/products">Browse all products →</Link></section>

    <section className="why-order-grid"><article><span>01</span><div><b>Full product details</b><p>Open any product for description, price, images, savings, ratings and customer reviews.</p></div></article><article><span>02</span><div><b>Verified feedback</b><p>Customers can rate and suggest improvements after a delivered purchase.</p></div></article><article><span>03</span><div><b>Track after ordering</b><p>Orders, payment method and fulfilment stay visible in My Account.</p></div></article></section>

    <section className="service-cards"><div><span>🚚</span><b>Fast local fulfilment</b><p>Simple doorstep delivery for everyday orders.</p></div><div><span>💳</span><b>SBN PayLater</b><p>Store credit after manual approval from management.</p></div><div><span>📦</span><b>Bulk & business orders</b><p>Upload your list, receive item-wise quotation and track payment/delivery.</p><Link to="/bulk-orders">Request quotation →</Link></div><div><span>☎</span><b>Customer support</b><p>Get help for orders, payments, products and account queries.</p><Link to="/contact">Contact us →</Link></div></section>

    <section className="paylater-banner"><div><span>PAYLATER</span><h2>Keep essentials moving when you need flexibility.</h2><p>Approved customers can use an assigned SBN Kirana store-credit limit at checkout and track outstanding dues from their account.</p><Link to="/paylater">Open PayLater →</Link></div><div className="big-rupee">₹</div></section>
  </main>}

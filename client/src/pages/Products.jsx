import {useEffect,useMemo,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {api} from '../api';
import ProductCard from '../components/ProductCard';
import {filterFallbackProducts} from '../data/fallbackProducts';

const cats=['All','Staples','Dairy','Snacks','Beverages','Home Care'];
const visible=p=>p?.category!=='Fruits & Vegetables';
const preferredOrder=['Staples','Dairy','Snacks','Beverages','Home Care','Cooking','Tea & Breakfast','Daily Essentials'];

export default function Products(){
  const [params]=useSearchParams();
  const [products,setProducts]=useState([]);
  const [search,setSearch]=useState(params.get('search')||'');
  const [category,setCategory]=useState(params.get('category')||'All');
  const [loading,setLoading]=useState(true);
  const [offline,setOffline]=useState(false);

  useEffect(()=>{setSearch(params.get('search')||'');setCategory(params.get('category')||'All')},[params]);
  useEffect(()=>{
    let active=true;
    const q=new URLSearchParams();
    if(search)q.set('search',search);
    if(category!=='All')q.set('category',category);
    setLoading(true);setOffline(false);
    api(`/products?${q}`)
      .then(data=>{if(active)setProducts((Array.isArray(data)?data:[]).filter(visible))})
      .catch(()=>{if(active){setProducts(filterFallbackProducts(search,category).filter(visible));setOffline(true)}})
      .finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[search,category]);

  const mobileRails=useMemo(()=>{
    if(search.trim()||category!=='All'){
      return products.length?[{name:category!=='All'?category:`Results for “${search.trim()}”`,items:products}]:[];
    }
    const grouped=new Map();
    products.forEach(product=>{
      const key=String(product.category||'More').trim()||'More';
      if(!grouped.has(key))grouped.set(key,[]);
      grouped.get(key).push(product);
    });
    return [...grouped.entries()]
      .sort(([a],[b])=>{
        const ai=preferredOrder.indexOf(a),bi=preferredOrder.indexOf(b);
        if(ai===-1&&bi===-1)return a.localeCompare(b);
        if(ai===-1)return 1;if(bi===-1)return-1;return ai-bi;
      })
      .map(([name,items])=>({name,items}));
  },[products,search,category]);

  return <main className="section product-page-new">
    <style>{`
      .mobile-all-categories{display:none}
      @media(max-width:760px){
        .product-page-new>.desktop-catalog-view{display:none!important}
        .mobile-all-categories{display:block;margin:-18px -12px -28px;background:#f4f6f5;min-height:75vh;padding:12px 0 28px}
        .mobile-catalog-hero{margin:0 10px 10px;padding:17px;border-radius:18px;background:linear-gradient(135deg,#0e6d43,#1d955e);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:14px}
        .mobile-catalog-hero small{font-size:8px;font-weight:900;letter-spacing:1.3px;opacity:.8}.mobile-catalog-hero h1{font-size:25px;line-height:1.05;margin:4px 0}.mobile-catalog-hero p{font-size:9px;line-height:1.45;margin:0;opacity:.88}.mobile-catalog-hero>span{font-size:40px}
        .mobile-catalog-tools{background:#fff;padding:11px 10px 10px;margin-bottom:8px;border-top:1px solid #edf0ee;border-bottom:1px solid #e5e9e6}
        .mobile-catalog-tools input{width:100%;box-sizing:border-box;border:1px solid #dfe5e0;border-radius:12px;background:#f5f7f6;padding:12px 13px;font-size:12px;outline:none}.mobile-catalog-tools input:focus{border-color:#177245;box-shadow:0 0 0 3px rgba(23,114,69,.08);background:#fff}
        .mobile-catalog-chips{display:flex;gap:7px;overflow-x:auto;padding-top:9px;scrollbar-width:none}.mobile-catalog-chips::-webkit-scrollbar{display:none}.mobile-catalog-chips button{border:1px solid #dfe6e1;background:#fff;border-radius:999px;padding:7px 11px;font-size:9px;font-weight:800;white-space:nowrap;color:#435047}.mobile-catalog-chips button.active{background:#177245;color:#fff;border-color:#177245}
        .mobile-catalog-status{padding:8px 12px;font-size:9px;color:#6c7770;background:#fff;margin-bottom:8px}
        .mobile-category-section{background:#fff;margin:0 0 9px;padding:14px 0 12px;border-top:1px solid #edf0ee;border-bottom:1px solid #e5e9e6}
        .mobile-category-head{display:flex;align-items:flex-end;justify-content:space-between;padding:0 12px 10px}.mobile-category-head small{display:block;font-size:7px;color:#177245;font-weight:900;letter-spacing:1px}.mobile-category-head h2{font-size:19px;margin:2px 0 0;color:#17261e}.mobile-category-head>a{font-size:9px;font-weight:900;color:#177245;background:#edf8f1;border-radius:999px;padding:7px 9px}
        .mobile-category-rail{display:flex;gap:9px;overflow-x:auto;overflow-y:hidden;padding:0 12px 6px;scroll-snap-type:x mandatory;overscroll-behavior-inline:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none}.mobile-category-rail::-webkit-scrollbar{display:none}
        .mobile-category-rail>.product-card{flex:0 0 43vw;min-width:150px;max-width:184px;scroll-snap-align:start;border-radius:13px!important;overflow:hidden}.mobile-category-rail .product-image{height:122px!important}.mobile-category-rail .product-body{padding:9px!important}.mobile-category-rail .product-body h3{font-size:12px!important;line-height:1.25;min-height:30px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.mobile-category-rail .category{font-size:7px!important}.mobile-category-rail .unit{font-size:9px!important}.mobile-category-rail .price-row strong{font-size:16px!important}.mobile-category-rail .product-card-view{font-size:8px!important;margin-top:7px!important}.mobile-category-rail .stock-mini{font-size:7px!important}
        .mobile-catalog-empty{background:#fff;margin:10px;padding:38px 18px;border-radius:16px;text-align:center}.mobile-catalog-empty span{font-size:40px}.mobile-catalog-empty h2{font-size:20px;margin:9px 0 4px}.mobile-catalog-empty p{font-size:10px;color:#758079;margin:0}
      }
      @media(max-width:420px){.mobile-category-rail>.product-card{flex-basis:45vw;min-width:145px}.mobile-category-rail .product-image{height:116px!important}}
    `}</style>

    <div className="desktop-catalog-view">
      <div className="page-title"><span className="eyebrow">SBN MARKETPLACE</span><h1>Groceries & everyday essentials</h1><p>Search, compare prices and open any product for complete details.</p></div>
      <div className="shop-tools"><input placeholder="Search atta, milk, rice, snacks, home care..." value={search} onChange={e=>setSearch(e.target.value)}/><div className="chips">{cats.map(c=><button className={category===c?'active':''} onClick={()=>setCategory(c)} key={c}>{c}</button>)}</div></div>
      {loading&&<div className="empty">Loading products...</div>}
      {offline&&<div className="empty" style={{padding:'10px 0 20px'}}>Showing available catalogue while live inventory reconnects.</div>}
      <div className="product-grid">{products.map(p=><ProductCard key={p._id} product={p}/>)}</div>
      {!loading&&!products.length&&<div className="empty">No products found.</div>}
    </div>

    <div className="mobile-all-categories">
      <section className="mobile-catalog-hero"><div><small>SBN KIRANA · ALL CATEGORIES</small><h1>Shop more, swipe faster.</h1><p>Every category has its own product rail. Swipe each row independently.</p></div><span>🛒</span></section>
      <div className="mobile-catalog-tools">
        <input placeholder="Search atta, milk, rice, snacks..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="mobile-catalog-chips">{cats.map(c=><button className={category===c?'active':''} onClick={()=>setCategory(c)} key={c}>{c}</button>)}</div>
      </div>
      {loading&&<div className="mobile-catalog-status">Loading products...</div>}
      {offline&&<div className="mobile-catalog-status">Showing available catalogue while live inventory reconnects.</div>}
      {!loading&&mobileRails.map(rail=><section className="mobile-category-section" key={rail.name}>
        <div className="mobile-category-head"><div><small>{rail.items.length} PRODUCTS</small><h2>{rail.name}</h2></div>{category==='All'&&!search.trim()&&<Link to={`/products?category=${encodeURIComponent(rail.name)}`}>View all →</Link>}</div>
        <div className="mobile-category-rail">{rail.items.map(p=><ProductCard key={p._id} product={p}/>)}</div>
      </section>)}
      {!loading&&!mobileRails.length&&<div className="mobile-catalog-empty"><span>🔎</span><h2>No products found</h2><p>Try another search or category.</p></div>}
    </div>
  </main>;
}

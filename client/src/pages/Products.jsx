import {useEffect,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {api} from '../api';
import ProductCard from '../components/ProductCard';
import {filterFallbackProducts} from '../data/fallbackProducts';
const cats=['All','Staples','Dairy','Snacks','Beverages','Household'];
const visible=p=>p?.category!=='Fruits & Vegetables';
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

  return <main className="section product-page-new"><div className="page-title"><span className="eyebrow">SBN MARKETPLACE</span><h1>Groceries & everyday essentials</h1><p>Search, compare prices and choose Add to Cart or Buy Now.</p></div><div className="shop-tools"><input placeholder="Search atta, milk, rice, snacks, home care..." value={search} onChange={e=>setSearch(e.target.value)}/><div className="chips">{cats.map(c=><button className={category===c?'active':''} onClick={()=>setCategory(c)} key={c}>{c}</button>)}</div></div>{loading&&<div className="empty">Loading products...</div>}{offline&&<div className="empty" style={{padding:'10px 0 20px'}}>Showing available catalogue while live inventory reconnects.</div>}<div className="product-grid">{products.map(p=><ProductCard key={p._id} product={p}/>)}</div>{!loading&&!products.length&&<div className="empty">No products found.</div>}</main>}

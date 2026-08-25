import {useEffect,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {api} from '../api';
import ProductCard from '../components/ProductCard';
const cats=['All','Fruits & Vegetables','Staples','Dairy','Snacks','Beverages','Household'];
export default function Products(){
  const [params]=useSearchParams();
  const [products,setProducts]=useState([]);
  const [search,setSearch]=useState(params.get('search')||'');
  const [category,setCategory]=useState(params.get('category')||'All');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{setSearch(params.get('search')||'');setCategory(params.get('category')||'All')},[params]);
  useEffect(()=>{
    const q=new URLSearchParams();
    if(search)q.set('search',search);
    if(category!=='All')q.set('category',category);
    setLoading(true);setError('');
    api(`/products?${q}`)
      .then(setProducts)
      .catch(e=>{setProducts([]);setError(e.message||'Products load nahi ho pa rahe')})
      .finally(()=>setLoading(false));
  },[search,category]);

  return <main className="section product-page-new"><div className="page-title"><span className="eyebrow">SBN MARKETPLACE</span><h1>Groceries & everyday essentials</h1><p>Search, filter and build your basket in seconds.</p></div><div className="shop-tools"><input placeholder="Search atta, milk, rice, snacks..." value={search} onChange={e=>setSearch(e.target.value)}/><div className="chips">{cats.map(c=><button className={category===c?'active':''} onClick={()=>setCategory(c)} key={c}>{c}</button>)}</div></div>{loading&&<div className="empty">Loading products...</div>}{error&&<div className="empty">{error}</div>}<div className="product-grid">{products.map(p=><ProductCard key={p._id} product={p}/>)}</div>{!loading&&!error&&!products.length&&<div className="empty">No products found.</div>}</main>}

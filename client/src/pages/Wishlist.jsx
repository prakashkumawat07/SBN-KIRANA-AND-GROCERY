import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../api';
import ProductCard from '../components/ProductCard';
const WISH='sbn_wishlist';
export default function Wishlist(){const [items,setItems]=useState([]);const [loading,setLoading]=useState(true);useEffect(()=>{let ids=[];try{ids=JSON.parse(localStorage.getItem(WISH)||'[]')}catch{}Promise.all(ids.map(id=>api(`/products/${id}`).catch(()=>null))).then(list=>setItems(list.filter(Boolean))).finally(()=>setLoading(false))},[]);return <main className="section wishlist-page"><div className="page-title"><span className="eyebrow">SAVED FOR LATER</span><h1>My Wishlist</h1><p>Keep products handy and add them to your basket when you are ready.</p></div>{loading?<div className="loading">Loading wishlist...</div>:items.length?<div className="product-grid">{items.map(p=><ProductCard key={p._id} product={p}/>)}</div>:<div className="wishlist-empty"><span>♡</span><h2>No saved products yet</h2><p>Tap the heart on any product to save it here.</p><Link to="/products">Browse products →</Link></div>}</main>}

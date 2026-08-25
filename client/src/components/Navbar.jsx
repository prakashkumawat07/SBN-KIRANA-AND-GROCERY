import {useState} from 'react';
import {Link,NavLink,useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {useCart} from '../context/CartContext';

export default function Navbar(){
  const {user,logout}=useAuth();
  const {count}=useCart();
  const nav=useNavigate();
  const [query,setQuery]=useState('');
  function search(e){e.preventDefault();nav(`/products${query.trim()?`?search=${encodeURIComponent(query.trim())}`:''}`)}
  return <>
    <div className="offer-strip"><span>⚡ Fast local delivery</span><span>💳 SBN PayLater available for approved customers</span><span>🚚 Free delivery above ₹499</span></div>
    <header className="market-header">
      <Link className="market-logo" to="/"><img src="/sbn-kirana-logo.svg" alt="SBN Kirana"/></Link>
      <div className="delivery-location"><span>📍</span><div><small>Deliver to</small><b>Your neighbourhood</b></div></div>
      <form className="global-search" onSubmit={search}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search groceries, staples, dairy and more"/><button aria-label="Search">⌕</button></form>
      <div className="market-actions">
        {user?<div className="account-block"><small>Hello, {user.name?.split(' ')[0]}</small><b>My Account</b><button onClick={logout}>Logout</button></div>:<Link className="account-block" to="/login"><small>Hello, sign in</small><b>Account</b></Link>}
        {user&&<Link className="paylater-nav" to="/paylater"><span>₹</span><div><small>SBN</small><b>PayLater</b></div></Link>}
        <Link className="market-cart" to="/cart"><span>🛒</span><b>{count}</b></Link>
      </div>
    </header>
    <nav className="category-nav">
      <Link to="/products"><b>☰ All Categories</b></Link>
      <NavLink to="/products?category=Fruits%20%26%20Vegetables">Fresh</NavLink>
      <NavLink to="/products?category=Staples">Staples</NavLink>
      <NavLink to="/products?category=Dairy">Dairy</NavLink>
      <NavLink to="/products?category=Snacks">Snacks</NavLink>
      <NavLink to="/products?category=Household">Home Care</NavLink>
      <Link className="nav-deal" to="/paylater">PayLater</Link>
      <Link to="/contact">Customer Service</Link>
      {user&&<Link to="/orders">My Orders</Link>}
    </nav>
  </>
}

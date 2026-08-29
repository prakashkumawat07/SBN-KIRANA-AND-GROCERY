import {useState} from 'react';
import {Link,NavLink,useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {useCart} from '../context/CartContext';
import '../account.css';

export default function Navbar(){
  const {user,logout}=useAuth();
  const {count}=useCart();
  const nav=useNavigate();
  const [query,setQuery]=useState('');
  const [accountOpen,setAccountOpen]=useState(false);
  function search(e){e.preventDefault();nav(`/products${query.trim()?`?search=${encodeURIComponent(query.trim())}`:''}`)}
  function signOut(){setAccountOpen(false);logout();nav('/')}
  const closeAccount=()=>setAccountOpen(false);
  return <>
    <div className="offer-strip"><span>⚡ Fast local delivery</span><span>📦 Bulk quotation available</span><span>🚚 Free delivery above ₹499</span></div>
    <header className="market-header">
      <Link className="market-logo" to="/"><img src="/sbn-kirana-logo.svg" alt="SBN Kirana"/></Link>
      <div className="delivery-location"><span>📍</span><div><small>Deliver to</small><b>Your neighbourhood</b></div></div>
      <form className="global-search" onSubmit={search}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search groceries, staples, dairy and more"/><button aria-label="Search">⌕</button></form>
      <div className="market-actions">
        {user?<div className={`account-menu ${accountOpen?'open':''}`}>
          <button className="account-trigger" onClick={()=>setAccountOpen(v=>!v)} aria-expanded={accountOpen}>
            <span className="account-avatar">{user.name?.charAt(0)?.toUpperCase()||'U'}</span>
            <span className="account-trigger-copy"><small>Hello, {user.name?.split(' ')[0]}</small><b>My Account⌄</b></span>
          </button>
          {accountOpen&&<div className="account-dropdown">
            <div className="account-dropdown-head"><span>{user.name?.charAt(0)?.toUpperCase()||'U'}</span><div><b>{user.name}</b><small>{user.email}</small></div></div>
            <Link to="/account" onClick={closeAccount}><span>👤</span><div><b>My Account</b><small>Profile & account overview</small></div></Link>
            <Link to="/account#orders" onClick={closeAccount}><span>📦</span><div><b>Order Details</b><small>Track recent purchases</small></div></Link>
            <Link to="/bulk-orders" onClick={closeAccount}><span>📋</span><div><b>Bulk Orders</b><small>Lists, quotations & delivery</small></div></Link>
            <Link to="/wishlist" onClick={closeAccount}><span>♥</span><div><b>My Wishlist</b><small>Saved products</small></div></Link>
            <Link to="/account#paylater" onClick={closeAccount}><span>₹</span><div><b>PayLater</b><small>Outstanding & payment</small></div></Link>
            <Link to="/contact" onClick={closeAccount}><span>☎</span><div><b>Contact Us</b><small>Customer support</small></div></Link>
            <Link to="/info/about" onClick={closeAccount}><span>🏪</span><div><b>About Us</b><small>Know SBN Kirana</small></div></Link>
            <div className="account-dropdown-links"><Link to="/info/help" onClick={closeAccount}>Help Center</Link><Link to="/info/refund" onClick={closeAccount}>Refunds</Link></div>
            <button className="account-logout" onClick={signOut}>↪ Logout</button>
          </div>}
        </div>:<Link className="account-block" to="/login"><small>Hello, sign in</small><b>Account</b></Link>}
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
      <Link to="/bulk-orders">Bulk Orders</Link>
      <Link to="/contact">Customer Service</Link>
      <Link to="/wishlist">Wishlist</Link>
      {user&&<Link to="/account">My Account</Link>}
      {user&&<Link to="/orders">My Orders</Link>}
    </nav>
  </>
}

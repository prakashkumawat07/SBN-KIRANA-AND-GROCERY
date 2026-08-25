import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar(){
  const {user,logout}=useAuth();
  const {count}=useCart();
  return <>
    <div className="topbar"><span>⚡ Fresh groceries, fast delivery</span><span>Free delivery above ₹499</span><span>Support: 7 days a week</span></div>
    <header className="site-header">
      <Link className="brand brand-logo-link" to="/" aria-label="SBN Kirana home">
        <img className="brand-logo" src="/sbn-kirana-logo.svg" alt="SBN KIRANA" />
      </Link>
      <nav><NavLink to="/">Home</NavLink><NavLink to="/products">Shop</NavLink><NavLink to="/contact">Contact</NavLink>{user&&<NavLink to="/orders">Orders</NavLink>}</nav>
      <div className="actions">
        {user?<div className="user-menu"><span className="user-dot">{user.name?.[0]||'U'}</span><div><small>Welcome</small><b>{user.name?.split(' ')[0]}</b></div><button className="link-btn" onClick={logout}>Logout</button></div>:<Link className="login-link" to="/login">Login</Link>}
        <Link className="cart-link" to="/cart"><span>🛒</span><div><small>My cart</small><b>{count} item{count===1?'':'s'}</b></div></Link>
      </div>
    </header>
  </>
}

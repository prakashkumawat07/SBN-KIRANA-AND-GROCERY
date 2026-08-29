import {useEffect,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {api} from '../api';

const money=n=>`₹${Number(n||0).toLocaleString('en-IN')}`;
export default function MobileAccount(){
  const {user,logout}=useAuth();
  const nav=useNavigate();
  const [orders,setOrders]=useState([]);
  const [paylater,setPaylater]=useState(null);
  useEffect(()=>{
    api('/orders/mine').then(d=>setOrders(Array.isArray(d)?d:[])).catch(()=>{});
    api('/paylater').then(setPaylater).catch(()=>{});
  },[]);
  function signOut(){logout();nav('/')}
  const first=user?.name?.split(' ')[0]||'Customer';
  return <main className="mobile-account-view">
    <section className="mobile-account-profile">
      <div className="mobile-account-avatar">{user?.name?.charAt(0)?.toUpperCase()||'U'}</div>
      <div><small>SBN KIRANA CUSTOMER</small><h1>{user?.name||'My Account'}</h1><p>{user?.email}</p></div>
      <span className="mobile-account-badge">✓ Active</span>
    </section>

    <section className="mobile-account-balance">
      <div><small>HELLO, {first.toUpperCase()}</small><strong>{paylater?.status==='approved'?'PayLater active':'Shop smarter with SBN'}</strong><span>{paylater?.status==='approved'?`${money(paylater.used)} outstanding · ${money(paylater.available)} available`:'Orders, offers and support in one place'}</span></div>
      <Link to="/paylater">{paylater?.status==='approved'?'View PayLater':'Explore'} →</Link>
    </section>

    <section className="mobile-account-quick-grid">
      <Link to="/orders"><span>📦</span><b>Orders</b><small>{orders.length} total</small></Link>
      <Link to="/wishlist"><span>♡</span><b>Wishlist</b><small>Saved items</small></Link>
      <Link to="/deals"><span>🎁</span><b>Coupons</b><small>Offers & deals</small></Link>
      <Link to="/info/help"><span>🎧</span><b>Help Center</b><small>Get support</small></Link>
    </section>

    <section className="mobile-account-section">
      <h2>Finance Options</h2>
      <Link className="mobile-finance-row" to="/paylater"><span className="finance-icon">₹</span><div><b>SBN PayLater</b><small>{paylater?.status==='approved'?`${money(paylater.used)} outstanding · Pay now available`:'Apply for store credit'}</small></div><i>›</i></Link>
      <div className="mobile-finance-row coming"><span className="finance-icon">EMI</span><div><b>SBN EMI</b><small>Easy instalment payments</small></div><em>Coming Soon</em></div>
      <div className="mobile-finance-row coming"><span className="finance-icon">UPI</span><div><b>Finance on UPI</b><small>Flexible UPI finance options</small></div><em>Coming Soon</em></div>
    </section>

    <section className="mobile-account-section">
      <h2>More from SBN</h2>
      <Link className="mobile-account-list-row" to="/bulk-orders"><span>📋</span><div><b>Bulk Orders</b><small>Upload list, quotation & delivery</small></div><i>›</i></Link>
      <Link className="mobile-account-list-row" to="/contact"><span>☎</span><div><b>Customer Support</b><small>Order, payment and account help</small></div><i>›</i></Link>
      <Link className="mobile-account-list-row" to="/info/about"><span>🏪</span><div><b>About SBN Kirana</b><small>Store and service details</small></div><i>›</i></Link>
      <Link className="mobile-account-list-row" to="/info/recovery-policy"><span>₹</span><div><b>PayLater Policy</b><small>Payment and recovery information</small></div><i>›</i></Link>
    </section>
    <button className="mobile-account-logout" onClick={signOut}>Logout</button>
  </main>;
}

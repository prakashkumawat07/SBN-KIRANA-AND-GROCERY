import {Link,useLocation} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {useCart} from '../context/CartContext';

export default function MobileBottomNav(){
  const {pathname}=useLocation();
  const {user}=useAuth();
  const {count}=useCart();
  const items=[
    {to:'/',label:'Home',icon:'⌂',active:pathname==='/'},
    {to:'/deals',label:'Top Deals',icon:'％',active:pathname==='/deals'},
    {to:user?'/account':'/login',label:'Account',icon:'♙',active:['/account','/login','/register','/orders','/wishlist','/paylater'].some(p=>pathname.startsWith(p))},
    {to:'/cart',label:'Cart',icon:'🛒',active:pathname.startsWith('/cart')||pathname.startsWith('/checkout'),count}
  ];
  return <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
    {items.map(item=><Link key={item.label} to={item.to} className={item.active?'active':''}>
      <span className="mobile-nav-icon">{item.icon}{item.count>0&&<b>{item.count>99?'99+':item.count}</b>}</span>
      <small>{item.label}</small>
    </Link>)}
  </nav>;
}

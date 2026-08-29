import {useEffect} from 'react';
import {Routes,Route,useLocation} from 'react-router-dom';
import './marketplace.css';
import './recovery-policy.css';
import './growth.css';
import './bulk-orders.css';
import './conversion.css';
import './product-first-home.css';
import './review-notifications.css';
import './mobile-marketplace.css';
import './mobile-home-polish.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import MobileBottomNav from './components/MobileBottomNav';
import MobileAccount from './components/MobileAccount';
import MobileCart from './components/MobileCart';
import Home from './pages/Home';
import Products from './pages/Products';
import Deals from './pages/Deals';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import BulkOrders from './pages/BulkOrders';
import Account from './pages/Account';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import PayLater from './pages/PayLater';
import InfoPage from './pages/InfoPage';

function RouteAwareFooter(){
  const {pathname}=useLocation();
  return <div className={pathname==='/'?'route-footer route-footer-home':'route-footer route-footer-other'}><Footer/></div>;
}

function MobileHomeSwipe(){
  const {pathname}=useLocation();
  useEffect(()=>{
    if(pathname!=='/')return;
    const shell=document.querySelector('.home-promo-shell');
    if(!shell)return;
    let startX=0,startY=0;
    const onStart=e=>{const t=e.touches?.[0];if(t){startX=t.clientX;startY=t.clientY}};
    const onEnd=e=>{const t=e.changedTouches?.[0];if(!t)return;const dx=t.clientX-startX,dy=t.clientY-startY;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2){shell.querySelector(dx<0?'.home-promo-arrow.next':'.home-promo-arrow.prev')?.click()}};
    shell.addEventListener('touchstart',onStart,{passive:true});
    shell.addEventListener('touchend',onEnd,{passive:true});
    return()=>{shell.removeEventListener('touchstart',onStart);shell.removeEventListener('touchend',onEnd)};
  },[pathname]);
  return null;
}

export default function App(){return <><Navbar/><MobileHomeSwipe/><Routes>
  <Route path="/" element={<Home/>}/>
  <Route path="/products" element={<Products/>}/>
  <Route path="/deals" element={<Deals/>}/>
  <Route path="/product/:id" element={<ProductDetail/>}/>
  <Route path="/wishlist" element={<Wishlist/>}/>
  <Route path="/cart" element={<><div className="desktop-route-view"><Cart/></div><MobileCart/></>}/>
  <Route path="/checkout" element={<ProtectedRoute><Checkout/></ProtectedRoute>}/>
  <Route path="/account" element={<ProtectedRoute><><div className="desktop-route-view"><Account/></div><MobileAccount/></></ProtectedRoute>}/>
  <Route path="/orders" element={<ProtectedRoute><Orders/></ProtectedRoute>}/>
  <Route path="/bulk-orders" element={<ProtectedRoute><BulkOrders/></ProtectedRoute>}/>
  <Route path="/paylater" element={<ProtectedRoute><PayLater/></ProtectedRoute>}/>
  <Route path="/contact" element={<Contact/>}/>
  <Route path="/info/:slug" element={<InfoPage/>}/>
  <Route path="/login" element={<Login/>}/>
  <Route path="/register" element={<Register/>}/>
</Routes><RouteAwareFooter/><MobileBottomNav/></>}

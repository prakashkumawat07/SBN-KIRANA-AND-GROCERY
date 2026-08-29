import {Routes,Route} from 'react-router-dom';
import './marketplace.css';
import './recovery-policy.css';
import './growth.css';
import './bulk-orders.css';
import './conversion.css';
import './product-first-home.css';
import './review-notifications.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Products from './pages/Products';
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

export default function App(){return <><Navbar/><Routes><Route path="/" element={<Home/>}/><Route path="/products" element={<Products/>}/><Route path="/product/:id" element={<ProductDetail/>}/><Route path="/wishlist" element={<Wishlist/>}/><Route path="/cart" element={<Cart/>}/><Route path="/checkout" element={<ProtectedRoute><Checkout/></ProtectedRoute>}/><Route path="/account" element={<ProtectedRoute><Account/></ProtectedRoute>}/><Route path="/orders" element={<ProtectedRoute><Orders/></ProtectedRoute>}/><Route path="/bulk-orders" element={<ProtectedRoute><BulkOrders/></ProtectedRoute>}/><Route path="/paylater" element={<ProtectedRoute><PayLater/></ProtectedRoute>}/><Route path="/contact" element={<Contact/>}/><Route path="/info/:slug" element={<InfoPage/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/></Routes><Footer/></>}

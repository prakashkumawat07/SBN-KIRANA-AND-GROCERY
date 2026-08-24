import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App(){return <><Navbar/><Routes><Route path="/" element={<Home/>}/><Route path="/products" element={<Products/>}/><Route path="/cart" element={<Cart/>}/><Route path="/checkout" element={<ProtectedRoute><Checkout/></ProtectedRoute>}/><Route path="/orders" element={<ProtectedRoute><Orders/></ProtectedRoute>}/><Route path="/contact" element={<Contact/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/></Routes><footer>© 2026 SBN KIRANA AND GROCERY · Fresh • Fast • Reliable</footer></>}

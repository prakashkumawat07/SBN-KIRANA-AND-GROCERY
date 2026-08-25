import {Link} from 'react-router-dom';

export default function Footer(){
  const address=import.meta.env.VITE_STORE_ADDRESS||'Store address available through our Contact page';
  const phone=import.meta.env.VITE_STORE_PHONE||'Contact through website support';
  return <footer className="mega-footer">
    <div className="footer-news"><div><b>Save more with SBN Kirana</b><span>Fresh groceries, business supply and convenient local delivery.</span></div><Link to="/products">Start shopping →</Link></div>
    <div className="footer-grid">
      <div className="footer-brand"><img src="/sbn-kirana-logo.svg" alt="SBN Kirana"/><p>Your modern neighbourhood grocery store for fresh food, daily essentials and household needs.</p><div className="footer-contact"><span>📍 {address}</span><span>☎ {phone}</span><Link to="/contact">✉ Contact & support</Link></div></div>
      <div><h4>Company</h4><Link to="/info/about">About SBN</Link><Link to="/info/work-with-us">Work With Us</Link><Link to="/info/business">Business</Link><Link to="/info/dealers">Dealers & Suppliers</Link><Link to="/contact">Contact</Link></div>
      <div><h4>Customer Help</h4><Link to="/orders">Your Orders</Link><Link to="/paylater">SBN PayLater</Link><Link to="/info/shipping">Delivery Information</Link><Link to="/info/refund">Refund Policy</Link><Link to="/info/help">Help Center</Link></div>
      <div><h4>Policies</h4><Link to="/info/terms">Terms & Conditions</Link><Link to="/info/privacy">Privacy Policy</Link><Link to="/info/refund">Returns & Refunds</Link><Link to="/info/paylater-terms">PayLater Terms</Link><Link to="/info/responsible-credit">Responsible Credit</Link></div>
      <div><h4>Business Services</h4><Link to="/info/bulk-orders">Bulk Orders</Link><Link to="/info/dealers">Dealer Enquiries</Link><Link to="/info/suppliers">Become a Supplier</Link><Link to="/info/corporate">Corporate Supply</Link><Link to="/info/advertise">Advertise With Us</Link></div>
    </div>
    <div className="footer-bottom"><span>© 2026 SBN KIRANA. All rights reserved.</span><span>Secure shopping • Transparent pricing • Local service</span></div>
  </footer>
}

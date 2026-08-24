import {NavLink} from 'react-router-dom';
import {useAdminAuth} from '../context/AdminAuthContext';

export default function Layout({children}){
  const {admin,logout}=useAdminAuth();
  return <div className="admin-shell">
    <aside>
      <div className="admin-brand"><span>SBN</span><div><b>KIRANA ADMIN</b><small>Operations Console</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>
        <NavLink to="/"><span>◫</span>Dashboard</NavLink>
        <NavLink to="/products"><span>▣</span>Products</NavLink>
        <NavLink to="/orders"><span>▤</span>Orders</NavLink>
        <NavLink to="/customers"><span>♙</span>Customers</NavLink>
        <NavLink to="/messages"><span>✉</span>Messages</NavLink>
      </nav>
      <div className="store-status"><span className="status-dot"></span><div><b>Store online</b><small>All systems operational</small></div></div>
      <div className="admin-user"><div className="avatar">{admin?.name?.[0]||'A'}</div><div><b>{admin?.name}</b><span>{admin?.email}</span></div><button onClick={logout}>↗</button></div>
    </aside>
    <main>
      <header><div><small>SBN CONTROL CENTER</small><h2>Store Management</h2></div><div className="header-actions"><span className="live">● Live</span><div className="today">{new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div></div></header>
      <div className="admin-content">{children}</div>
    </main>
  </div>
}

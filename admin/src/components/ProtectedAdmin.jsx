import {Navigate} from 'react-router-dom';
import {useAdminAuth} from '../context/AdminAuthContext';

export default function ProtectedAdmin({children}){
  const {admin,checking}=useAdminAuth();
  if(checking)return <div className="loading">Checking secure admin session…</div>;
  return admin?.role==='admin'?children:<Navigate to="/login" replace/>;
}

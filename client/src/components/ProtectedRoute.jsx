import {Navigate,useLocation} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
export default function ProtectedRoute({children}){const {user}=useAuth();const location=useLocation();if(user)return children;const next=`${location.pathname}${location.search}${location.hash}`;return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace/>}

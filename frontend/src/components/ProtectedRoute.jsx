import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  console.log('ProtectedRoute user:', user);
  // Redirect users who are not signed in to the login page.
  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }

  // Restrict Admin only routes to Admin users
  if (adminOnly && user.role !== 'Admin') {
    return <Navigate to="/tasks" replace />;
  }
  return children;
};

export default ProtectedRoute;
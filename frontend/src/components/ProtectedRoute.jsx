import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // Redirect users who are not signed in to the login page.
  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
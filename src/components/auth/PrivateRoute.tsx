import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuth(); // Assuming `useAuth` provides `isAuthenticated` and `isInitialized`
    console.log('in private route, auth is: ', isAuthenticated);

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

export default PrivateRoute;

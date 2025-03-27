import AuthPage from './components/auth/AuthPage';
import Home from './components/Home';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocialProvider } from './contexts/SocialContext';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Incoming from './components/social/Incoming';
import Outgoing from './components/social/Outgoing';
import PrivateRoute from './components/auth/PrivateRoute';
import { Toaster } from 'sonner';
import { useEffect } from 'react';

function App() {
  return (
    <AuthProvider>
      <SocialProvider>
        <Toaster/>
        <Router>
        <AuthRedirect />
          <div className="flex">
            <Sidebar/>

            <div className="flex-1 p-6 bg-gray-100">
              <Routes>
                <Route path='/auth' element={<AuthPage/>} />
                <Route path='/' element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }/>
                <Route path='/incoming' element={
                  <PrivateRoute>
                    <Incoming />
                  </PrivateRoute>
                }/>
                <Route path='/outgoing' element={
                  <PrivateRoute>
                    <Outgoing />
                  </PrivateRoute>
                }/>
              </Routes>
            </div>
          </div>
        </Router>
      </SocialProvider>
    </AuthProvider>
  );
}

function AuthRedirect() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && location.pathname === '/auth') {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return null;
}

export default App;
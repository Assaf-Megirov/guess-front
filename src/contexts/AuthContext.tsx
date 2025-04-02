import React, { createContext, useContext, useState, useEffect } from 'react';
import { LoginData } from '../components/auth/Login';
import { RegisterData } from '../components/auth/Register';
import { login, register, logout, getGuestId } from '../api/auth';
import { User } from '../types/User';

interface FieldErrors {
  [key: string]: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  errors: FieldErrors | null;
  error: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  guestId: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      console.log('AuthContext: User authenticated from localStorage');
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if(isAuthenticated){
      console.log('AuthContext: User authenticated skipping guestId fetch');
      setGuestId(null);
      localStorage.removeItem('guestId');
      return;
    }
    const storedGuestId = localStorage.getItem('guestId');
    if(storedGuestId){
      setGuestId(storedGuestId);
      console.log('AuthContext: Guest ID fetched from localStorage', storedGuestId);
      return;
    }
    getGuestId().then((id: string) => {
      setGuestId(id);
      console.log('AuthContext: Guest ID fetched', id);
      localStorage.setItem('guestId', id);
    });
  }, [isAuthenticated]);

  const handleAuthResponse = (response: { token: string; user: User } | { errors: FieldErrors }) => {
    if('errors' in response){
      console.log('AuthContext: Error response received', response.errors);
      setErrors(response.errors);
      setError(null);
      return;
    }
    setToken(response.token);
    setUser(response.user);
    setErrors(null);
    setError(null);
    setIsAuthenticated(true);
    console.log('AuthContext: User authenticated successfully');
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
  };

  const handleAuthError = (error: any) => {
    if (error.response?.data?.errors) {
      setErrors(error.response.data.errors);
      setError(null);
    } else {
      setError(error.message || 'An unexpected error occurred. Please try again.');
      setErrors(null);
    }
  };

  const handleLogin = async (data: LoginData) => {
    try {
      setIsLoading(true);
      setErrors(null);
      setError(null);
      const response = await login(data);
      handleAuthResponse(response);
    } catch (error) {
      console.log('error logging in');
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setErrors(null);
      setError(null);
      const response = await register(data);
      handleAuthResponse(response);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setErrors(null);
      setError(null);
      if (token) {
        await logout(token);
      }
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        errors,
        error,
        isAuthenticated,
        guestId,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

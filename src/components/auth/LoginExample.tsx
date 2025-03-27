import React from 'react';
import Login, { LoginData } from './Login';

const LoginExample: React.FC = () => {
  const handleLogin = (data: LoginData) => {
    console.log('Login data:', data);
    // Here you would typically send the data to your backend API
    alert(`Login submitted for ${data.email} with Remember Me: ${data.rememberMe ? 'Yes' : 'No'}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
      <p className="text-center text-gray-600 mb-8">Please log in to your account</p>
      
      <div className="max-w-md mx-auto">
        <Login onSubmit={handleLogin} />
      </div>
      
      <div className="max-w-md mx-auto mt-4 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <a href="#" className="text-blue-600 hover:text-blue-500">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginExample; 
import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onSubmit?: (data: LoginData) => void;
  active?: boolean;
  className?: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login: React.FC<LoginProps> = ({ onSubmit, active }) => {
  const { login, errors, isLoading } = useAuth();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({});
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const validateField = (name: keyof LoginData, value: string) => {
    const newErrors: { [key: string]: string[] } = { ...validationErrors };
    
    switch (name) {
      case 'email':
        if (!value) {
          newErrors.email = ['Email is required'];
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = ['Please enter a valid email address'];
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = ['Password is required'];
        } else if (value.length < 6) {
          newErrors.password = ['Password must be at least 6 characters long'];
        } else {
          delete newErrors.password;
        }
        break;
    }
    
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name as keyof LoginData, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name as keyof LoginData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEmailValid = validateField('email', formData.email);
    const isPasswordValid = validateField('password', formData.password);
    if (isEmailValid && isPasswordValid) {
      try {
        await login(formData);
        onSubmit?.(formData);
      } catch (error) {
      }
    }
  };

  const getFieldErrors = (fieldName: string): string[] => {
    return [
      ...(validationErrors[fieldName] || []),
      ...(touched[fieldName as keyof typeof touched] ? [] : (errors?.[fieldName] || []))
    ];
  };

  useEffect(() => {
    setTouched(prev => ({ ...prev, email: false, password: false }));
  }, [errors]);

  useEffect(() => {
    if (active) {
      setTouched(prev => ({ ...prev, email: true, password: true }));
    }
  }, [active]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '24px',
        color: '#1f2937'
      }}>
        Log In
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="email" style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151'
        }}>
          Email
        </label>
        {getFieldErrors('email').length > 0 && (
          <div style={{ marginBottom: '4px' }}>
            {getFieldErrors('email').map((error, index) => (
              <div key={index} style={{
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '4px'
              }}>
                <span style={{ fontSize: '8px', flexShrink: 0, marginTop: '4px' }}>•</span>
                <span style={{ 
                  flex: '1 1 auto', 
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                  overflowWrap: 'break-word'
                }}>{error}</span>
              </div>
            ))}
          </div>
        )}
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: getFieldErrors('email').length > 0 ? '1px solid #ef4444' : '1px solid #d1d5db',
            fontSize: '14px',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          placeholder="Enter your email"
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="password" style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151'
        }}>
          Password
        </label>
        {getFieldErrors('password').length > 0 && (
          <div style={{ marginBottom: '4px' }}>
            {getFieldErrors('password').map((error, index) => (
              <div key={index} style={{
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '4px'
              }}>
                <span style={{ fontSize: '8px', flexShrink: 0, marginTop: '4px' }}>•</span>
                <span style={{ 
                  flex: '1 1 auto', 
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                  overflowWrap: 'break-word'
                }}>{error}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            style={{
              width: '100%',
              padding: '10px',
              paddingRight: '40px',
              borderRadius: '6px',
              border: getFieldErrors('password').length > 0 ? '1px solid #ef4444' : '1px solid #d1d5db',
              fontSize: '14px',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <input
          id="rememberMe"
          name="rememberMe"
          type="checkbox"
          checked={formData.rememberMe}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, rememberMe: e.target.checked }));
          }}
          style={{
            width: '16px',
            height: '16px',
            marginRight: '8px',
            borderRadius: '4px',
            border: '1px solid #d1d5db'
          }}
        />
        <label htmlFor="rememberMe" style={{
          fontSize: '14px',
          color: '#374151'
        }}>
          Remember me
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          transition: 'opacity 0.2s',
          boxSizing: 'border-box'
        }}
      >
        {isLoading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
};

export default Login;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterProps {
  onSubmit?: (data: RegisterData) => void;
  active?: boolean;
  className?: string;
}

const Register: React.FC<RegisterProps> = ({ onSubmit, active, className = '' }) => {
  const { register, errors, isLoading } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = (name: keyof RegisterData, value: string) => {
    const newErrors: { [key: string]: string[] } = { ...validationErrors };
    
    switch (name) {
      case 'username':
        if (!value) {
          newErrors.username = ['Username is required'];
        } else if (value.length < 3) {
          newErrors.username = ['Username must be at least 3 characters long'];
        } else {
          delete newErrors.username;
        }
        break;
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
        value = formData.confirmPassword;
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = ['Please confirm your password'];
        } else if (value !== formData.password) {
          newErrors.confirmPassword = ['Passwords do not match'];
        } else {
          delete newErrors.confirmPassword;
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
    validateField(name as keyof RegisterData, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name as keyof RegisterData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) {
      console.log('Preventing double submission');
      return;
    }
    
    const isUsernameValid = validateField('username', formData.username);
    const isEmailValid = validateField('email', formData.email);
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);
    
    if (isUsernameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      setIsSubmitting(true);
      try {
        await register(formData);
        if (!errors) {
          onSubmit?.(formData);
        }
      } catch (error) {
        console.error('Registration error:', error);
      } finally {
        setIsSubmitting(false);
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
    setTouched(prev => ({ 
      ...prev, 
      username: false,
      email: false, 
      password: false,
      confirmPassword: false 
    }));
  }, [errors]);

  useEffect(() => {
    if (active) {
      setTouched(prev => ({ 
        ...prev, 
        username: true,
        email: true,
        password: true,
        confirmPassword: true
      }));
    }
  }, [active]);

  return (
    <form onSubmit={handleSubmit} className={className} style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '24px',
        color: '#1f2937'
      }}>
        Create Account
      </h2>

      <div style={{ marginBottom: '20px', width: '100%' }}>
        <label htmlFor="username" style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151'
        }}>
          Username
        </label>
        {getFieldErrors('username').length > 0 && (
          <div style={{ marginBottom: '4px', width: '100%', wordWrap: 'break-word' }}>
            {getFieldErrors('username').map((error, index) => (
              <div key={index} style={{
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: '100%'
              }}>
                <span style={{ fontSize: '8px', flexShrink: 0 }}>•</span>
                <span style={{ flex: 1 }}>{error}</span>
              </div>
            ))}
          </div>
        )}
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: getFieldErrors('username').length > 0 ? '1px solid #ef4444' : '1px solid #d1d5db',
            fontSize: '14px',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          placeholder="Choose a username"
        />
      </div>

      <div style={{ marginBottom: '20px', width: '100%' }}>
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
          <div style={{ marginBottom: '4px', width: '100%', wordWrap: 'break-word' }}>
            {getFieldErrors('email').map((error, index) => (
              <div key={index} style={{
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: '100%'
              }}>
                <span style={{ fontSize: '8px', flexShrink: 0 }}>•</span>
                <span style={{ flex: 1 }}>{error}</span>
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

      <div style={{ marginBottom: '20px', width: '100%' }}>
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
          <div style={{ marginBottom: '4px', width: '100%', wordWrap: 'break-word' }}>
            {getFieldErrors('password').map((error, index) => (
              <div key={index} style={{
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: '100%'
              }}>
                <span style={{ fontSize: '8px', flexShrink: 0 }}>•</span>
                <span style={{ flex: 1 }}>{error}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ position: 'relative', width: '100%' }}>
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
            placeholder="Create a password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
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

      <div style={{ marginBottom: '20px', width: '100%' }}>
        <label htmlFor="confirmPassword" style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151'
        }}>
          Confirm Password
        </label>
        {getFieldErrors('confirmPassword').length > 0 && (
          <div style={{ marginBottom: '4px', width: '100%', wordWrap: 'break-word' }}>
            {getFieldErrors('confirmPassword').map((error, index) => (
              <div key={index} style={{
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: '100%'
              }}>
                <span style={{ fontSize: '8px', flexShrink: 0 }}>•</span>
                <span style={{ flex: 1 }}>{error}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            style={{
              width: '100%',
              padding: '10px',
              paddingRight: '40px',
              borderRadius: '6px',
              border: getFieldErrors('confirmPassword').length > 0 ? '1px solid #ef4444' : '1px solid #d1d5db',
              fontSize: '14px',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
            {showConfirmPassword ? (
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

      <button
        type="submit"
        disabled={isLoading || isSubmitting}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: (isLoading || isSubmitting) ? 'not-allowed' : 'pointer',
          opacity: (isLoading || isSubmitting) ? 0.7 : 1,
          transition: 'opacity 0.2s',
          boxSizing: 'border-box'
        }}
      >
        {(isLoading || isSubmitting) ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default Register;

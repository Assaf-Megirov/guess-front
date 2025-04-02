import React, { useState, useEffect } from 'react';
import Login, { LoginData } from './Login';
import Register, { RegisterData } from './Register';

interface AuthPageProps {
  onLoginSubmit?: (data: LoginData) => void;
  onRegisterSubmit?: (data: RegisterData) => void;
  printResults?: boolean;
  className?: string;
}

const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSubmit,
  onRegisterSubmit,
  printResults = false,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState<LoginData | RegisterData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [targetTab, setTargetTab] = useState<'login' | 'register'>('login');

  const handleLoginSubmit = (data: LoginData) => {
    setFormData(data);
    onLoginSubmit?.(data);
    if (printResults) {
      console.log('Login form data:', data);
    }
  };

  const handleRegisterSubmit = (data: RegisterData) => {
    setFormData(data);
    onRegisterSubmit?.(data);
    if (printResults) {
      console.log('Register form data:', data);
    }
  };

  const handleTabChange = (tab: 'login' | 'register') => {
    if (tab === activeTab || isAnimating) return;
    setTargetTab(tab);
    const newDirection = tab === 'register' ? 'left' : 'right';
    setSlideDirection(newDirection);
    setIsAnimating(true);
  };

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setActiveTab(targetTab);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, targetTab]);

  const getFormStyle = (formType: 'login' | 'register') => {
    const isActive = !isAnimating 
      ? formType === activeTab 
      : formType === targetTab;
    
    const isEntering = isAnimating && formType === targetTab;
    const isExiting = isAnimating && formType === activeTab;
    
    const enterFromLeft = { transform: 'translateX(-100%)' };
    const enterFromRight = { transform: 'translateX(100%)' };
    const exitToLeft = { transform: 'translateX(-100%)' };
    const exitToRight = { transform: 'translateX(100%)' };
    const centered = { transform: 'translateX(0)' };
    
    let initialPosition = centered;
    let finalPosition = centered;
    
    if (isAnimating) {
      if (isEntering) {
        initialPosition = slideDirection === 'left' ? enterFromRight : enterFromLeft;
        finalPosition = centered;
      } else if (isExiting) {
        initialPosition = centered;
        finalPosition = slideDirection === 'left' ? exitToLeft : exitToRight;
      }
    }
    
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: isActive || isAnimating ? 1 : 0,
      transform: isAnimating ? 
        (isEntering ? initialPosition.transform : finalPosition.transform) : 
        (isActive ? centered.transform : 'translateX(0)'),
      transition: 'all 0.3s ease-in-out',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: (!isAnimating && isActive) ? 'auto' : 'none',
      zIndex: isEntering ? 2 : 1
    };
  };

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      height: '600px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => handleTabChange('login')}
          style={{
            flex: '1',
            padding: '16px',
            textAlign: 'center',
            fontWeight: '500',
            backgroundColor: (isAnimating ? targetTab : activeTab) === 'login' ? 'white' : '#f3f4f6',
            color: (isAnimating ? targetTab : activeTab) === 'login' ? '#4f46e5' : '#1f2937',
            borderBottom: (isAnimating ? targetTab : activeTab) === 'login' ? '2px solid #4f46e5' : 'none',
            transition: 'all 0.2s'
          }}
          disabled={isAnimating}
        >
          Log In
        </button>
        <button
          onClick={() => handleTabChange('register')}
          style={{
            flex: '1',
            padding: '16px',
            textAlign: 'center',
            fontWeight: '500',
            backgroundColor: (isAnimating ? targetTab : activeTab) === 'register' ? 'white' : '#f3f4f6',
            color: (isAnimating ? targetTab : activeTab) === 'register' ? '#4f46e5' : '#1f2937',
            borderBottom: (isAnimating ? targetTab : activeTab) === 'register' ? '2px solid #4f46e5' : 'none',
            transition: 'all 0.2s'
          }}
          disabled={isAnimating}
        >
          Register
        </button>
      </div>

      <div style={{ 
        position: 'relative',
        flex: '1',
        overflow: 'hidden'
      }}>
        <div style={{
          ...getFormStyle('login'),
          pointerEvents: (isAnimating ? targetTab : activeTab) === 'login' ? 'auto' : 'none'
        }}>
          <Login onSubmit={handleLoginSubmit} active={activeTab === 'login'} />
        </div>
        
        <div style={{
          ...getFormStyle('register'), 
          pointerEvents: (isAnimating ? targetTab : activeTab) === 'register' ? 'auto' : 'none'
        }}>
          <Register onSubmit={handleRegisterSubmit} active={activeTab === 'register'} />
        </div>
      </div>

      <div style={{
        position: 'absolute',
        right: '24px',
        top: '24px',
        zIndex: 10
      }}>
      {printResults && formData && (
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px'
          }}>Form Submission Data:</h3>
          <pre style={{
            backgroundColor: '#f3f4f6',
            padding: '16px',
            borderRadius: '4px',
            fontSize: '14px',
            overflow: 'auto',
            maxHeight: '240px'
          }}>
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}
      </div>
    </div>
  );
};

export default AuthPage;
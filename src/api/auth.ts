import { LoginData } from '../components/auth/Login';
import { RegisterData } from '../components/auth/Register';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

const inFlightRequests = new Map<string, Promise<AuthResponse>>();

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  return response.json();
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const requestKey = `register_${data.email}_${data.username}`;
  if (inFlightRequests.has(requestKey)) {
    console.log('Duplicate registration request detected, returning existing promise');
    return inFlightRequests.get(requestKey)!;
  }
  const requestPromise = (async () => {
    try {
      console.log('Making registration request:', { email: data.email, username: data.username });
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const result = await response.json();
      console.log('Registration successful:', { email: data.email, username: data.username });
      return result;
    } finally {
      inFlightRequests.delete(requestKey);
    }
  })();
  inFlightRequests.set(requestKey, requestPromise);
  return requestPromise;
};

export const logout = async (token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }
}; 

export const getGuestId = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/guestId`);
  if (!response.ok) {
    throw new Error('Failed to get guest ID');
  }
  try {
    return (await response.json()).guestId;
  } catch (error) {
    throw new Error('Invalid guest ID response format');
  }
};

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      const userName = localStorage.getItem('userName');

      if (token && userId && userEmail) {
        setAuthState({
          user: {
            id: userId,
            email: userEmail,
            name: userName || ''
          },
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  };

  const login = (userData: { email: string; name: string; userId: string }) => {
    setAuthState({
      user: {
        id: userData.userId,
        email: userData.email,
        name: userData.name
      },
      isAuthenticated: true,
      isLoading: false
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const getCurrentUserId = (): string | null => {
    return authState.user?.id || null;
  };

  return {
    ...authState,
    login,
    logout,
    getCurrentUserId,
    checkAuthStatus
  };
};
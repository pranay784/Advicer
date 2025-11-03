import React, { useState, useEffect, useRef } from 'react';
import { Crown } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import AuthenticatedAppContent from './components/AuthenticatedAppContent';
import './styles/hunter-theme.css';

function App() {
  const { user, isAuthenticated, isLoading: authLoading, login, register } = useAuth();

  // Show login page if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="hunter-level-badge mx-auto mb-4 animate-pulse">
            <Crown className="w-8 h-8 text-current" />
          </div>
          <p className="text-yellow-400">Initializing Hunter System...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} onRegister={register} />;
  }
  
  // Once authenticated, render the main app content
  return <AuthenticatedAppContent user={user} />;
}

export default App;
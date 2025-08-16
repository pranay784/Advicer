import React, { useState, useEffect } from 'react';
import { Crown, Sword, Shield, Zap } from 'lucide-react';

interface SungJinWooAvatarProps {
  isTyping: boolean;
  isActive: boolean;
  message?: string;
}

const SungJinWooAvatar: React.FC<SungJinWooAvatarProps> = ({ isTyping, isActive, message }) => {
  const [currentExpression, setCurrentExpression] = useState<'neutral' | 'speaking' | 'thinking'>('neutral');
  const [shadowPulse, setShadowPulse] = useState(false);

  useEffect(() => {
    if (isTyping) {
      setCurrentExpression('thinking');
      setShadowPulse(true);
    } else if (isActive && message) {
      setCurrentExpression('speaking');
      setShadowPulse(false);
      // Return to neutral after speaking
      const timer = setTimeout(() => setCurrentExpression('neutral'), 2000);
      return () => clearTimeout(timer);
    } else {
      setCurrentExpression('neutral');
      setShadowPulse(false);
    }
  }, [isTyping, isActive, message]);

  return (
    <div className="relative">
      {/* Shadow Aura Effect */}
      <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
        shadowPulse ? 'animate-pulse bg-purple-500/20 scale-150' : 'bg-transparent scale-100'
      }`} />
      
      {/* Main Avatar Container */}
      <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 via-purple-900 to-black border-2 transition-all duration-300 ${
        isActive ? 'border-purple-400 shadow-lg shadow-purple-500/50' : 'border-purple-600/50'
      }`}>
        
        {/* Background Pattern */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-purple-900/50 to-black/80 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(147,51,234,0.3),transparent_50%)]" />
        </div>

        {/* Avatar Face/Silhouette */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden">
          {/* Crown Icon as Face Representation */}
          <Crown className={`w-8 h-8 text-purple-300 transition-all duration-300 ${
            currentExpression === 'speaking' ? 'scale-110 text-purple-200' : 
            currentExpression === 'thinking' ? 'animate-pulse text-purple-400' : 'text-purple-300'
          }`} />
          
          {/* Glowing Eyes Effect */}
          <div className="absolute top-3 left-4 w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
          <div className="absolute top-3 right-4 w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
        </div>

        {/* Power Level Indicators */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
          <Zap className="w-2 h-2 text-white" />
        </div>

        {/* Shadow Monarch Symbol */}
        <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
          <Sword className="w-2 h-2 text-white" />
        </div>

        {/* Status Ring */}
        <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
          isTyping ? 'border-purple-400 animate-spin' : 
          isActive ? 'border-purple-500' : 'border-transparent'
        }`} style={{ 
          borderStyle: 'dashed',
          animationDuration: isTyping ? '3s' : '0s'
        }} />
      </div>

      {/* Floating Shadow Particles */}
      {isActive && (
        <>
          <div className="absolute -top-2 -left-2 w-2 h-2 bg-purple-500/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="absolute -top-1 -right-3 w-1 h-1 bg-purple-400/80 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
          <div className="absolute -bottom-2 -right-1 w-2 h-2 bg-purple-600/50 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
        </>
      )}

      {/* Power Level Text */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/80 px-2 py-1 rounded text-xs text-purple-300 font-mono whitespace-nowrap">
          S-RANK
        </div>
      </div>
    </div>
  );
};

export default SungJinWooAvatar;
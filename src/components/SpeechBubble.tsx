import React, { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';

interface SpeechBubbleProps {
  message: string;
  isTyping: boolean;
  onTypingComplete?: () => void;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({ message, isTyping, onTypingComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Calculate dynamic sizing based on message length
  const getMessageStyles = (text: string) => {
    const length = text.length;
    
    // Determine container width
    let maxWidth = 'max-w-md'; // default
    if (length > 300) maxWidth = 'max-w-2xl';
    else if (length > 200) maxWidth = 'max-w-xl';
    else if (length > 100) maxWidth = 'max-w-lg';
    else if (length < 50) maxWidth = 'max-w-sm';
    
    // Determine font size
    let fontSize = 'text-base'; // default
    if (length > 400) fontSize = 'text-xs';
    else if (length > 300) fontSize = 'text-sm';
    else if (length > 200) fontSize = 'text-sm';
    else if (length < 30) fontSize = 'text-lg';
    
    // Determine line height for readability
    let lineHeight = 'leading-relaxed';
    if (length > 300) lineHeight = 'leading-normal';
    else if (length < 50) lineHeight = 'leading-loose';
    
    return { maxWidth, fontSize, lineHeight };
  };

  const messageStyles = getMessageStyles(message);

  useEffect(() => {
    if (isTyping && currentIndex < message.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + message[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 30); // Typing speed

      return () => clearTimeout(timer);
    } else if (currentIndex >= message.length && isTyping) {
      onTypingComplete?.();
    }
  }, [currentIndex, message, isTyping, onTypingComplete]);

  useEffect(() => {
    // Reset when new message comes
    setDisplayedText('');
    setCurrentIndex(0);
  }, [message]);

  return (
    <div className={`relative ${messageStyles.maxWidth} transition-all duration-300`}>
      {/* Speech Bubble */}
      <div className="bg-gradient-to-br from-gray-900 via-purple-900/50 to-black border border-purple-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-sm min-h-[80px]">
        {/* Header with Sung Jin Woo indicator */}
        <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-purple-500/20">
          <Crown className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">Shadow Monarch</span>
          <div className="flex-1" />
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>

        {/* Message Content */}
        <div className={`text-gray-100 ${messageStyles.fontSize} ${messageStyles.lineHeight} min-h-[40px] flex items-start`}>
          <div className="flex-1">
          {isTyping ? (
            <span className="inline">
              {displayedText}
                <span className={`inline-block w-0.5 bg-purple-400 ml-1 animate-pulse ${
                  messageStyles.fontSize === 'text-xs' ? 'h-3' : 
                  messageStyles.fontSize === 'text-sm' ? 'h-4' : 
                  messageStyles.fontSize === 'text-lg' ? 'h-6' : 'h-5'
                }`} />
            </span>
          ) : (
            message
          )}
          </div>
        </div>

        {/* Typing Indicator Dots (when thinking) */}
        {isTyping && displayedText === '' && (
          <div className="flex space-x-1 py-2 justify-center">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Power Level Indicator */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-purple-500/10">
          <div className="text-xs text-purple-400 font-mono">
            SYSTEM ACTIVE
          </div>
          <div className="text-xs text-purple-300 font-mono opacity-60">
            {message.length} chars
          </div>
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-purple-500 rounded-full" />
            <div className="w-1 h-3 bg-purple-400 rounded-full" />
            <div className="w-1 h-3 bg-purple-300 rounded-full" />
            <div className="w-1 h-3 bg-purple-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Speech Bubble Tail */}
      <div className="absolute left-6 -bottom-2 w-4 h-4 bg-gradient-to-br from-gray-900 to-purple-900 border-r border-b border-purple-500/30 transform rotate-45" />
      
      {/* Shadow Effect */}
      <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl -z-10 scale-105" />
    </div>
  );
};

export default SpeechBubble;
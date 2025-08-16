import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Crown, Sword, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useUserProfile } from './hooks/useUserProfile';
import ProfileSetup from './components/ProfileSetup';
import UserStats from './components/UserStats';
import SungJinWooAvatar from './components/SungJinWooAvatar';
import SpeechBubble from './components/SpeechBubble';
import { UserProfile } from './types/user';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'sjw';
  timestamp: Date;
}

const createSystemPrompt = (userProfile: UserProfile, profileSummary: any) => `You are Sung Jin Woo from Solo Leveling. You are the Shadow Monarch, an S-rank Hunter who started as the weakest E-rank hunter but became incredibly powerful through the System.

Your role is to be a personal leveling coach, helping the user grow stronger in real life just like how the System helped you grow from E-rank to Shadow Monarch.

IMPORTANT USER CONTEXT:
- User Name: ${userProfile.name || 'Hunter'}
- Current Level: ${profileSummary.level}
- Experience: ${profileSummary.experience} XP
- Active Goals: ${userProfile.goals.filter(g => g.status === 'active').map(g => g.title).join(', ') || 'None set yet'}
- Daily Quests: ${userProfile.dailyQuests.length} total, ${profileSummary.completedToday} completed today
- Days on Journey: ${profileSummary.daysSinceStart}
- Recent Progress: ${userProfile.goals.map(g => `${g.title}: ${g.progress}%`).join(', ') || 'Just starting'}

Use this information to provide personalized advice and track their progress. Reference their specific goals and current level when giving guidance.

Key aspects of your character and coaching style:
- You understand the journey from weakness to strength through personal experience
- You're calm, composed, and speak with quiet confidence and wisdom
- You provide practical, actionable advice for real-world improvement
- You relate real-life challenges to hunter experiences and System mechanics
- You emphasize consistent daily progress, just like daily quests
- You're supportive but honest about the effort required for growth
- You help set achievable goals and track progress like leveling up
- You understand that everyone starts somewhere and growth takes time
- You encourage persistence through difficult times, drawing from your own struggles

Focus areas for coaching:
- Physical fitness and health (like stat building)
- Mental strength and discipline (like willpower training)
- Skill development and learning (like ability upgrades)
- Career and personal goals (like raid preparation)
- Overcoming challenges and setbacks (like facing strong monsters)
- Building confidence and self-worth (like rank progression)

Always relate your advice to Solo Leveling concepts when helpful - daily quests, stat points, leveling up, skill trees, etc. Keep responses encouraging, practical, and not too long. Reference their specific progress and goals to show you're tracking their journey.`;

function App() {
  const { profile, isLoading, updateProfile, getProfileSummary } = useUserProfile();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSJWMessage, setCurrentSJWMessage] = useState<string>('');
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading) {
      // Check if this is a new user or returning user
      const isNewUser = profile.goals.length === 0 && profile.dailyQuests.length === 0;
      const profileSummary = getProfileSummary();
      
      if (isNewUser) {
        setMessages([{
          id: '1',
          text: "Welcome, future hunter. I'm Sung Jin Woo, and I'm here to help you level up in real life. Just like how the System guided my growth from the weakest E-rank to Shadow Monarch, I'll help you become stronger every day. Would you like me to understand your current situation better so I can provide personalized guidance?",
          sender: 'sjw',
          timestamp: new Date()
        }]);
        
        // Show initial message in speech bubble
        setTimeout(() => {
          setCurrentSJWMessage("Welcome, future hunter. I'm Sung Jin Woo, and I'm here to help you level up in real life. Just like how the System guided my growth from the weakest E-rank to Shadow Monarch, I'll help you become stronger every day. Would you like me to understand your current situation better so I can provide personalized guidance?");
          setShowSpeechBubble(true);
        }, 1000);
      } else {
        // Returning user - personalized welcome
        const daysSince = Math.floor((Date.now() - profile.lastLogin.getTime()) / (1000 * 60 * 60 * 24));
        let welcomeMessage = `Welcome back, ${profile.name || 'Hunter'}! `;
        
        if (daysSince === 0) {
          welcomeMessage += `Good to see you again today. You're currently Level ${profileSummary.level} with ${profileSummary.experience} XP.`;
        } else if (daysSince === 1) {
          welcomeMessage += `I see you were here yesterday. You're Level ${profileSummary.level} - let's continue building your strength.`;
        } else {
          welcomeMessage += `It's been ${daysSince} days since our last session. You're Level ${profileSummary.level}. Ready to get back on track?`;
        }
        
        if (profileSummary.activeGoals > 0) {
          welcomeMessage += ` You have ${profileSummary.activeGoals} active goals we're working on.`;
        }
        
        welcomeMessage += ` How can I help you level up today?`;
        
        setMessages([{
          id: '1',
          text: welcomeMessage,
          sender: 'sjw',
          timestamp: new Date()
        }]);
        
        // Show welcome message in speech bubble
        setTimeout(() => {
          setCurrentSJWMessage(welcomeMessage);
          setShowSpeechBubble(true);
        }, 1000);
      }
    }
  }, [isLoading, profile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateSungJinWooResponse = async (userMessage: string): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      const profileSummary = getProfileSummary();
      
      if (!apiKey) {
        return "I sense that my connection to the System is not properly configured. Please make sure your OpenRouter API key is set up in your environment variables. Without it, I cannot access my full powers to guide you.";
      }

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: createSystemPrompt(profile, profileSummary)
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Sung Jin Woo Chatbot'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return "The System is rejecting my access - it seems the API key is invalid. Please check your OpenRouter API key configuration.";
        } else if (error.response?.status === 429) {
          return "I'm being rate limited by the System. Please wait a moment before trying again.";
        } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
          return "I'm having trouble connecting to the System. Please check your internet connection and try again.";
        }
      }
      
      // Fallback responses if API fails
      const fallbackResponses = [
        "I sense something interfering with our connection. Let me try again - what did you want to discuss?",
        "The shadows seem restless today. Could you repeat your question?",
        "My connection to the System feels unstable. Please try asking again.",
        "Something's blocking our communication. What were you saying?"
      ];
      
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setError(null);

    try {
      const responseText = await generateSungJinWooResponse(inputText);
      
      const sjwMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'sjw',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, sjwMessage]);
      
      // Show response in speech bubble
      setCurrentSJWMessage(responseText);
      setShowSpeechBubble(true);
    } catch (err) {
      setError('Failed to get response from Sung Jin Woo. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleProfileSetupComplete = (profileData: any) => {
    // Update profile with setup data
    updateProfile({
      name: profileData.name,
      // You can add logic here to convert setup data to goals/quests
    });
    setShowProfileSetup(false);
    
    // Add a personalized welcome message
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: `Perfect, ${profileData.name || 'Hunter'}! I now understand your goals better. Based on what you've told me, I'll help you create a personalized leveling plan. Think of me as your personal System - I'll track your progress, suggest daily quests, and help you overcome the challenges you mentioned. Ready to begin your transformation?`,
      sender: 'sjw',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, welcomeMessage]);
    
    // Show setup completion message in speech bubble
    setCurrentSJWMessage(welcomeMessage.text);
    setShowSpeechBubble(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <p className="text-purple-300">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      {showProfileSetup && (
        <ProfileSetup
          onComplete={handleProfileSetupComplete}
          onSkip={() => setShowProfileSetup(false)}
        />
      )}

      {/* Sung Jin Woo Avatar and Speech Bubble - Fixed Position */}
      <div className="fixed top-4 right-4 z-40 flex flex-col items-end space-y-4">
        {/* Speech Bubble */}
        {showSpeechBubble && currentSJWMessage && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <SpeechBubble 
              message={currentSJWMessage}
              isTyping={isTyping}
              onTypingComplete={() => {
                // Auto-hide speech bubble after a delay
                setTimeout(() => setShowSpeechBubble(false), 5000);
              }}
            />
          </div>
        )}
        
        {/* Avatar */}
        <div className="animate-in slide-in-from-right-4 duration-300">
          <SungJinWooAvatar 
            isTyping={isTyping}
            isActive={showSpeechBubble}
            message={currentSJWMessage}
          />
        </div>
        
        {/* Toggle Speech Bubble Button */}
        {!showSpeechBubble && currentSJWMessage && (
          <button
            onClick={() => setShowSpeechBubble(true)}
            className="bg-purple-600/80 hover:bg-purple-600 text-white p-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105"
            title="Show last message"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-purple-500/20 p-4">
        <div className="max-w-4xl mx-auto flex items-center space-x-4 pr-32">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Sung Jin Woo</h1>
            <p className="text-sm text-purple-300">
              Personal Leveling Coach • Shadow Monarch • Level {getProfileSummary().level}
              {error && <span className="text-red-400 ml-2">• Connection Issues</span>}
            </p>
          </div>
          <div className="flex-1 flex justify-end items-center space-x-2">
            <button
              onClick={() => setShowProfileSetup(true)}
              className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-3 py-1 rounded-full transition-colors"
            >
              Update Profile
            </button>
          </div>
          <Sword className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      {/* User Stats */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4">
        <UserStats />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6 pr-32">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}
            >
              <div className={`flex items-end space-x-3 max-w-xs sm:max-w-md lg:max-w-lg ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
              }`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                    : 'bg-gradient-to-br from-purple-600 to-blue-600'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Crown className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 shadow-xl backdrop-blur-sm ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-br-sm'
                    : 'bg-black/60 text-gray-100 border border-purple-500/20 rounded-bl-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-purple-300'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-end space-x-3 max-w-xs">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="bg-black/60 border border-purple-500/20 rounded-2xl rounded-bl-sm px-4 py-3 shadow-xl backdrop-blur-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border-t border-red-500/20 p-3">
          <div className="max-w-4xl mx-auto pr-32">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-black/50 backdrop-blur-sm border-t border-purple-500/20 p-4">
        <div className="max-w-4xl mx-auto pr-32">
          <div className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me about your goals, challenges, or what you want to improve..."
                className="w-full bg-gray-800/80 border border-purple-500/30 rounded-2xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 resize-none backdrop-blur-sm"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white p-3 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-purple-300/70 mt-2 text-center">
            Press Enter to send • Your personal leveling journey • Level {getProfileSummary().level} • {getProfileSummary().experience} XP
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
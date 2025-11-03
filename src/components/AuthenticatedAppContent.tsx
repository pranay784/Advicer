import React, { useState, useEffect } from 'react';
import { Send, Crown, Sword, MessageCircle, Home, Target, User, Trophy } from 'lucide-react';
import axios from 'axios';
import { useUserProfile } from '../hooks/useUserProfile';
import ProfileSetup from './ProfileSetup';
import HunterDashboard from './HunterDashboard';
import QuestInterface from './QuestInterface';
import HunterProfile from './HunterProfile';
import { UserProfile } from '../types/user';

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

CRITICAL GOAL CREATION: When suggesting goals, use these EXACT phrases:
- "I suggest you work on [specific goal]."
- "You should focus on [specific goal]."
- "Try to [specific goal]."
- "My goal for you is [specific goal]."

CRITICAL QUEST CREATION: For daily habits, use these EXACT phrases:
- "Daily habit: [specific daily task]."
- "Do this every day: [specific task]."
- "Make it a habit: [specific action]."

Examples:
- "I suggest you work on reading one book per month."
- "You should focus on exercising 30 minutes daily."
- "Daily habit: Do 20 push-ups every morning."
- "Make it a habit: meditate for 10 minutes before bed."

The system automatically extracts these phrases and creates goals/quests. Be specific and actionable.

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

interface AuthenticatedAppContentProps {
  user: any;
}

function AuthenticatedAppContent({ user }: AuthenticatedAppContentProps) {
  const { profile, isLoading, authLoading, session, error: profileError, updateProfile, getProfileSummary, saveConversation, addExperience, addGoal, addDailyQuest, loadProfile } = useUserProfile(user);
  const [currentView, setCurrentView] = useState<'dashboard' | 'quests' | 'profile' | 'chat'>('dashboard');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [currentSJWMessage, setCurrentSJWMessage] = useState('');
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [inputText, setInputText] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !authLoading && session) {
      // Check if this is a new user or returning user
      const isNewUser = profile.goals.length === 0 && profile.dailyQuests.length === 0;
      const profileSummary = getProfileSummary();
      
      if (isNewUser) {
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
        
        // Show welcome message in speech bubble
        setTimeout(() => {
          setCurrentSJWMessage(welcomeMessage);
          setShowSpeechBubble(true);
        }, 1000);
      }
    }
  }, [isLoading, authLoading, session, profile]);

  // Helper function to process AI responses and extract actions
  const processAIResponse = async (responseText: string) => {
    console.log('🔍 PROCESSING AI RESPONSE:', responseText);
    
    try {
      // Check for experience rewards in the response
      const expMatch = responseText.match(/\+(\d+)\s*XP/i);
      if (expMatch) {
        const expAmount = parseInt(expMatch[1]);
        console.log('💰 Found XP reward in response:', expAmount);
        await addExperience(expAmount);
      }
      
      // Extract goals from AI response
      console.log('🎯 Starting goal extraction...');
      await extractAndCreateGoals(responseText);
      
      // Extract daily quests from AI response
      console.log('⚡ Starting quest extraction...');
      await extractAndCreateQuests(responseText);
      
      // Award XP for having a conversation (small reward)
      console.log('💫 Awarding conversation XP...');
      await addExperience(5);
      
    } catch (error) {
      console.error('Error processing AI response:', error);
    }
    
    // Reload profile to ensure UI is updated
    console.log('🔄 Reloading profile...');
    await loadProfile();
  };

  // Extract and create goals from AI response
  const extractAndCreateGoals = async (responseText: string) => {
    console.log('🎯 EXTRACTING GOALS FROM:', responseText);
    
    const goalPatterns = [
      // Simple and direct patterns
      /(?:goal|suggest|should|try to|work on|focus on|aim to|improve|develop|build|strengthen)[:\s]+([^.!?]{10,100})[.!?]/gi,
      /(?:let's|you need to|you could|consider|start)[:\s]+([^.!?]{10,80})[.!?]/gi,
      /(?:I recommend|my advice is)[:\s]+([^.!?]{10,80})[.!?]/gi,
    ];

    const categoryKeywords = {
      fitness: ['exercise', 'workout', 'physical', 'strength', 'cardio', 'gym', 'run', 'walk', 'health', 'body'],
      career: ['work', 'job', 'career', 'professional', 'skill', 'promotion', 'business', 'income', 'networking'],
      skills: ['learn', 'study', 'skill', 'knowledge', 'course', 'practice', 'master', 'develop', 'improve'],
      mental: ['mental', 'mindset', 'confidence', 'stress', 'anxiety', 'meditation', 'focus', 'discipline'],
      social: ['social', 'relationship', 'communication', 'friends', 'family', 'networking', 'people'],
      other: []
    };

    console.log('🔍 Using patterns to find goals...');

    for (const pattern of goalPatterns) {
      let match;
      while ((match = pattern.exec(responseText)) !== null) {
        const goalText = match[1]?.trim();
        console.log('🎯 Found potential goal:', goalText);
        
        if (goalText && goalText.length > 5 && goalText.length < 100) {
          // Determine category based on keywords
          let category: 'fitness' | 'career' | 'skills' | 'mental' | 'social' | 'other' = 'other';
          const lowerGoalText = goalText.toLowerCase();
          
          for (const [cat, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => lowerGoalText.includes(keyword))) {
              category = cat as any;
              break;
            }
          }

          // Check if similar goal already exists
          const existingGoal = profile.goals.find(g => 
            g.title.toLowerCase().includes(goalText.toLowerCase().substring(0, 20)) ||
            goalText.toLowerCase().includes(g.title.toLowerCase().substring(0, 20))
          );

          if (!existingGoal) {
            console.log('✅ Creating new goal:', goalText, 'Category:', category);
            await addGoal({
              title: goalText.charAt(0).toUpperCase() + goalText.slice(1),
              description: `Goal suggested by Sung Jin Woo during our conversation`,
              category,
              progress: 0,
              status: 'active'
            });
            
            // Award XP for setting a new goal
            setTimeout(() => addExperience(15), 1000);
          } else {
            console.log('⚠️ Similar goal already exists:', existingGoal.title);
          }
        }
      }
    }
  };

  // Extract and create daily quests from AI response
  const extractAndCreateQuests = async (responseText: string) => {
    console.log('⚡ EXTRACTING QUESTS FROM:', responseText);
    
    const questPatterns = [
      /(?:daily|every day|each day|habit)[:\s]+([^.!?]{10,80})[.!?]/gi,
      /(?:do this|make it a|try to do)[:\s]+([^.!?]{10,80})[.!?]/gi,
    ];

    console.log('🔍 Using patterns to find quests...');

    for (const pattern of questPatterns) {
      let match;
      while ((match = pattern.exec(responseText)) !== null) {
        const questText = match[1]?.trim();
        console.log('⚡ Found potential quest:', questText);
        
        if (questText && questText.length > 5 && questText.length < 80) {
          // Check if similar quest already exists
          const existingQuest = profile.dailyQuests.find(q => 
            q.title.toLowerCase().includes(questText.toLowerCase().substring(0, 15)) ||
            questText.toLowerCase().includes(q.title.toLowerCase().substring(0, 15))
          );

          if (!existingQuest) {
            console.log('✅ Creating new quest:', questText);
            await addDailyQuest({
              title: questText.charAt(0).toUpperCase() + questText.slice(1),
              description: `Daily quest suggested by Sung Jin Woo`,
              category: 'general',
              difficulty: 'medium',
              experienceReward: 20
            });
          } else {
            console.log('⚠️ Similar quest already exists:', existingQuest.title);
          }
        }
      }
    }
  };

  const generateSungJinWooResponse = async (userMessage: string): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      const profileSummary = getProfileSummary();
      
      console.log('🔑 API Key exists:', !!apiKey);
      console.log('📤 Making OpenRouter API call...');
      
      if (!apiKey) {
        console.error('❌ No API key found');
        return "I sense that my connection to the System is not properly configured. Please make sure your OpenRouter API key is set up in your .env file as VITE_OPENROUTER_API_KEY=your_key_here";
      }

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-3.5-sonnet:beta',
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
          max_tokens: 300,
          temperature: 0.8,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://bolt.new',
            'X-Title': 'Sung Jin Woo Leveling Coach'
          }
        }
      );

      console.log('✅ OpenRouter API response received:', response.data);
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      console.error('Full error details:', error.response?.data);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          console.error('❌ 401 Unauthorized - Invalid API key');
          return "The System is rejecting my access - your OpenRouter API key appears to be invalid. Please check your .env file and make sure VITE_OPENROUTER_API_KEY is set correctly.";
        } else if (error.response?.status === 429) {
          console.error('❌ 429 Rate Limited');
          return "I'm being rate limited by the System. Please wait a moment before trying again.";
        } else if (error.response?.status === 402) {
          console.error('❌ 402 Payment Required - No credits');
          return "The System requires payment - your OpenRouter account appears to be out of credits. Please add credits to your OpenRouter account.";
        } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
          console.error('❌ Network error');
          return "I'm having trouble connecting to the System. Please check your internet connection and try again.";
        } else {
          console.error('❌ Other API error:', error.response?.status, error.response?.data);
          return `The System encountered an error (${error.response?.status}). Please try again or check your OpenRouter account.`;
        }
      }
      
      // Fallback responses if API fails
      const fallbackResponses = [
        "I sense something interfering with our connection to the System. The OpenRouter API might be having issues - please try again.",
        "The shadows seem restless today. There's a problem with the API connection - could you repeat your question?",
        "My connection to the System feels unstable. Please check your API key and try asking again."
      ];
      
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Check authentication before sending message
    if (!session?.user) {
      setError('Please log in to chat with Sung Jin Woo');
      return;
    }

    console.log('📤 SENDING MESSAGE:', inputText);
    console.log('🔍 Checking API key...', !!import.meta.env.VITE_OPENROUTER_API_KEY);
    const userMessage = inputText;
    setLastUserMessage(userMessage);
    setInputText('');
    setIsTyping(true);
    setError(null);

    try {
      console.log('🤖 Calling OpenRouter API...');
      const responseText = await generateSungJinWooResponse(userMessage);
      console.log('📥 RECEIVED RESPONSE:', responseText);
      
      // Show response in speech bubble
      setCurrentSJWMessage(responseText);
      setShowSpeechBubble(true);
      
      // Save conversation to backend
      await saveConversation(userMessage, responseText);
      
      console.log('🔄 PROCESSING RESPONSE FOR ACTIONS...');
      // Process the AI response for any actions (goals, quests, XP)
      await processAIResponse(responseText);
    } catch (err) {
      console.error('❌ Error in handleSendMessage:', err);
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
    const updates = {
      name: profileData.name,
    };
    
    // Convert setup goals to actual goals
    if (profileData.primaryGoals && profileData.primaryGoals.length > 0) {
      profileData.primaryGoals.forEach((goalType: string) => {
        const goalTitles = {
          fitness: 'Get Physically Stronger',
          career: 'Advance My Career',
          skills: 'Learn New Skills',
          mental: 'Build Mental Strength',
          habits: 'Develop Better Habits',
          social: 'Improve Social Skills'
        };
        
        if (goalTitles[goalType as keyof typeof goalTitles]) {
          addGoal({
            title: goalTitles[goalType as keyof typeof goalTitles],
            description: `Working on ${goalType} improvement`,
            category: goalType as any,
            progress: 0,
            status: 'active'
          });
        }
      });
    }
    
    updateProfile(updates);
    setShowProfileSetup(false);
    
    // Add a personalized welcome message
    const welcomeMessage = `Perfect, ${profileData.name || 'Hunter'}! I now understand your goals better. Based on what you've told me, I'll help you create a personalized leveling plan. Think of me as your personal System - I'll track your progress, suggest daily quests, and help you overcome the challenges you mentioned. Ready to begin your transformation?`;
    
    // Show setup completion message in speech bubble
    setCurrentSJWMessage(welcomeMessage);
    setShowSpeechBubble(true);
    
    // Award initial XP for completing setup
    setTimeout(() => {
      addExperience(25);
    }, 2000);
  };

  // Show loading while auth is initializing
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="hunter-level-badge mx-auto mb-4 animate-pulse">
            <Crown className="w-8 h-8 text-current" />
          </div>
          <p className="text-yellow-400">
            {authLoading ? 'Authenticating Hunter...' : 'Initializing Hunter System...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error if there's a profile error
  if (profileError && !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center p-4">
        <div className="hunter-card text-center max-w-md">
          <Crown className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="hunter-heading text-xl mb-4 text-red-400">Authentication Error</h2>
          <p className="text-gray-300 mb-6">{profileError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="hunter-btn hunter-btn-primary"
          >
            Retry Login
          </button>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <HunterDashboard />;
      case 'quests':
        return <QuestInterface />;
      case 'profile':
        return <HunterProfile />;
      case 'chat':
        return renderChatInterface();
      default:
        return <HunterDashboard />;
    }
  };

  const renderChatInterface = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Show error message if exists */}
        {(error || profileError) && (
          <div className="hunter-card mb-4 border-red-500/50 bg-red-900/20">
            <div className="flex items-center space-x-2 text-red-400">
              <span className="text-lg">⚠️</span>
              <span>{error || profileError}</span>
            </div>
          </div>
        )}
        
        <div className="hunter-card text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h2 className="hunter-heading text-2xl mb-4">Chat with Sung Jin Woo</h2>
          <p className="text-gray-400 mb-6">
            The Shadow Monarch is currently in development. 
            Use the Dashboard and Quests to track your Hunter journey for now.
          </p>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="hunter-btn hunter-btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900">
      {showProfileSetup && (
        <ProfileSetup
          onComplete={handleProfileSetupComplete}
          onSkip={() => setShowProfileSetup(false)}
        />
      )}

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-700 p-4 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex justify-around">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                currentView === 'dashboard' ? 'text-yellow-400 bg-gray-800' : 'text-gray-400 hover:text-white'
              }`}
              disabled={!session?.user}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs">Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentView('quests')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                currentView === 'quests' ? 'text-yellow-400 bg-gray-800' : 'text-gray-400 hover:text-white'
              }`}
              disabled={!session?.user}
            >
              <Target className="w-6 h-6" />
              <span className="text-xs">Quests</span>
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                currentView === 'profile' ? 'text-yellow-400 bg-gray-800' : 'text-gray-400 hover:text-white'
              }`}
              disabled={!session?.user}
            >
              <User className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </button>
            <button
              onClick={() => setCurrentView('chat')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                currentView === 'chat' ? 'text-yellow-400 bg-gray-800' : 'text-gray-400 hover:text-white'
              }`}
              disabled={!session?.user}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs">Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20">
        {renderCurrentView()}
      </div>
    </div>
  );
}

export default AuthenticatedAppContent;
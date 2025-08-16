import React, { useState, useEffect, useRef } from 'react';
import { Send, Crown, Sword, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useUserProfile } from './hooks/useUserProfile';
import ProfileSetup from './components/ProfileSetup';
import UserStats from './components/UserStats';
import SungJinWooAvatar from './components/SungJinWooAvatar';
import SpeechBubble from './components/SpeechBubble';
import { UserProfile } from './types/user';

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

CRITICAL: You MUST create goals and quests for the user. Use these EXACT formats:

GOAL FORMAT (use at least one per response when giving advice):
- "GOAL: [specific actionable goal]"
- "NEW GOAL: [specific actionable goal]"

QUEST FORMAT (for daily habits):
- "DAILY QUEST: [specific daily task]"
- "HABIT QUEST: [specific daily action]"

XP REWARDS (award XP for engagement):
- "REWARD: +[number] XP for [reason]"

MANDATORY: Every response should include:
1. At least one GOAL or DAILY QUEST if giving advice
2. An XP reward for the conversation
3. Reference their current level and progress

Examples:
- "GOAL: Exercise for 30 minutes daily"
- "DAILY QUEST: Do 20 push-ups every morning"  
- "REWARD: +15 XP for setting a fitness goal"

The system automatically processes these and updates the user's profile in real-time.

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
  const { profile, isLoading, updateProfile, getProfileSummary, saveConversation, addExperience, addGoal, addDailyQuest, loadProfile } = useUserProfile();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSJWMessage, setCurrentSJWMessage] = useState<string>('');
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');

  useEffect(() => {
    if (!isLoading) {
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
  }, [isLoading, profile]);

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

  // Test function to manually create a goal (for debugging)
  const testCreateGoal = async () => {
    console.log('🧪 TESTING GOAL CREATION...');
    try {
      await addGoal({
        title: 'Test Goal - Exercise Daily',
        description: 'Test goal created manually',
        category: 'fitness',
        progress: 0,
        status: 'active'
      });
      console.log('✅ Test goal created successfully');
      await addExperience(25);
      console.log('✅ Test XP added successfully');
      await loadProfile();
      console.log('✅ Profile reloaded successfully');
    } catch (error) {
      console.error('❌ Test goal creation failed:', error);
    }
  };

  // Add test button in development
  const isDevelopment = import.meta.env.DEV;

  // Force process a test response
  const testProcessResponse = async () => {
    await processAIResponse("I suggest you work on exercising for 30 minutes daily. This will help build your physical strength.");
  };

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

    console.log('📤 SENDING MESSAGE:', inputText);
    const userMessage = inputText;
    setLastUserMessage(userMessage);
    setInputText('');
    setIsTyping(true);
    setError(null);

    try {
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

      {/* Debug Panel (Development Only) */}
      {isDevelopment && (
        <div className="fixed bottom-4 left-4 bg-black/80 p-4 rounded-lg text-white text-xs space-y-2">
          <div className="font-bold">Debug Panel</div>
          <button onClick={testCreateGoal} className="bg-green-600 px-2 py-1 rounded text-xs">
            Test Create Goal
          </button>
          <button onClick={testProcessResponse} className="bg-blue-600 px-2 py-1 rounded text-xs">
            Test Process Response
          </button>
          <div>Level: {getProfileSummary().level} | XP: {getProfileSummary().experience}</div>
        </div>
      )}

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

      {/* Main Content Area - Show last user message if available */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto pr-32 text-center">
          {lastUserMessage ? (
            <div className="bg-black/30 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 mb-4">
              <h3 className="text-blue-300 font-semibold mb-2">Your Last Message:</h3>
              <p className="text-white">{lastUserMessage}</p>
            </div>
          ) : (
            <div className="text-center text-purple-300/70">
              <Crown className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
              <p className="text-lg mb-2">Ready to level up, Hunter?</p>
              <p className="text-sm">Start a conversation with your Shadow Monarch coach</p>
            </div>
          )}
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
            Press Enter to send • Level {getProfileSummary().level} • {getProfileSummary().experience} XP • IP-based auto-save
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
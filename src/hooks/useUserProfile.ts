import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserProfile, Goal, DailyQuest, Achievement } from '../types/user';

// Initialize Supabase client with better error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Frontend Supabase Environment Check:');
console.log('VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');

// Create a fallback or handle missing environment variables gracefully
const finalSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalSupabaseAnonKey = supabaseAnonKey || 'placeholder-key';

const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Some features may not work properly.');
  console.warn('VITE_SUPABASE_URL:', supabaseUrl || 'MISSING');
  console.warn('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
}

const defaultProfile: UserProfile = {
  id: 'default',
  level: 1,
  experience: 0,
  stats: {
    strength: 1,
    endurance: 1,
    agility: 1,
    intelligence: 1,
    willpower: 1,
  },
  goals: [],
  dailyQuests: [],
  achievements: [],
  lastLogin: new Date(),
  createdAt: new Date(),
};

export const useUserProfile = (user: any) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile(user.id);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get current session
    const getCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setAuthLoading(false);
    };
    
    getCurrentSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event, newSession?.user?.id);
      setSession(newSession);
      
      if (newSession?.user && event === 'SIGNED_IN') {
        await loadProfile(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        setProfile(defaultProfile);
        setIsLoading(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user?.id && session?.user?.id) {
      loadProfile(user.id);
    }
  }, [user, session]);

  const loadProfile = async (userId?: string) => {
    try {
      setError(null);
      
      // Use provided userId or get from current session
      const currentUserId = userId || session?.user?.id;
      if (!currentUserId) {
        console.warn('No authenticated user for loadProfile');
        setIsLoading(false);
        return;
      }
      
      // Try to find existing user by ID
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching user:', fetchError);
        setError(`Failed to load profile: ${fetchError.message}`);
        setIsLoading(false);
        return;
      }
      
      let userData = existingUser;
      
      if (!userData) {
        console.warn('User not found in database');
        setError('User profile not found');
        setIsLoading(false);
        return;
      } else {
        // Update last login
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userData.id)
          .select('*')
          .single();
          
        if (updateError) {
          console.error('Error updating last login:', updateError);
          // Don't fail the whole load for this
        } else {
          userData = updatedUser;
        }
      }
      
      // Load related data separately to avoid join issues
      const [goalsData, questsData, achievementsData] = await Promise.all([
        loadUserGoals(userData.id),
        loadUserQuests(userData.id),
        loadUserAchievements(userData.id)
      ]);
      
      // Transform Supabase data to match UserProfile interface
      const profileData: UserProfile = {
        id: userData.id,
        name: userData.name,
        level: userData.level,
        experience: userData.experience,
        stats: {
          strength: userData.strength,
          endurance: userData.endurance,
          agility: userData.agility,
          intelligence: userData.intelligence,
          willpower: userData.willpower,
        },
        goals: goalsData,
        dailyQuests: questsData,
        achievements: achievementsData,
        lastLogin: new Date(userData.last_login),
        createdAt: new Date(userData.created_at),
      };
      
      setProfile(profileData);
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      setError(`Failed to load profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions to load related data
  const loadUserGoals = async (userId: string): Promise<Goal[]> => {
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return (goals || []).map((goal: any) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      targetDate: goal.target_date ? new Date(goal.target_date) : undefined,
      progress: goal.progress,
      status: goal.status,
      createdAt: new Date(goal.created_at),
    }));
  };

  const loadUserQuests = async (userId: string): Promise<DailyQuest[]> => {
    const { data: quests, error } = await supabase
      .from('daily_quests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return (quests || []).map((quest: any) => ({
      id: quest.id,
      title: quest.title,
      description: quest.description || '',
      category: quest.category,
      difficulty: quest.difficulty,
      experienceReward: quest.experience_reward,
      completed: quest.completed,
      streak: quest.streak,
      lastCompleted: quest.last_completed ? new Date(quest.last_completed) : undefined,
      createdAt: new Date(quest.created_at),
    }));
  };

  const loadUserAchievements = async (userId: string): Promise<Achievement[]> => {
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_date', { ascending: false });
      
    if (error) throw error;
    
    return (achievements || []).map((achievement: any) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description || '',
      icon: achievement.icon || '',
      unlockedDate: new Date(achievement.unlocked_date), // Use unlocked_date as hinted by Supabase
    }));
  };

  const saveProfile = async (updatedProfile: UserProfile) => {
    if (!session?.user?.id) {
      setError('No authenticated user');
      return;
    }
    
    try {
      setError(null);
      
      // Update user profile
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: updatedProfile.name,
          level: updatedProfile.level,
          experience: updatedProfile.experience,
          strength: updatedProfile.stats.strength,
          endurance: updatedProfile.stats.endurance,
          agility: updatedProfile.stats.agility,
          intelligence: updatedProfile.stats.intelligence,
          willpower: updatedProfile.stats.willpower,
          last_login: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error saving profile:', updateError);
        setError(`Failed to save profile: ${updateError.message}`);
        return;
      }
      
      // Reload profile to get updated data
      await loadProfile(session.user.id);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(`Failed to save profile: ${error.message}`);
    }
  };

  const saveConversation = async (userMessage: string, sjwResponse: string) => {
    if (!session?.user?.id) {
      setError('No authenticated user');
      return;
    }
    
    try {
      setError(null);
      
      // Insert conversation into history
      const { error: insertError } = await supabase
        .from('conversation_history')
        .insert([{
          user_id: session.user.id,
          user_message: userMessage,
          sjw_response: sjwResponse
        }]);
        
      if (insertError) {
        console.error('Error saving conversation:', insertError);
        setError(`Failed to save conversation: ${insertError.message}`);
        return;
      }
      
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', session.user.id);
    } catch (error) {
      console.error('Error saving conversation:', error);
      setError(`Failed to save conversation: ${error.message}`);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    const updatedProfile = { ...profile, ...updates, lastLogin: new Date() };
    saveProfile(updatedProfile);
  };

  const addExperience = async (amount: number) => {
    if (!session?.user?.id) {
      setError('No authenticated user');
      return null;
    }
    
    try {
      setError(null);
      
      // Find user by ID
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (fetchError || !existingUser) {
        console.error('Error finding user for XP:', fetchError);
        setError('User not found');
        return null;
      }
      
      // Add experience and calculate new level
      const newExperience = existingUser.experience + amount;
      const newLevel = Math.floor(newExperience / 100) + 1;
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          experience: newExperience,
          level: newLevel,
          last_login: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating experience:', updateError);
        setError(`Failed to add experience: ${updateError.message}`);
        return null;
      }
      
      // Reload profile to get updated data
      await loadProfile(session.user.id);
      return updatedUser;
    } catch (error) {
      console.error('Error adding experience:', error);
      setError(`Failed to add experience: ${error.message}`);
      return null;
    }
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    if (!session?.user?.id) {
      setError('No authenticated user');
      return;
    }
    
    try {
      setError(null);
      
      // Insert new goal
      const { data: newGoal, error: insertError } = await supabase
        .from('goals')
        .insert([{
          user_id: session.user.id,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          target_date: goal.targetDate?.toISOString(),
          progress: goal.progress,
          status: goal.status
        }])
        .select()
        .single();
        
      if (insertError) {
        console.error('Error adding goal:', insertError);
        setError(`Failed to add goal: ${insertError.message}`);
        return;
      }
      
      // Reload profile to get updated data
      await loadProfile(session.user.id);
    } catch (error) {
      console.error('Error adding goal:', error);
      setError(`Failed to add goal: ${error.message}`);
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!session?.user?.id) {
      setError('No authenticated user');
      return;
    }
    
    try {
      setError(null);
      
      // Update goal
      const { data: updatedGoal, error: updateError } = await supabase
        .from('goals')
        .update({
          title: updates.title,
          description: updates.description,
          category: updates.category,
          target_date: updates.targetDate?.toISOString(),
          progress: updates.progress,
          status: updates.status
        })
        .eq('id', goalId)
        .eq('user_id', session.user.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating goal:', updateError);
        setError(`Failed to update goal: ${updateError.message}`);
        return;
      }
      
      if (!updatedGoal) {
        setError('Goal not found');
        return;
      }
      
      // Reload profile to get updated data
      await loadProfile(session.user.id);
    } catch (error) {
      console.error('Error updating goal:', error);
      setError(`Failed to update goal: ${error.message}`);
    }
  };

  const addDailyQuest = async (quest: Omit<DailyQuest, 'id' | 'createdAt' | 'completed' | 'streak'>) => {
    if (!session?.user?.id) {
      setError('No authenticated user');
      return;
    }
    
    try {
      setError(null);
      
      // Insert new quest
      const { data: newQuest, error: insertError } = await supabase
        .from('daily_quests')
        .insert([{
          user_id: session.user.id,
          title: quest.title,
          description: quest.description,
          category: quest.category,
          difficulty: quest.difficulty,
          experience_reward: quest.experienceReward,
          completed: false,
          streak: 0
        }])
        .select()
        .single();
        
      if (insertError) {
        console.error('Error adding quest:', insertError);
        setError(`Failed to add quest: ${insertError.message}`);
        return;
      }
      
      // Reload profile to get updated data
      await loadProfile(session.user.id);
    } catch (error) {
      console.error('Error adding quest:', error);
      setError(`Failed to add quest: ${error.message}`);
    }
  };

  const completeQuest = async (questId: string) => {
    if (!session?.user?.id) {
      setError('No authenticated user');
      return { success: false, error: 'No authenticated user' };
    }
    
    try {
      console.log('🎯 ===== COMPLETE QUEST HOOK START =====');
      console.log('🎯 Quest ID to complete:', questId);
      console.log('👤 User ID for identification:', session.user.id);
      
      setError(null);
      
      // Find user by ID
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (fetchError || !existingUser) {
        console.error('❌ USER NOT FOUND ERROR:', fetchError);
        setError('User not found');
        return { success: false, error: 'User not found' };
      }
      
      console.log('👤 Found user with ID:', existingUser.id);
      console.log('👤 User data:', existingUser);
      
      // Get quest details first
      console.log('🔍 Searching for quest in database...');
      console.log('🔍 Quest ID:', questId);
      console.log('🔍 User ID:', existingUser.id);
      
      const { data: quest, error: questError } = await supabase
        .from('daily_quests')
        .select('*')
        .eq('id', questId)
        .eq('user_id', existingUser.id)
        .single();
        
      if (questError || !quest) {
        console.error('❌ QUEST NOT FOUND ERROR:', questError);
        console.log('🔍 Let me check what quests exist for this user...');
        const { data: allQuests } = await supabase
          .from('daily_quests')
          .select('*')
          .eq('user_id', existingUser.id);
        console.log('📋 All available quests for user:', allQuests);
        console.log('📋 Quest count:', allQuests?.length || 0);
        setError(`Quest not found: ${questId}`);
        return { success: false, error: `Quest not found: ${questId}` };
      }
      
      console.log('✅ Found quest in database:');
      console.log('✅ Quest Title:', quest.title);
      console.log('✅ Quest Completed Status:', quest.completed);
      console.log('✅ Quest XP Reward:', quest.experience_reward);
      
      // Check if quest is already completed
      if (quest.completed) {
        console.log('⚠️ Quest is already marked as completed in database');
        return { success: true, alreadyCompleted: true };
      }
      
      // Update quest completion
      console.log('📝 Updating quest completion status in database...');
      const { error: updateQuestError } = await supabase
        .from('daily_quests')
        .update({
          completed: true,
          streak: quest.streak + 1,
          last_completed: new Date().toISOString()
        })
        .eq('id', questId);
      
      if (updateQuestError) {
        console.error('❌ DATABASE UPDATE ERROR (quest):', updateQuestError);
        setError(`Failed to complete quest: ${updateQuestError.message}`);
        return { success: false, error: updateQuestError.message };
      }
      
      console.log('✅ Quest successfully marked as completed in database');
      
      // Update user experience and level
      const newExperience = existingUser.experience + (quest.experience_reward || 10);
      const newLevel = Math.floor(newExperience / 100) + 1;
      
      console.log('💰 Calculating XP update:');
      console.log('💰 Current XP:', existingUser.experience);
      console.log('💰 XP Reward:', quest.experience_reward || 10);
      console.log('💰 New XP Total:', newExperience);
      console.log('📈 Current Level:', existingUser.level);
      console.log('📈 New Level:', newLevel);
      
      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          experience: newExperience,
          level: newLevel,
          last_login: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select()
        .single();
      
      if (updateUserError) {
        console.error('❌ DATABASE UPDATE ERROR (user):', updateUserError);
        setError(`Failed to update user progress: ${updateUserError.message}`);
        return { success: false, error: updateUserError.message };
      }
      
      console.log('✅ User XP and level successfully updated in database');
      
      // Reload profile to get updated data
      console.log('🔄 Reloading profile to get fresh data from database...');
      await loadProfile(session.user.id);
      console.log('✅ Profile reloaded successfully');
      console.log('🎯 ===== COMPLETE QUEST HOOK END =====');
      
      return { success: true, newExperience, newLevel };
    } catch (error) {
      console.error('❌ COMPLETE QUEST HOOK ERROR:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      setError(`Failed to complete quest: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const addAchievement = async (achievement: Omit<Achievement, 'id' | 'unlockedDate'>) => {
    if (!session?.user?.id) {
      setError('No authenticated user');
      return;
    }
    
    try {
      setError(null);
      
      // Insert new achievement
      const { data: newAchievement, error: insertError } = await supabase
        .from('achievements')
        .insert([{
          user_id: session.user.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon
        }])
        .select()
        .single();
        
      if (insertError) {
        console.error('Error adding achievement:', insertError);
        setError(`Failed to add achievement: ${insertError.message}`);
        return;
      }
      
      // Reload profile to get updated data
      await loadProfile(session.user.id);
    } catch (error) {
      console.error('Error adding achievement:', error);
      setError(`Failed to add achievement: ${error.message}`);
    }
  };

  const getProfileSummary = () => {
    const activeGoals = profile.goals.filter(g => g.status === 'active').length;
    const completedGoals = profile.goals.filter(g => g.status === 'completed').length;
    const totalQuests = profile.dailyQuests.length;
    const completedToday = profile.dailyQuests.filter(q => {
      if (!q.lastCompleted) return false;
      const today = new Date().toDateString();
      return q.lastCompleted.toDateString() === today;
    }).length;

    return {
      level: profile.level,
      experience: profile.experience,
      experienceToNext: 100 - (profile.experience % 100),
      activeGoals,
      completedGoals,
      totalQuests,
      completedToday,
      achievements: profile.achievements.length,
      daysSinceStart: Math.floor((Date.now() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    };
  };

  return {
    profile,
    isLoading,
    authLoading,
    session,
    error,
    updateProfile,
    addExperience,
    addGoal,
    updateGoal,
    addDailyQuest,
    completeQuest,
    addAchievement,
    getProfileSummary,
    saveConversation,
    loadProfile,
    supabase,
  };
};
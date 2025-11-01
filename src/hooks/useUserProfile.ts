import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './useAuth';
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get current user ID from passed user object
      const userId = user?.id;
      if (!userId) {
        throw new Error('No authenticated user');
      }
      
      // Try to find existing user by ID
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      let userData = existingUser;
      
      if (!userData) {
        throw new Error('User not found');
      } else {
        // Update last login
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userData.id)
          .select('*')
          .single();
          
        if (updateError) throw updateError;
        userData = updatedUser;
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
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('No authenticated user');
      
      // Update user profile
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: updatedProfile.name || userIp,
          level: updatedProfile.level,
          experience: updatedProfile.experience,
          strength: updatedProfile.stats.strength,
          endurance: updatedProfile.stats.endurance,
          agility: updatedProfile.stats.agility,
          intelligence: updatedProfile.stats.intelligence,
          willpower: updatedProfile.stats.willpower,
          last_login: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      // Reload profile to get updated data
      await loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const saveConversation = async (userMessage: string, sjwResponse: string) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('No authenticated user');
      
      // Insert conversation into history
      const { error: insertError } = await supabase
        .from('conversation_history')
        .insert([{
          user_id: userId,
          user_message: userMessage,
          sjw_response: sjwResponse
        }]);
        
      if (insertError) throw insertError;
      
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    const updatedProfile = { ...profile, ...updates, lastLogin: new Date() };
    saveProfile(updatedProfile);
  };

  const addExperience = async (amount: number) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('No authenticated user');
      
      // Find user by ID
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (fetchError || !existingUser) throw new Error('User not found');
      
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
        .eq('id', userId)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      // Reload profile to get updated data
      await loadProfile();
      return updatedUser;
    } catch (error) {
      console.error('Error adding experience:', error);
    }
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('No authenticated user');
      
      // Insert new goal
      const { data: newGoal, error: insertError } = await supabase
        .from('goals')
        .insert([{
          user_id: userId,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          target_date: goal.targetDate?.toISOString(),
          progress: goal.progress,
          status: goal.status
        }])
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      // Reload profile to get updated data
      await loadProfile();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('No authenticated user');
      
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
        .eq('user_id', userId)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      if (!updatedGoal) {
        throw new Error('Goal not found');
      }
      
      // Reload profile to get updated data
      await loadProfile();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const addDailyQuest = async (quest: Omit<DailyQuest, 'id' | 'createdAt' | 'completed' | 'streak'>) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('No authenticated user');
      
      // Insert new quest
      const { data: newQuest, error: insertError } = await supabase
        .from('daily_quests')
        .insert([{
          user_id: userId,
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
        
      if (insertError) throw insertError;
      
      // Reload profile to get updated data
      await loadProfile();
    } catch (error) {
      console.error('Error adding quest:', error);
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      console.log('🎯 ===== COMPLETE QUEST HOOK START =====');
      console.log('🎯 Quest ID to complete:', questId);
      const userId = getCurrentUserId();
      if (!userId) throw new Error('No authenticated user');
      console.log('👤 User ID for identification:', userId);
      
      // Find user by ID
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (fetchError || !existingUser) {
        console.error('❌ USER NOT FOUND ERROR:', fetchError);
        throw new Error('User not found');
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
        throw new Error(`Quest not found: ${questId}`);
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
        throw updateQuestError;
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
        .eq('id', userId)
        .select()
        .single();
      
      if (updateUserError) {
        console.error('❌ DATABASE UPDATE ERROR (user):', updateUserError);
        throw updateUserError;
      }
      
      console.log('✅ User XP and level successfully updated in database');
      
      // Reload profile to get updated data
      console.log('🔄 Reloading profile to get fresh data from database...');
      await loadProfile();
      console.log('✅ Profile reloaded successfully');
      console.log('🎯 ===== COMPLETE QUEST HOOK END =====');
      
      return { success: true, newExperience, newLevel };
    } catch (error) {
      console.error('❌ COMPLETE QUEST HOOK ERROR:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  };

  const addAchievement = async (achievement: Omit<Achievement, 'id' | 'unlockedDate'>) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('No authenticated user');
      
      // Insert new achievement
      const { data: newAchievement, error: insertError } = await supabase
        .from('achievements')
        .insert([{
          user_id: userId,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon
        }])
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      // Reload profile to get updated data
      await loadProfile();
    } catch (error) {
      console.error('Error adding achievement:', error);
      throw error;
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
  };
};
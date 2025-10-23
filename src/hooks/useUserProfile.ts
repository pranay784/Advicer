import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserProfile, Goal, DailyQuest, Achievement } from '../types/user';

// Initialize Supabase client with better error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get user IP for identification (temporary solution)
      const userIp = await getUserIP();
      
      // Try to find existing user by name (using IP temporarily)
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('name', userIp)
        .limit(1); // Use limit(1) to handle potential duplicate IPs
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      let userData = existingUser ? existingUser[0] : null; // Get the first user if found
      
      if (!userData) {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            name: userIp,
            level: 1,
            experience: 0,
            strength: 10,
            endurance: 10,
            agility: 10,
            intelligence: 10,
            willpower: 10,
            current_day_id: 1,
            setup_completed: false
          }])
          .select('*')
          .single();
          
        if (insertError) throw insertError;
        userData = newUser;
      } else {
        // Update last login
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', existingUser.id)
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
        name: userData.name === await getUserIP() ? undefined : userData.name, // Don't show IP as name
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
      .order('unlocked_at', { ascending: false });
      
    if (error) throw error;
    
    return (achievements || []).map((achievement: any) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description || '',
      icon: achievement.icon || '',
      unlockedDate: new Date(achievement.unlocked_date), // Use unlocked_date as hinted by Supabase
    }));
  };

  // Helper function to get user IP (temporary identification method)
  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting IP:', error);
      return 'unknown_' + Date.now(); // Fallback identifier
    }
  };

  const saveProfile = async (updatedProfile: UserProfile) => {
    try {
      const userIp = await getUserIP();
      
      // Find user by IP
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('name', userIp)
        .limit(1); // Use limit(1)
        
      if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
      
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
        .eq('id', existingUser[0].id) // Access the first user's ID
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
      const userIp = await getUserIP();
      
      // Find user by IP
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('name', userIp)
        .limit(1); // Use limit(1)
        
      if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
      
      // Insert conversation into history
      const { error: insertError } = await supabase
        .from('conversation_history')
          user_id: existingUser[0].id, // Access the first user's ID
          user_id: existingUser.id,
          user_message: userMessage,
          sjw_response: sjwResponse
        }]);
        
      if (insertError) throw insertError;
      
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() }).eq('id', existingUser[0].id);
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
      const userIp = await getUserIP();
      
      // Find user by IP
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('name', userIp)
        .limit(1); // Use limit(1)
        
      if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
      
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
        .eq('id', existingUser[0].id) // Access the first user's ID
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
      const userIp = await getUserIP();
      
      // Find user by IP
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('name', userIp)
        .limit(1); // Use limit(1)
        
      if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
      
      // Insert new goal
      const { data: newGoal, error: insertError } = await supabase
        .from('goals')
          user_id: existingUser[0].id, // Access the first user's ID
          user_id: existingUser.id,
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
      const userIp = await getUserIP();
      
      // Find user by IP
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('name', userIp)
        .limit(1); // Use limit(1)
        
      if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
      
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
        .eq('user_id', existingUser[0].id) // Access the first user's ID
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
      const userIp = await getUserIP();
      
      // Find user by IP
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('name', userIp)
        .limit(1); // Use limit(1)
        
      if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
      
      // Insert new quest
      const { data: newQuest, error: insertError } = await supabase
        .from('daily_quests')
          user_id: existingUser[0].id, // Access the first user's ID
          user_id: existingUser.id,
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
      const userIp = await getUserIP();
      
      // Find user by IP
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('name', userIp)
        .limit(1); // Use limit(1)
        
      if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
      
      // Get quest details
      const { data: quest, error: questError } = await supabase
        .from('daily_quests')
        .select('*')
        .eq('id', questId)
        .eq('user_id', existingUser[0].id) // Access the first user's ID
        .single();
        
      if (questError || !quest) {
        throw new Error('Quest not found');
      }
      
      // Update quest completion
      await supabase
        .from('daily_quests')
        .update({
          completed: true,
          streak: quest.streak + 1,
          last_completed: new Date().toISOString()
        })
        .eq('id', questId);
      
      // Update user experience and level
      const newExperience = existingUser.experience + (quest.experience_reward || 10);
      const newLevel = Math.floor(newExperience / 100) + 1;
      
      await supabase
        .from('users')
        .update({
          experience: newExperience,
          level: newLevel,
          last_login: new Date().toISOString()
        })
        .eq('id', existingUser[0].id); // Access the first user's ID
      
      // Reload profile to get updated data
      await loadProfile();
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const addAchievement = async (achievement: Omit<Achievement, 'id' | 'unlockedDate'>) => {
    try {
      const userIp = await getUserIP();
      
      // Find user by IP
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('name', userIp)
        .limit(1); // Use limit(1)
        
      if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
      
      // Insert new achievement
      const { data: newAchievement, error: insertError } = await supabase
        .from('achievements')
        .insert([{
          user_id: existingUser[0].id, // Access the first user's ID
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
  }
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
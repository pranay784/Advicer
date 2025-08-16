import { useState, useEffect } from 'react';
import { UserProfile, Goal, DailyQuest, Achievement } from '../types/user';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

const defaultProfile: UserProfile = {
  id: 'loading',
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
      const response = await fetch(`${API_BASE}/user/profile`);
      if (response.ok) {
        const profileData = await response.json();
        // Convert date strings back to Date objects
        profileData.lastLogin = new Date(profileData.lastLogin);
        profileData.createdAt = new Date(profileData.createdAt);
        profileData.goals = profileData.goals.map((goal: any) => ({
          ...goal,
          targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
          createdAt: new Date(goal.createdAt),
        }));
        profileData.dailyQuests = profileData.dailyQuests.map((quest: any) => ({
          ...quest,
          lastCompleted: quest.lastCompleted ? new Date(quest.lastCompleted) : undefined,
          createdAt: new Date(quest.createdAt),
        }));
        profileData.achievements = profileData.achievements.map((achievement: any) => ({
          ...achievement,
          unlockedAt: new Date(achievement.unlockedAt),
        }));
        
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fall back to local storage if server is unavailable
      loadLocalProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalProfile = () => {
    try {
      const saved = localStorage.getItem('sjw_user_profile');
      if (saved) {
        const parsedProfile = JSON.parse(saved);
        parsedProfile.lastLogin = new Date(parsedProfile.lastLogin);
        parsedProfile.createdAt = new Date(parsedProfile.createdAt);
        setProfile(parsedProfile);
      }
    } catch (error) {
      console.error('Error loading local profile:', error);
    }
  };

  const saveProfile = async (updatedProfile: UserProfile) => {
    try {
      const response = await fetch(`${API_BASE}/user/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });

      if (response.ok) {
        const savedProfile = await response.json();
        setProfile(savedProfile);
      } else {
        throw new Error('Server save failed');
      }
    } catch (error) {
      console.error('Error saving to server, using local storage:', error);
      // Fallback to local storage
      localStorage.setItem('sjw_user_profile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
    }
  };

  const saveConversation = async (userMessage: string, sjwResponse: string) => {
    try {
      await fetch(`${API_BASE}/user/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          response: sjwResponse,
        }),
      });
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    const updatedProfile = { ...profile, ...updates, lastLogin: new Date() };
    saveProfile(updatedProfile);
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch(`${API_BASE}/user/goal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goal),
      });

      if (response.ok) {
        const newGoal = await response.json();
        const updatedProfile = {
          ...profile,
          goals: [...profile.goals, newGoal],
        };
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoal = (goalId: string, updates: Partial<Goal>) => {
    const updatedGoals = profile.goals.map(goal =>
      goal.id === goalId ? { ...goal, ...updates } : goal
    );
    const updatedProfile = { ...profile, goals: updatedGoals };
    saveProfile(updatedProfile);
  };

  const addDailyQuest = (quest: Omit<DailyQuest, 'id' | 'createdAt' | 'completed' | 'streak'>) => {
    const newQuest: DailyQuest = {
      ...quest,
      id: 'quest_' + Date.now(),
      completed: false,
      streak: 0,
      createdAt: new Date(),
    };
    const updatedProfile = {
      ...profile,
      dailyQuests: [...profile.dailyQuests, newQuest],
    };
    saveProfile(updatedProfile);
  };

  const completeQuest = async (questId: string) => {
    try {
      const response = await fetch(`${API_BASE}/user/quest/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questId }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const addAchievement = (achievement: Omit<Achievement, 'id' | 'unlockedAt'>) => {
    const newAchievement: Achievement = {
      ...achievement,
      id: 'achievement_' + Date.now(),
      unlockedAt: new Date(),
    };
    const updatedProfile = {
      ...profile,
      achievements: [...profile.achievements, newAchievement],
    };
    saveProfile(updatedProfile);
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
    addGoal,
    updateGoal,
    addDailyQuest,
    completeQuest,
    addAchievement,
    getProfileSummary,
    saveConversation,
  };
};
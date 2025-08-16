import { useState, useEffect } from 'react';
import { UserProfile, Goal, DailyQuest, Achievement } from '../types/user';

const API_BASE = 'http://localhost:3001/api';

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
      const response = await fetch(`${API_BASE}/user/profile`);
      if (response.ok) {
        const profileData = await response.json();
        // Convert date strings back to Date objects
        profileData.lastLogin = new Date(profileData.lastLogin);
        profileData.createdAt = new Date(profileData.createdAt);
        profileData.goals = (profileData.goals || []).map((goal: any) => ({
          ...goal,
          targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
          createdAt: new Date(goal.createdAt),
        }));
        profileData.dailyQuests = (profileData.dailyQuests || []).map((quest: any) => ({
          ...quest,
          lastCompleted: quest.lastCompleted ? new Date(quest.lastCompleted) : undefined,
          createdAt: new Date(quest.createdAt),
        }));
        profileData.achievements = (profileData.achievements || []).map((achievement: any) => ({
          ...achievement,
          unlockedAt: new Date(achievement.unlockedAt),
        }));
        
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
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
        // Convert date strings back to Date objects
        savedProfile.lastLogin = new Date(savedProfile.lastLogin);
        savedProfile.createdAt = new Date(savedProfile.createdAt);
        setProfile(savedProfile);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
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

  const addExperience = async (amount: number) => {
    try {
      const response = await fetch(`${API_BASE}/user/experience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        // Convert date strings back to Date objects
        updatedProfile.lastLogin = new Date(updatedProfile.lastLogin);
        updatedProfile.createdAt = new Date(updatedProfile.createdAt);
        setProfile(updatedProfile);
        return updatedProfile;
      }
    } catch (error) {
      console.error('Error adding experience:', error);
    }
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
        // Reload profile to get updated data
        await loadProfile();
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoal = (goalId: string, updates: Partial<Goal>) => {
    // Update goal via API
    fetch(`${API_BASE}/user/goal/${goalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }).then(() => {
      loadProfile(); // Reload to get updated data
    }).catch(error => {
      console.error('Error updating goal:', error);
    });
  };

  const addDailyQuest = (quest: Omit<DailyQuest, 'id' | 'createdAt' | 'completed' | 'streak'>) => {
    fetch(`${API_BASE}/user/quest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quest),
    }).then(() => {
      loadProfile(); // Reload to get updated data
    }).catch(error => {
      console.error('Error adding quest:', error);
    });
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
        // Convert date strings back to Date objects
        updatedProfile.lastLogin = new Date(updatedProfile.lastLogin);
        updatedProfile.createdAt = new Date(updatedProfile.createdAt);
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const addAchievement = (achievement: Omit<Achievement, 'id' | 'unlockedAt'>) => {
    fetch(`${API_BASE}/user/achievement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(achievement),
    }).then(() => {
      loadProfile(); // Reload to get updated data
    }).catch(error => {
      console.error('Error adding achievement:', error);
    });
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
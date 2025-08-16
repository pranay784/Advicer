import { useState, useEffect } from 'react';
import { UserProfile, Goal, DailyQuest, Achievement } from '../types/user';

const STORAGE_KEY = 'sjw_user_profile';

const defaultProfile: UserProfile = {
  id: 'user_' + Date.now(),
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

  const loadProfile = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedProfile = JSON.parse(saved);
        // Convert date strings back to Date objects
        parsedProfile.lastLogin = new Date(parsedProfile.lastLogin);
        parsedProfile.createdAt = new Date(parsedProfile.createdAt);
        parsedProfile.goals = parsedProfile.goals.map((goal: any) => ({
          ...goal,
          targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
          createdAt: new Date(goal.createdAt),
        }));
        parsedProfile.dailyQuests = parsedProfile.dailyQuests.map((quest: any) => ({
          ...quest,
          lastCompleted: quest.lastCompleted ? new Date(quest.lastCompleted) : undefined,
          createdAt: new Date(quest.createdAt),
        }));
        parsedProfile.achievements = parsedProfile.achievements.map((achievement: any) => ({
          ...achievement,
          unlockedAt: new Date(achievement.unlockedAt),
        }));
        
        setProfile(parsedProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = (updatedProfile: UserProfile) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    const updatedProfile = { ...profile, ...updates, lastLogin: new Date() };
    saveProfile(updatedProfile);
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: 'goal_' + Date.now(),
      createdAt: new Date(),
    };
    const updatedProfile = {
      ...profile,
      goals: [...profile.goals, newGoal],
    };
    saveProfile(updatedProfile);
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

  const completeQuest = (questId: string) => {
    const quest = profile.dailyQuests.find(q => q.id === questId);
    if (!quest) return;

    const updatedQuests = profile.dailyQuests.map(q =>
      q.id === questId
        ? {
            ...q,
            completed: true,
            streak: q.streak + 1,
            lastCompleted: new Date(),
          }
        : q
    );

    const newExperience = profile.experience + quest.experienceReward;
    const newLevel = Math.floor(newExperience / 100) + 1;

    const updatedProfile = {
      ...profile,
      dailyQuests: updatedQuests,
      experience: newExperience,
      level: newLevel,
    };

    saveProfile(updatedProfile);
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
  };
};
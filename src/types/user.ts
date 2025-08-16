export interface UserProfile {
  id: string;
  name?: string;
  level: number;
  experience: number;
  stats: {
    strength: number;
    endurance: number;
    agility: number;
    intelligence: number;
    willpower: number;
  };
  goals: Goal[];
  dailyQuests: DailyQuest[];
  achievements: Achievement[];
  lastLogin: Date;
  createdAt: Date;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'fitness' | 'career' | 'skills' | 'mental' | 'social' | 'other';
  targetDate?: Date;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  experienceReward: number;
  completed: boolean;
  streak: number;
  lastCompleted?: Date;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

export interface ProgressUpdate {
  type: 'goal' | 'quest' | 'stat' | 'general';
  data: any;
  timestamp: Date;
}
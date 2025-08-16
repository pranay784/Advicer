import React from 'react';
import { TrendingUp, Target, Zap, Award } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';

const UserStats: React.FC = () => {
  const { getProfileSummary } = useUserProfile();
  const stats = getProfileSummary();

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5 text-purple-400 mr-1" />
            <span className="text-white font-bold text-lg">Lv.{stats.level}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((stats.experience % 100) / 100) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400">{stats.experienceToNext} XP to next level</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="w-5 h-5 text-green-400 mr-1" />
            <span className="text-white font-bold text-lg">{stats.activeGoals}</span>
          </div>
          <p className="text-xs text-gray-400">Active Goals</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Zap className="w-5 h-5 text-yellow-400 mr-1" />
            <span className="text-white font-bold text-lg">{stats.completedToday}</span>
          </div>
          <p className="text-xs text-gray-400">Quests Today</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Award className="w-5 h-5 text-orange-400 mr-1" />
            <span className="text-white font-bold text-lg">{stats.achievements}</span>
          </div>
          <p className="text-xs text-gray-400">Achievements</p>
        </div>
      </div>
    </div>
  );
};

export default UserStats;
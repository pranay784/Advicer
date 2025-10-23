import React from 'react';
import { Crown, TrendingUp, Award, Target, Calendar, Zap } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';

const HunterProfile: React.FC = () => {
  const { profile, getProfileSummary } = useUserProfile();
  const stats = getProfileSummary();

  const statData = [
    { 
      label: 'STR', 
      value: profile.stats.strength, 
      gain: 34, 
      color: 'var(--hunter-fire)',
      description: 'Physical power and muscle strength'
    },
    { 
      label: 'AGI', 
      value: profile.stats.agility, 
      gain: 34, 
      color: 'var(--hunter-sky)',
      description: 'Speed, reflexes, and coordination'
    },
    { 
      label: 'VIT', 
      value: profile.stats.endurance, 
      gain: 23, 
      color: 'var(--hunter-blood)',
      description: 'Endurance and recovery ability'
    },
    { 
      label: 'INT', 
      value: profile.stats.intelligence, 
      gain: 31, 
      color: 'var(--hunter-gold)',
      description: 'Learning speed and problem solving'
    },
    { 
      label: 'WIS', 
      value: profile.stats.willpower, 
      gain: 25, 
      color: 'var(--hunter-green)',
      description: 'Mental resilience and focus'
    }
  ];

  const weeklyMetrics = [
    { label: 'Training', value: '6/7 days', percentage: 86, icon: '🏋️' },
    { label: 'Nutrition', value: '92% optimal', percentage: 92, icon: '🍎' },
    { label: 'Sleep', value: '7.8h avg', percentage: 78, icon: '💤' },
    { label: 'Learning', value: '5.2h/week', percentage: 65, icon: '📚' }
  ];

  const achievements = [
    { title: 'First Steps', description: 'Completed first workout', icon: '👟', rarity: 'common' },
    { title: 'Consistency King', description: '30-day workout streak', icon: '🔥', rarity: 'rare' },
    { title: 'Strength Surge', description: '+100 total STR gains', icon: '💪', rarity: 'epic' },
    { title: 'Mind Over Matter', description: 'Completed 50 mental quests', icon: '🧠', rarity: 'rare' },
    { title: 'Early Riser', description: '7-day morning routine', icon: '🌅', rarity: 'uncommon' },
    { title: 'Knowledge Seeker', description: 'Read 10 books', icon: '📖', rarity: 'rare' }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-600';
      case 'uncommon': return 'text-green-400 border-green-600';
      case 'rare': return 'text-blue-400 border-blue-600';
      case 'epic': return 'text-purple-400 border-purple-600';
      case 'legendary': return 'text-yellow-400 border-yellow-600';
      default: return 'text-gray-400 border-gray-600';
    }
  };

  const getRankInfo = (level: number) => {
    if (level < 10) return { rank: 'E-Class', next: 'D-Class', color: 'text-gray-400' };
    if (level < 25) return { rank: 'D-Class', next: 'C-Class', color: 'text-green-400' };
    if (level < 50) return { rank: 'C-Class', next: 'B-Class', color: 'text-blue-400' };
    if (level < 75) return { rank: 'B-Class', next: 'A-Class', color: 'text-purple-400' };
    if (level < 100) return { rank: 'A-Class', next: 'S-Class', color: 'text-yellow-400' };
    return { rank: 'S-Class', next: 'Shadow Monarch', color: 'text-red-400' };
  };

  const rankInfo = getRankInfo(stats.level);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="hunter-card mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border-4 border-yellow-400 shadow-lg">
                <Crown className="w-16 h-16 text-yellow-400" />
              </div>
              <div className="absolute -bottom-2 -right-2 hunter-badge hunter-badge-gold">
                {rankInfo.rank}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="hunter-heading text-3xl mb-2">
                {profile.name || 'Hunter'} - "{rankInfo.rank} Hunter"
              </h1>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <span className="hunter-mono text-lg">Level {stats.level}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <span className="hunter-mono">{stats.experience.toLocaleString()} XP</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-400" />
                  <span>Rank #4,327</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span>{stats.daysSinceStart} days active</span>
                </div>
              </div>

              {/* XP Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress to {rankInfo.next}</span>
                  <span>{stats.experienceToNext} XP needed</span>
                </div>
                <div className="hunter-progress">
                  <div 
                    className="hunter-progress-bar" 
                    style={{ width: `${((stats.experience % 100) / 100) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stat Progression */}
          <div className="lg:col-span-2">
            <div className="hunter-card">
              <h2 className="hunter-heading text-xl mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2" />
                Stat Progression
              </h2>
              <div className="space-y-4">
                {statData.map((stat) => (
                  <div key={stat.label} className="flex items-center space-x-4">
                    <div className="w-12 text-center">
                      <div className="hunter-mono font-bold text-lg">{stat.label}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="hunter-mono text-2xl font-bold" style={{ color: stat.color }}>
                          {stat.value}
                        </span>
                        <span className="text-green-400 text-sm">+{stat.gain}</span>
                      </div>
                      <div className="hunter-progress">
                        <div 
                          className="hunter-progress-bar" 
                          style={{ 
                            width: `${Math.min((stat.value / 200) * 100, 100)}%`,
                            background: `linear-gradient(90deg, ${stat.color}, var(--hunter-gold))`
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{stat.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="hunter-card mt-6">
              <h2 className="hunter-heading text-xl mb-6">Weekly Progress</h2>
              <div className="grid grid-cols-2 gap-4">
                {weeklyMetrics.map((metric) => (
                  <div key={metric.label} className="text-center p-4 bg-gray-800/50 rounded-lg">
                    <div className="text-3xl mb-2">{metric.icon}</div>
                    <div className="hunter-mono text-lg font-bold mb-1">{metric.value}</div>
                    <div className="text-sm text-gray-400 mb-2">{metric.label}</div>
                    <div className="hunter-progress">
                      <div 
                        className="hunter-progress-bar" 
                        style={{ width: `${metric.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="space-y-6">
            <div className="hunter-card">
              <h2 className="hunter-heading text-xl mb-4 flex items-center">
                <Award className="w-6 h-6 mr-2" />
                Achievements
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {achievements.map((achievement, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border-2 ${getRarityColor(achievement.rarity)} bg-gray-800/30`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{achievement.title}</div>
                        <div className="text-xs text-gray-400">{achievement.description}</div>
                        <div className={`text-xs mt-1 ${getRarityColor(achievement.rarity).split(' ')[0]}`}>
                          {achievement.rarity.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="hunter-btn hunter-btn-ghost w-full mt-4">
                View All ({achievements.length}/156)
              </button>
            </div>

            {/* Quick Stats */}
            <div className="hunter-card">
              <h2 className="hunter-heading text-lg mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Workouts</span>
                  <span className="hunter-mono font-bold">127</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Longest Streak</span>
                  <span className="hunter-mono font-bold">45 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Goals Completed</span>
                  <span className="hunter-mono font-bold">{stats.completedGoals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total XP Earned</span>
                  <span className="hunter-mono font-bold">{stats.experience.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hunter Rank</span>
                  <span className="hunter-mono font-bold">#4,327</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HunterProfile;
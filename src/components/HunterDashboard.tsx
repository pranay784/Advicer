import React from 'react';
import { Crown, Target, Zap, Award, TrendingUp, Sword, Shield, Brain } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';

const HunterDashboard: React.FC = () => {
  const { profile, getProfileSummary } = useUserProfile();
  const stats = getProfileSummary();

  const questCategories = [
    {
      name: 'Physical',
      icon: Sword,
      progress: 80,
      completed: 12,
      total: 15,
      color: 'var(--hunter-fire)'
    },
    {
      name: 'Mental',
      icon: Brain,
      progress: 50,
      completed: 1,
      total: 2,
      color: 'var(--hunter-sky)'
    },
    {
      name: 'Mindset',
      icon: Shield,
      progress: 0,
      completed: 0,
      total: 2,
      color: 'var(--hunter-gold)'
    }
  ];

  const statCards = [
    { label: 'STR', value: profile.stats.strength, change: '+3', icon: '💪' },
    { label: 'AGI', value: profile.stats.agility, change: '+2', icon: '🏃' },
    { label: 'VIT', value: profile.stats.endurance, change: '+1', icon: '❤️' },
    { label: 'INT', value: profile.stats.intelligence, change: '+2', icon: '🧠' },
    { label: 'WIS', value: profile.stats.willpower, change: '+1', icon: '🔮' },
    { label: 'CHA', value: 28, change: '+0', icon: '✨' }
  ];

  const recentAchievements = [
    { title: 'Strength Surge', description: '+5 STR gained', icon: '💪', type: 'stat' },
    { title: 'Knowledge Seeker', description: '7-day learning streak', icon: '🧠', type: 'streak' },
    { title: 'Early Riser', description: 'Morning routine mastery', icon: '🌅', type: 'habit' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="hunter-card mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="hunter-level-badge">
                <div className="hunter-level-number">{stats.level}</div>
                <div className="hunter-level-label">LVL</div>
              </div>
              <div>
                <h1 className="hunter-heading text-2xl mb-1">Hunter Dashboard</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span className="hunter-badge hunter-badge-rank">C-CLASS HUNTER</span>
                  <span>Day {stats.daysSinceStart}</span>
                  <span>Rank #4,327</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="hunter-mono text-lg text-yellow-400">
                {stats.experience.toLocaleString()} XP
              </div>
              <div className="text-sm text-gray-400">
                {stats.experienceToNext} to next level
              </div>
              <div className="hunter-progress mt-2 w-48">
                <div 
                  className="hunter-progress-bar" 
                  style={{ width: `${((stats.experience % 100) / 100) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Quests */}
          <div className="lg:col-span-2">
            <div className="hunter-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="hunter-heading text-xl flex items-center">
                  <Target className="w-6 h-6 mr-2" />
                  Daily Quests
                </h2>
                <div className="hunter-badge hunter-badge-gold">
                  {stats.completedToday}/{questCategories.reduce((acc, cat) => acc + cat.total, 0)} Complete
                </div>
              </div>

              <div className="space-y-4">
                {questCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div key={category.name} className="hunter-quest-item">
                      <div className="flex items-center flex-1">
                        <Icon className="w-5 h-5 mr-3" style={{ color: category.color }} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{category.name} Quests</h3>
                            <span className="hunter-mono text-sm">
                              {category.completed}/{category.total} complete
                            </span>
                          </div>
                          <div className="hunter-progress">
                            <div 
                              className="hunter-progress-bar" 
                              style={{ width: `${category.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex space-x-3">
                <button className="hunter-btn hunter-btn-primary flex-1">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Today's Training
                </button>
                <button className="hunter-btn hunter-btn-secondary">
                  View All Quests
                </button>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            {/* Character Stats */}
            <div className="hunter-card">
              <h2 className="hunter-heading text-lg mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Character Stats
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {statCards.map((stat) => (
                  <div key={stat.label} className="hunter-stat-card">
                    <div className="hunter-stat-value">{stat.value}</div>
                    <div className="hunter-stat-label">{stat.label}</div>
                    <div className="hunter-stat-change">{stat.change} today</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="hunter-card">
              <h2 className="hunter-heading text-lg mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Recent Achievements
              </h2>
              <div className="space-y-3">
                {recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="text-2xl mr-3">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{achievement.title}</div>
                      <div className="text-xs text-gray-400">{achievement.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="hunter-btn hunter-btn-ghost w-full mt-4">
                View All Achievements
              </button>
            </div>

            {/* Quick Actions */}
            <div className="hunter-card">
              <h2 className="hunter-heading text-lg mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="hunter-btn hunter-btn-secondary w-full justify-start">
                  📊 Log Nutrition
                </button>
                <button className="hunter-btn hunter-btn-secondary w-full justify-start">
                  📝 Journal Entry
                </button>
                <button className="hunter-btn hunter-btn-secondary w-full justify-start">
                  📈 View Progress
                </button>
                <button className="hunter-btn hunter-btn-secondary w-full justify-start">
                  🎯 Set New Goal
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress Summary */}
        <div className="hunter-card mt-6">
          <h2 className="hunter-heading text-xl mb-4">Weekly Progress Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">6/7</div>
              <div className="text-sm text-gray-400">Training Days</div>
              <div className="hunter-progress mt-2">
                <div className="hunter-progress-bar" style={{ width: '86%' }} />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">92%</div>
              <div className="text-sm text-gray-400">Nutrition Optimal</div>
              <div className="hunter-progress mt-2">
                <div className="hunter-progress-bar" style={{ width: '92%' }} />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">7.8h</div>
              <div className="text-sm text-gray-400">Sleep Average</div>
              <div className="hunter-progress mt-2">
                <div className="hunter-progress-bar" style={{ width: '78%' }} />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">5.2h</div>
              <div className="text-sm text-gray-400">Learning/Week</div>
              <div className="hunter-progress mt-2">
                <div className="hunter-progress-bar" style={{ width: '65%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HunterDashboard;
import React, { useState } from 'react';
import { User, Target, Zap, Brain, Heart, Sword } from 'lucide-react';
import { UserProfile } from '../types/user';

interface ProfileSetupProps {
  onComplete: (profileData: Partial<UserProfile>) => void;
  onSkip: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    name: '',
    primaryGoals: [] as string[],
    currentLevel: {
      fitness: 1,
      career: 1,
      skills: 1,
      mental: 1,
    },
    challenges: [] as string[],
  });

  const goalOptions = [
    { id: 'fitness', label: 'Get Physically Stronger', icon: Sword },
    { id: 'career', label: 'Advance My Career', icon: Target },
    { id: 'skills', label: 'Learn New Skills', icon: Brain },
    { id: 'mental', label: 'Build Mental Strength', icon: Heart },
    { id: 'habits', label: 'Develop Better Habits', icon: Zap },
    { id: 'social', label: 'Improve Social Skills', icon: User },
  ];

  const challengeOptions = [
    'Lack of motivation',
    'Not enough time',
    'Don\'t know where to start',
    'Inconsistent with habits',
    'Fear of failure',
    'Overwhelmed by goals',
  ];

  const handleGoalToggle = (goalId: string) => {
    setProfileData(prev => ({
      ...prev,
      primaryGoals: prev.primaryGoals.includes(goalId)
        ? prev.primaryGoals.filter(g => g !== goalId)
        : [...prev.primaryGoals, goalId]
    }));
  };

  const handleChallengeToggle = (challenge: string) => {
    setProfileData(prev => ({
      ...prev,
      challenges: prev.challenges.includes(challenge)
        ? prev.challenges.filter(c => c !== challenge)
        : [...prev.challenges, challenge]
    }));
  };

  const handleComplete = () => {
    onComplete(profileData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-purple-500/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome, Future Hunter</h2>
          <p className="text-purple-300">Let me understand your current level so I can guide you better</p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">What should I call you?</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name (optional)"
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-4">What are your main goals? (Select all that apply)</label>
              <div className="grid grid-cols-2 gap-3">
                {goalOptions.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = profileData.primaryGoals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => handleGoalToggle(goal.id)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/20 text-white'
                          : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-purple-500/50'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">{goal.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={onSkip}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Skip Setup
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={profileData.primaryGoals.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-4">What challenges do you face? (Select all that apply)</label>
              <div className="space-y-2">
                {challengeOptions.map((challenge) => {
                  const isSelected = profileData.challenges.includes(challenge);
                  return (
                    <button
                      key={challenge}
                      onClick={() => handleChallengeToggle(challenge)}
                      className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/20 text-white'
                          : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-purple-500/50'
                      }`}
                    >
                      {challenge}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Start My Journey
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSetup;
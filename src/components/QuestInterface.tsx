import React, { useState } from 'react';
import { CheckCircle, Circle, Clock, Play, Pause, RotateCcw, Star } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';

interface Quest {
  id: string;
  title: string;
  type: 'physical' | 'mental' | 'mindset';
  completed: boolean;
  sets?: number;
  currentSet?: number;
  duration?: number;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expReward: number;
}

const QuestInterface: React.FC = () => {
  const { profile, completeQuest: completeQuestInProfile, addExperience, loadProfile } = useUserProfile();
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [formRating, setFormRating] = useState(4);
  const [notes, setNotes] = useState('');

  // Convert profile quests to Quest interface format
  const quests: Quest[] = profile.dailyQuests.map(quest => ({
    id: quest.id,
    title: quest.title,
    type: quest.category as 'physical' | 'mental' | 'mindset',
    completed: quest.completed,
    description: quest.description,
    difficulty: quest.difficulty,
    expReward: quest.experienceReward
  })).concat([
    // Keep some static example quests for demo purposes
    {
      id: 'demo-1',
      title: 'Warm-up: Advanced mobility',
      type: 'physical',
      completed: true,
      duration: 600, // 10 minutes
      difficulty: 'easy',
      expReward: 25
    },
    {
      id: 'demo-2',
      title: 'Archer Push-ups',
      type: 'physical',
      completed: true,
      sets: 3,
      currentSet: 3,
      difficulty: 'hard',
      expReward: 50
    },
    {
      id: 'demo-3',
      title: 'Pistol Squat Negatives',
      type: 'physical',
      completed: true,
      sets: 3,
      currentSet: 3,
      difficulty: 'hard',
      expReward: 50
    },
    {
      id: 'demo-4',
      title: 'L-sit Progressions',
      type: 'physical',
      completed: false,
      sets: 3,
      currentSet: 0,
      difficulty: 'hard',
      expReward: 60,
      description: 'Focus on proper form and gradual progression. Hold for maximum time with good form.'
    },
    {
      id: 'demo-5',
      title: 'Pull-up Negatives',
      type: 'physical',
      completed: false,
      sets: 3,
      difficulty: 'medium',
      expReward: 40
    },
    {
      id: 'demo-6',
      title: 'Tuck Planche Practice',
      type: 'physical',
      completed: false,
      sets: 3,
      difficulty: 'hard',
      expReward: 55
    },
    {
      id: 'demo-7',
      title: 'Read "The Art of Learning"',
      type: 'mental',
      completed: true,
      duration: 1800, // 30 minutes
      difficulty: 'medium',
      expReward: 35
    },
    {
      id: 'demo-8',
      title: 'Study skill acquisition plateaus',
      type: 'mental',
      completed: false,
      duration: 1200, // 20 minutes
      difficulty: 'medium',
      expReward: 30
    },
    {
      id: 'demo-9',
      title: 'Pattern Recognition Training',
      type: 'mindset',
      completed: false,
      duration: 900, // 15 minutes
      difficulty: 'medium',
      expReward: 40
    },
    {
      id: 'demo-10',
      title: 'Strategic Patience Practice',
      type: 'mindset',
      completed: false,
      duration: 600, // 10 minutes
      difficulty: 'easy',
      expReward: 25
    }
  ]);

  const questsByType = {
    physical: quests.filter(q => q.type === 'physical'),
    mental: quests.filter(q => q.type === 'mental'),
    mindset: quests.filter(q => q.type === 'mindset')
  };

  const getProgressPercentage = (type: 'physical' | 'mental' | 'mindset') => {
    const typeQuests = questsByType[type];
    const completed = typeQuests.filter(q => q.completed).length;
    return Math.round((completed / typeQuests.length) * 100);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'physical': return '💪';
      case 'mental': return '🧠';
      case 'mindset': return '🎯';
      default: return '⚡';
    }
  };

  const startQuest = (quest: Quest) => {
    setActiveQuest(quest);
    setCurrentSet(quest.currentSet || 1);
    setTimer(0);
    setFormRating(4);
    setNotes('');
  };

  const completeQuest = async () => {
    if (activeQuest) {
      try {
        console.log('🎯 Starting quest completion for:', activeQuest.title, 'ID:', activeQuest.id);
        
        // Check if this is a real quest from the profile or a demo quest
        const isRealQuest = !activeQuest.id.startsWith('demo-');
        console.log('🔍 Is real quest?', isRealQuest);
        
        if (isRealQuest) {
          // Complete the quest in the backend
          console.log('📤 Calling completeQuestInProfile...');
          const result = await completeQuestInProfile(activeQuest.id);
          console.log('✅ Quest completion result:', result);
        } else {
          // For demo quests, just award some XP
          console.log('🎮 Demo quest - awarding XP:', activeQuest.expReward);
          const result = await addExperience(activeQuest.expReward);
          console.log('✅ XP award result:', result);
        }
        
        // Force reload the profile to see changes
        console.log('🔄 Force reloading profile...');
        await loadProfile();
        console.log('✅ Profile reloaded');
        
        // Force a re-render by updating the quest list
        window.location.reload();
        
        // Close the active quest view
        setActiveQuest(null);
        
        // Reset form state
        setCurrentSet(1);
        setTimer(0);
        setFormRating(4);
        setNotes('');
        
      } catch (error) {
        console.error('❌ Error completing quest:', error);
        alert('Failed to complete quest: ' + error.message);
        // Still close the quest view even if there was an error
        setActiveQuest(null);
      }
    }
  };

  const completeSet = async () => {
    if (activeQuest && activeQuest.sets) {
      if (currentSet < activeQuest.sets) {
        setCurrentSet(currentSet + 1);
        setTimer(30); // 30 second rest
        setIsTimerRunning(true);
      } else {
        // Complete exercise
        await completeQuest();
      }
    } else {
      // No sets, just complete the quest
      await completeQuest();
    }
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const handleSkipRest = () => {
    setTimer(0);
    setIsTimerRunning(false);
  };

  const handleRetrySet = () => {
    if (currentSet > 1) {
      setCurrentSet(currentSet - 1);
    }
    setTimer(0);
    setIsTimerRunning(false);
  };

  if (activeQuest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="hunter-card">
            <div className="flex items-center justify-between mb-6">
              <h1 className="hunter-heading text-2xl">{activeQuest.title}</h1>
              <button 
                onClick={() => setActiveQuest(null)}
                className="hunter-btn hunter-btn-ghost"
              >
                ← Back
              </button>
            </div>

            {/* Exercise Demo Area */}
            <div className="bg-gray-800 rounded-lg p-8 mb-6 text-center">
              <div className="text-6xl mb-4">{getTypeIcon(activeQuest.type)}</div>
              <div className="text-gray-400">Exercise demonstration would go here</div>
              <div className="text-sm text-gray-500 mt-2">
                {activeQuest.description}
              </div>
            </div>

            {/* Set Tracking */}
            {activeQuest.sets && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="hunter-heading text-lg">
                    SET {currentSet}/{activeQuest.sets}
                  </h3>
                  <div className={`hunter-badge ${getDifficultyColor(activeQuest.difficulty)}`}>
                    {activeQuest.difficulty.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Hold Time (seconds)</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      placeholder="Enter hold time"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Form Rating</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setFormRating(star)}
                          className={`text-2xl ${star <= formRating ? 'text-yellow-400' : 'text-gray-600'}`}
                        >
                          <Star className="w-6 h-6" fill={star <= formRating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      rows={2}
                      placeholder="How did this set feel?"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Rest Timer */}
            {timer > 0 && (
              <div className="mb-6 text-center">
                <div className="text-4xl font-mono text-yellow-400 mb-2">
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-gray-400">Rest Time</div>
                <div className="hunter-progress mt-2">
                  <div 
                    className="hunter-progress-bar" 
                    style={{ width: `${((30 - timer) / 30) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {timer === 0 ? (
                <>
                  <button 
                    onClick={completeSet}
                    className="hunter-btn hunter-btn-primary flex-1"
                  >
                    {currentSet < (activeQuest.sets || 1) ? 'Complete Set' : 'Complete Exercise'}
                  </button>
                  <button 
                    onClick={handleRetrySet}
                    className="hunter-btn hunter-btn-secondary"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleSkipRest}
                  className="hunter-btn hunter-btn-secondary flex-1"
                >
                  Skip Rest
                </button>
              )}
            </div>

            {/* XP Reward */}
            <div className="mt-6 text-center">
              <div className="hunter-badge hunter-badge-gold">
                +{activeQuest.expReward} XP Reward
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="hunter-card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="hunter-heading text-3xl mb-2">Day 22 - Intensity Surge</h1>
              <div className="text-gray-400">Complete your daily quests to level up</div>
            </div>
            <div className="text-right">
              <div className="hunter-badge hunter-badge-gold mb-2">
                {quests.filter(q => q.completed).length}/{quests.length} Complete
              </div>
              <div className="text-sm text-gray-400">
                Total XP Available: {quests.reduce((acc, q) => acc + q.expReward, 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Quest Categories */}
        <div className="space-y-6">
          {Object.entries(questsByType).map(([type, typeQuests]) => {
            const progress = getProgressPercentage(type as any);
            const completed = typeQuests.filter(q => q.completed).length;
            
            return (
              <div key={type} className="hunter-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="hunter-heading text-xl flex items-center">
                    <span className="text-2xl mr-3">{getTypeIcon(type)}</span>
                    {type.toUpperCase()} QUESTS
                  </h2>
                  <div className="text-right">
                    <div className="hunter-mono text-lg">
                      {completed}/{typeQuests.length} complete
                    </div>
                    <div className="hunter-progress w-32 mt-1">
                      <div 
                        className="hunter-progress-bar" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {typeQuests.map((quest) => (
                    <div 
                      key={quest.id} 
                      className={`hunter-quest-item ${quest.completed ? 'completed' : ''}`}
                      onClick={() => !quest.completed && startQuest(quest)}
                    >
                      <div className={`hunter-quest-checkbox ${quest.completed ? 'checked' : ''}`}>
                        {quest.completed ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{quest.title}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs ${getDifficultyColor(quest.difficulty)}`}>
                              {quest.difficulty.toUpperCase()}
                            </span>
                            <span className="hunter-badge hunter-badge-gold text-xs">
                              +{quest.expReward} XP
                            </span>
                          </div>
                        </div>
                        {quest.sets && (
                          <div className="text-sm text-gray-400 mt-1">
                            {quest.sets} sets
                          </div>
                        )}
                        {quest.duration && (
                          <div className="text-sm text-gray-400 mt-1">
                            {Math.floor(quest.duration / 60)} minutes
                          </div>
                        )}
                      </div>
                      {!quest.completed && (
                        <button className="hunter-btn hunter-btn-primary ml-4">
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestInterface;
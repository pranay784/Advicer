const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Get user ID from IP address (hashed for privacy)
function getUserIdFromIP(ip) {
  // Remove IPv6 prefix if present
  const cleanIP = ip.replace(/^::ffff:/, '');
  return crypto.createHash('sha256').update(cleanIP + 'sjw-salt').digest('hex').substring(0, 16);
}

// Load users data
async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Save users data
async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Default user profile
function createDefaultProfile(userId) {
  return {
    id: userId,
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
    conversationHistory: [],
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    name: null,
    setupCompleted: false
  };
}

// Routes
app.get('/api/user/profile', async (req, res) => {
  try {
    await ensureDataDir();
    const userId = getUserIdFromIP(req.ip);
    const users = await loadUsers();
    
    if (!users[userId]) {
      users[userId] = createDefaultProfile(userId);
      await saveUsers(users);
    } else {
      // Update last login
      users[userId].lastLogin = new Date().toISOString();
      await saveUsers(users);
    }
    
    res.json(users[userId]);
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

app.post('/api/user/profile', async (req, res) => {
  try {
    await ensureDataDir();
    const userId = getUserIdFromIP(req.ip);
    const users = await loadUsers();
    
    if (!users[userId]) {
      users[userId] = createDefaultProfile(userId);
    }
    
    // Update profile with provided data
    users[userId] = { ...users[userId], ...req.body, lastLogin: new Date().toISOString() };
    await saveUsers(users);
    
    res.json(users[userId]);
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

app.post('/api/user/conversation', async (req, res) => {
  try {
    await ensureDataDir();
    const userId = getUserIdFromIP(req.ip);
    const users = await loadUsers();
    const { message, response } = req.body;
    
    if (!users[userId]) {
      users[userId] = createDefaultProfile(userId);
    }
    
    // Add conversation to history (keep last 50 messages)
    if (!users[userId].conversationHistory) {
      users[userId].conversationHistory = [];
    }
    
    users[userId].conversationHistory.push({
      userMessage: message,
      sjwResponse: response,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 conversations
    if (users[userId].conversationHistory.length > 50) {
      users[userId].conversationHistory = users[userId].conversationHistory.slice(-50);
    }
    
    users[userId].lastLogin = new Date().toISOString();
    await saveUsers(users);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

app.post('/api/user/goal', async (req, res) => {
  try {
    await ensureDataDir();
    const userId = getUserIdFromIP(req.ip);
    const users = await loadUsers();
    
    if (!users[userId]) {
      users[userId] = createDefaultProfile(userId);
    }
    
    const newGoal = {
      id: 'goal_' + Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    users[userId].goals.push(newGoal);
    users[userId].lastLogin = new Date().toISOString();
    await saveUsers(users);
    
    res.json(newGoal);
  } catch (error) {
    console.error('Error adding goal:', error);
    res.status(500).json({ error: 'Failed to add goal' });
  }
});

app.post('/api/user/quest/complete', async (req, res) => {
  try {
    await ensureDataDir();
    const userId = getUserIdFromIP(req.ip);
    const users = await loadUsers();
    const { questId } = req.body;
    
    if (!users[userId]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const quest = users[userId].dailyQuests.find(q => q.id === questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    // Complete quest and award XP
    quest.completed = true;
    quest.streak = (quest.streak || 0) + 1;
    quest.lastCompleted = new Date().toISOString();
    
    users[userId].experience += quest.experienceReward || 10;
    users[userId].level = Math.floor(users[userId].experience / 100) + 1;
    users[userId].lastLogin = new Date().toISOString();
    
    await saveUsers(users);
    
    res.json(users[userId]);
  } catch (error) {
    console.error('Error completing quest:', error);
    res.status(500).json({ error: 'Failed to complete quest' });
  }
});

app.listen(PORT, () => {
  console.log(`Sung Jin Woo Server running on port ${PORT}`);
});
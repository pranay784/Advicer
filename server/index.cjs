const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware
app.use(cors());
app.use(express.json());

// Create default user profile
function createDefaultProfile() {
  return {
    level: 1,
    experience: 0,
    strength: 10,
    endurance: 10,
    agility: 10,
    intelligence: 10,
    willpower: 10,
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
    name: null,
    current_day_id: 1,
    setup_completed: false
  };
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Sung Jin Woo Server is running', status: 'active' });
});

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: hashedPassword,
        name: name || null,
        level: 1,
        experience: 0,
        strength: 10,
        endurance: 10,
        agility: 10,
        intelligence: 10,
        willpower: 10,
        current_day_id: 1,
        setup_completed: false
      }])
      .select('id, email, name, level, experience')
      .single();

    if (insertError) throw insertError;

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, password_hash, level, experience')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Protected route to get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, level, experience, strength, endurance, agility, intelligence, willpower')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

app.get('/api/user/profile', async (req, res) => {
  try {
    // Get user ID from JWT token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    let userId;
    if (token && token !== 'guest_token') {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } else {
      // Handle guest users or fallback to IP-based identification
      userId = req.ip.replace(/^::ffff:/, '');
    }
    
    // Try to find existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq(token && token !== 'guest_token' ? 'id' : 'name', userId)
      .limit(1); // Use limit(1) to handle potential duplicate IPs
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw fetchError;
    }
    
    if (!existingUser || existingUser.length === 0) { // Check if any user was found
      // Create new user
      const defaultProfile = createDefaultProfile();
      defaultProfile.name = userId; // Store identifier
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([defaultProfile])
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      res.json(newUser);
    } else {
      // Update last login
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', existingUser[0].id) // Access the first user's ID
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      res.json(existingUser[0]); // Return the first user found
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

app.post('/api/user/profile', async (req, res) => {
  try {
    // Get user ID from JWT token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    let userId;
    if (token && token !== 'guest_token') {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } else {
      userId = req.ip.replace(/^::ffff:/, '');
    }
    
    // Find user by IP
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq(token && token !== 'guest_token' ? 'id' : 'name', userId)
      .limit(1); // Use limit(1)
      
    if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
    
    // Update user profile
    const updateData = { 
      ...req.body, 
      last_login: new Date().toISOString() 
    };
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData).eq('id', existingUser[0].id) // Access the first user's ID
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

app.post('/api/user/experience', async (req, res) => {
  try {
    // Get user ID from JWT token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    let userId;
    if (token && token !== 'guest_token') {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } else {
      userId = req.ip.replace(/^::ffff:/, '');
    }
    
    const { amount } = req.body;
    
    // Find user by IP
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq(token && token !== 'guest_token' ? 'id' : 'name', userId)
      .limit(1); // Use limit(1)
      
    if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
    
    // Add experience and calculate new level
    const newExperience = existingUser.experience + amount;
    const newLevel = Math.floor(newExperience / 100) + 1;
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        experience: newExperience,
        level: newLevel,
        last_login: new Date().toISOString()
      })
      .eq('id', existingUser[0].id) // Access the first user's ID
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error adding experience:', error);
    res.status(500).json({ error: 'Failed to add experience' });
  }
});

app.post('/api/user/conversation', async (req, res) => {
  try {
    const userIp = req.ip.replace(/^::ffff:/, '');
    const { message, response } = req.body;
    
    // Find user by IP
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('name', userIp)
      .limit(1); // Use limit(1)
      
    if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
    
    // Insert conversation into history
    const { error: insertError } = await supabase
      .from('conversation_history')
      .insert([{
        user_id: existingUser[0].id, // Access the first user's ID
        user_message: message,
        sjw_response: response
      }]);
      
    if (insertError) throw insertError;
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() }).eq('id', existingUser[0].id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

app.post('/api/user/goal', async (req, res) => {
  try {
    const userIp = req.ip.replace(/^::ffff:/, '');
    
    // Find user by IP
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('name', userIp)
      .limit(1); // Use limit(1)
      
    if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
    
    // Insert new goal
    const { data: newGoal, error: insertError } = await supabase
      .from('goals')
      .insert([{
        user_id: existingUser[0].id, // Access the first user's ID
        ...req.body
      }])
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() }).eq('id', existingUser[0].id);
    
    res.json(newGoal);
  } catch (error) {
    console.error('Error adding goal:', error);
    res.status(500).json({ error: 'Failed to add goal' });
  }
});

app.put('/api/user/goal/:goalId', async (req, res) => {
  try {
    const userIp = req.ip.replace(/^::ffff:/, '');
    const { goalId } = req.params;
    
    // Find user by IP
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('name', userIp)
      .limit(1); // Use limit(1)
      
    if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
    
    // Update goal
    const { data: updatedGoal, error: updateError } = await supabase
      .from('goals')
      .update(req.body)
      .eq('id', goalId)
      .eq('user_id', existingUser[0].id) // Access the first user's ID
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    if (!updatedGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() }).eq('id', existingUser[0].id);
    
    res.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

app.post('/api/user/quest', async (req, res) => {
  try {
    const userIp = req.ip.replace(/^::ffff:/, '');
    
    // Find user by IP
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('name', userIp)
      .limit(1); // Use limit(1)
      
    if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
    
    // Insert new quest
    const questData = {
      user_id: existingUser[0].id, // Access the first user's ID
      ...req.body,
      completed: false,
      streak: 0
    };
    
    const { data: newQuest, error: insertError } = await supabase
      .from('daily_quests')
      .insert([questData])
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() }).eq('id', existingUser[0].id);
    
    res.json(newQuest);
  } catch (error) {
    console.error('Error adding quest:', error);
    res.status(500).json({ error: 'Failed to add quest' });
  }
});

app.post('/api/user/quest/complete', async (req, res) => {
  try {
    const userIp = req.ip.replace(/^::ffff:/, '');
    const { questId } = req.body;
    
    // Find user by IP
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('name', userIp)
      .limit(1); // Use limit(1)
      
    if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
    
    // Get quest details
    const { data: quest, error: questError } = await supabase
      .from('daily_quests')
      .select('*')
      .eq('id', questId)
      .eq('user_id', existingUser[0].id) // Access the first user's ID
      .single();
      
    if (questError || !quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    // Update quest completion
    await supabase
      .from('daily_quests')
      .update({
        completed: true,
        streak: quest.streak + 1,
        last_completed: new Date().toISOString()
      })
      .eq('id', questId);
    
    // Update user experience and level
    const newExperience = existingUser.experience + (quest.experience_reward || 10);
    const newLevel = Math.floor(newExperience / 100) + 1;
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        experience: newExperience,
        level: newLevel,
        last_login: new Date().toISOString()
      })
      .eq('id', existingUser[0].id) // Access the first user's ID
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error completing quest:', error);
    res.status(500).json({ error: 'Failed to complete quest' });
  }
});

app.post('/api/user/achievement', async (req, res) => {
  try {
    const userIp = req.ip.replace(/^::ffff:/, '');
    
    // Find user by IP
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('name', userIp)
      .limit(1); // Use limit(1)
      
    if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
    
    // Insert new achievement
    const { data: newAchievement, error: insertError } = await supabase
      .from('achievements')
      .insert([{
        user_id: existingUser[0].id, // Access the first user's ID
        ...req.body
      }, { unlocked_date: new Date().toISOString() }]) // Use unlocked_date
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() }).eq('id', existingUser[0].id);
    
    res.json(newAchievement);
  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(500).json({ error: 'Failed to add achievement' });
  }
});

// New endpoint to get user's goals
app.get('/api/user/goals', async (req, res) => {
  try {
    const userIp = req.ip.replace(/^::ffff:/, '');
    
    // Find user by IP
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('name', userIp)
      .limit(1); // Use limit(1)
      
    if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
    
    // Get user's goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', existingUser[0].id) // Access the first user's ID
      .order('created_at', { ascending: false });
      
    if (goalsError) throw goalsError;
    
    res.json(goals || []);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// New endpoint to get user's daily quests
app.get('/api/user/quests', async (req, res) => {
  try {
    const userIp = req.ip.replace(/^::ffff:/, '');
    
    // Find user by IP
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('name', userIp)
      .limit(1); // Use limit(1)
      
    if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
    
    // Get user's quests
    const { data: quests, error: questsError } = await supabase
      .from('daily_quests')
      .select('*')
      .eq('user_id', existingUser[0].id) // Access the first user's ID
      .order('created_at', { ascending: false });
      
    if (questsError) throw questsError;
    
    res.json(quests || []);
  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

// New endpoint to get user's achievements
app.get('/api/user/achievements', async (req, res) => {
  try {
    const userIp = req.ip.replace(/^::ffff:/, '');
    
    // Find user by IP
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('name', userIp)
      .limit(1); // Use limit(1)
      
    if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
    
    // Get user's achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', existingUser[0].id) // Access the first user's ID
      .order('unlocked_date', { ascending: false });
      
    if (achievementsError) throw achievementsError;
    
    res.json(achievements || []);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// New endpoint to get journey data for a specific day
app.get('/api/journey/:dayNumber', async (req, res) => {
  try {
    const { dayNumber } = req.params;
    
    // Get journey data for the specific day
    const { data: journeyData, error } = await supabase
      .from('journey_data')
      .select('*')
      .eq('day_number', parseInt(dayNumber))
      .order('id', { ascending: true });
      
    if (error) throw error;
    
    res.json(journeyData || []);
  } catch (error) {
    console.error('Error fetching journey data:', error);
    res.status(500).json({ error: 'Failed to fetch journey data' });
  }
});

// Legacy endpoints for backward compatibility (will be removed later)
app.post('/api/user/quest', async (req, res) => {
  try {
    const userIp = req.ip.replace(/^::ffff:/, '');
    
    // Find user by IP
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('name', userIp)
      .limit(1); // Use limit(1)
      
    if (fetchError || !existingUser || existingUser.length === 0) throw new Error('User not found');
    
    // Insert new quest
    const questData = {
      user_id: existingUser[0].id, // Access the first user's ID
      ...req.body,
      completed: false,
      streak: 0
    };
    
    const { data: newQuest, error: insertError } = await supabase
      .from('daily_quests')
      .insert([questData])
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() }).eq('id', existingUser[0].id);
    
    res.json(newQuest);
  } catch (error) {
    console.error('Error adding quest:', error);
    res.status(500).json({ error: 'Failed to add quest' });
  }
});

app.listen(PORT, () => {
  console.log(`Sung Jin Woo Server running on port ${PORT}`);
  console.log('Supabase client initialized successfully');
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
    quest.lastCompleted = new Date().toISOString(); // This is for local file system, not Supabase
    
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

app.post('/api/user/achievement', async (req, res) => {
  try {
    await ensureDataDir();
    const userId = getUserIdFromIP(req.ip);
    const users = await loadUsers();
    
    if (!users[userId]) {
      users[userId] = createDefaultProfile(userId);
    }
    
    const newAchievement = {
      id: 'achievement_' + Date.now(),
      ...req.body,
      unlockedDate: new Date().toISOString() // Use unlockedDate for local file system
    };
    
    users[userId].achievements.push(newAchievement);
    users[userId].lastLogin = new Date().toISOString();
    await saveUsers(users);
    
    res.json(newAchievement);
  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(500).json({ error: 'Failed to add achievement' });
  }
});

app.listen(PORT, () => {
  console.log(`Sung Jin Woo Server running on port ${PORT}`);
});
# Sung Jin Woo Leveling Coach

A personal development chatbot inspired by Solo Leveling, where Sung Jin Woo helps you level up in real life through goal setting, habit tracking, and personalized coaching.

## Features

- 🤖 AI-powered conversations with Sung Jin Woo personality
- 📊 Personal progress tracking and leveling system
- 🎯 Goal setting and achievement system
- ⚡ Daily quest management
- 💾 Persistent local storage of progress
- 🎮 Gamified personal development experience

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory and add your OpenRouter API key:

```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**Get your API key:**
1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Sign up/login and create a new API key
3. Copy the key to your `.env` file

### 2. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 3. Netlify Deployment

**Option A: Drag & Drop**
1. Run `npm run build`
2. Drag the `dist` folder to Netlify dashboard

**Option B: Git Integration**
1. Push code to GitHub/GitLab
2. Connect repository in Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`

**Important: Set Environment Variables in Netlify**
1. Go to Site Settings → Environment Variables
2. Add: `VITE_OPENROUTER_API_KEY` with your API key value

### 4. Custom Domain (Optional)

In Netlify:
- Go to Domain Settings → Options → Edit site name
- Change to something like `sung-jin-woo-coach`
- Your site will be available at `sung-jin-woo-coach.netlify.app`

## Usage

1. **First Visit**: Complete the profile setup to tell Sung Jin Woo about your goals
2. **Daily Use**: Chat with Sung Jin Woo for personalized coaching and advice
3. **Track Progress**: Your level, XP, goals, and achievements are automatically saved
4. **Set Goals**: Create specific goals and track your progress over time
5. **Daily Quests**: Build consistent habits through gamified daily tasks

## Technologies Used

- React + TypeScript
- Tailwind CSS
- OpenRouter API (Claude 3.5 Sonnet)
- Vite
- Local Storage for persistence

## Troubleshooting

**"Connection Lost" Error:**
- Make sure your OpenRouter API key is properly set in environment variables
- Check your internet connection
- Verify the API key is valid and has credits

**Site Not Loading:**
- Clear browser cache
- Check browser console for errors
- Ensure all environment variables are set correctly

## License

MIT License - Feel free to use and modify for your personal development journey!
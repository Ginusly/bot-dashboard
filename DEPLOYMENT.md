# 📋 Deployment Guide - Bot + Dashboard 24/7

## 🏗️ Project Structure
- **Discord Bot**: Node.js + discord.js
- **Dashboard Server**: Express.js + SQLite + Firebase
- **Frontend Client**: React + Vite
- **Database**: SQLite + Firebase

## 🚀 Deployment Options

### Option 1: Railway.app (Recommended - Free Tier)
**Pros**: Free, Easy, Auto-deployment from GitHub
**Cons**: Limited resources

#### Setup:
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

#### Environment Variables:
```
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
PORT=5000
NODE_ENV=production
SESSION_SECRET=your_secure_session_secret
DATABASE_PATH=/app/database.sqlite
CLIENT_URL=https://your-app.railway.app
CALLBACK_URL=https://your-app.railway.app/api/auth/discord/callback
```

### Option 2: VPS (Professional - $5-10/month)
**Pros**: Full control, Better performance
**Cons**: Manual setup, Maintenance required

#### Server Requirements:
- Ubuntu 20.04+ or CentOS 8+
- 2GB RAM minimum
- 20GB Storage
- Node.js 18+

#### Setup Commands:
```bash
# Update server
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt install nginx

# Clone repository
git clone https://github.com/yourusername/bot-dashboard.git
cd bot-dashboard

# Install dependencies
npm install --production
cd client && npm install && npm run build && cd ..

# Setup PM2
pm2 start bot/bot.js --name "discord-bot"
pm2 start server/index.js --name "dashboard-server"
pm2 startup
pm2 save

# Setup Nginx (see nginx.conf below)
```

#### Nginx Configuration (`/etc/nginx/sites-available/dashboard`):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /path/to/bot-dashboard/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 3: Render.com (Alternative Free Option)
- Similar to Railway
- Good for beginners
- Automatic SSL

## 📁 File Structure for Production

```
bot-dashboard/
├── .env (production variables)
├── database.sqlite
├── bot/
│   └── bot.js
├── server/
│   └── index.js
├── client/
│   └── dist/ (built frontend)
└── shared/
    └── database.js
```

## 🔧 Environment Setup

### Production .env:
```env
# Discord Configuration
DISCORD_TOKEN=your_actual_discord_bot_token
CLIENT_ID=your_discord_application_client_id
CLIENT_SECRET=your_discord_application_client_secret

# Server Configuration
PORT=5000
NODE_ENV=production
SESSION_SECRET=your_very_secure_random_session_secret

# Database Configuration
DATABASE_PATH=/app/database.sqlite

# URL Configuration
CLIENT_URL=https://your-domain.com
CALLBACK_URL=https://your-domain.com/api/auth/discord/callback

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 🛠️ Deployment Scripts

### Quick Deploy Script:
```bash
chmod +x deploy.sh
./deploy.sh all
```

### Manual Deployment Steps:
1. **Build Frontend**: `cd client && npm run build`
2. **Deploy Backend**: Push to GitHub (Railway/Render) or run PM2 commands
3. **Deploy Frontend**: Push dist folder to Vercel/Netlify or serve via Nginx

## 🔒 Security Considerations

1. **Never commit .env files** to version control
2. **Use strong session secrets** (32+ random characters)
3. **Enable HTTPS** in production
4. **Regular updates** of dependencies
5. **Database backups** regularly
6. **Monitor logs** for suspicious activity

## 📊 Monitoring & Maintenance

### PM2 Commands (VPS):
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Monitor
pm2 monit
```

### Railway/Render:
- Built-in monitoring dashboard
- Automatic restarts on crashes
- Log viewing in dashboard

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: railway-app/railway-action@v1
        with:
          api-token: ${{ secrets.RAILWAY_TOKEN }}
```

## 🆘 Troubleshooting

### Common Issues:
1. **Bot doesn't start**: Check DISCORD_TOKEN and intents
2. **Database errors**: Verify file permissions and paths
3. **CORS issues**: Check CLIENT_URL configuration
4. **Session problems**: Verify SESSION_SECRET and cookie settings

### Log Locations:
- **PM2**: `pm2 logs` or `~/.pm2/logs/`
- **Railway**: Dashboard > Logs
- **Render**: Dashboard > Logs
- **Nginx**: `/var/log/nginx/`

## 📞 Support

For deployment issues:
1. Check logs first
2. Verify environment variables
3. Test locally with production settings
4. Check platform documentation (Railway/Render/Vercel)

---

**🎉 Your bot and dashboard will be running 24/7 after following this guide!**

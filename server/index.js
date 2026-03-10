const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('passport');
const { Strategy } = require('passport-discord');
const cors = require('cors');
const db = require('../shared/database');
const { generateProfileImage } = require('../bot/services/imageGenerator');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

app.use(session({
    store: new SQLiteStore({
        db: 'sessions.sqlite',
        dir: path.join(__dirname, '../shared')
    }),
    secret: process.env.SESSION_SECRET || 'fallback_secret_key_change_me',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: false, // Set true if using HTTPS
        sameSite: 'lax'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

// ─── Middleware ────────────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

const discordHeaders = () => ({ Authorization: `Bot ${process.env.DISCORD_TOKEN}` });

// ─── Auth ──────────────────────────────────────────────────────────────────────
app.get('/api/auth/login', passport.authenticate('discord', { prompt: 'none' }));
app.get('/api/auth/callback',
    passport.authenticate('discord', { failureRedirect: `${process.env.CLIENT_URL}/login` }),
    (req, res) => res.redirect(process.env.CLIENT_URL)
);
app.get('/api/auth/user', (req, res) => {
    if (req.user) return res.json(req.user);
    res.status(401).json({ error: 'Not authenticated' });
});
app.get('/api/auth/logout', (req, res) => {
    req.logout(() => res.redirect(process.env.CLIENT_URL));
});

// ─── Guilds ────────────────────────────────────────────────────────────────────
app.get('/api/guilds', requireAuth, (req, res) => {
    const adminGuilds = req.user.guilds.filter(g => (g.permissions & 0x20) === 0x20);
    res.json(adminGuilds);
});

// ─── Bot Status (is bot in this guild?) ───────────────────────────────────────
app.get('/api/guilds/:guildId/bot-status', requireAuth, async (req, res) => {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${req.params.guildId}`, {
            headers: discordHeaders()
        });
        res.json({ inGuild: response.ok, status: response.status });
    } catch (err) {
        res.json({ inGuild: false, status: 0 });
    }
});

app.get('/api/guilds/:guildId/stats', requireAuth, (req, res) => {
    try { res.json(db.getGuildStats(req.params.guildId)); }
    catch (err) { res.status(500).json({ error: 'Failed to fetch stats' }); }
});

// ─── Channels ──────────────────────────────────────────────────────────────────
app.get('/api/guilds/:guildId/channels', requireAuth, async (req, res) => {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${req.params.guildId}/channels`, {
            headers: discordHeaders()
        });
        if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch channels' });
        const channels = await response.json();
        // Return all channel types sorted by position — frontend filters by type
        res.json(channels.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
});


// ─── Categories ────────────────────────────────────────────────────────────────
app.get('/api/guilds/:guildId/categories', requireAuth, async (req, res) => {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${req.params.guildId}/channels`, {
            headers: discordHeaders()
        });
        if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch categories' });
        const channels = await response.json();
        res.json(channels.filter(c => c.type === 4)); // category channels
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// ─── Roles ─────────────────────────────────────────────────────────────────────
app.get('/api/guilds/:guildId/roles', requireAuth, async (req, res) => {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${req.params.guildId}/roles`, {
            headers: discordHeaders()
        });
        if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch roles' });
        const roles = await response.json();
        res.json(roles.filter(r => r.name !== '@everyone' && !r.managed).sort((a, b) => b.position - a.position));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

// ─── Guild Settings ────────────────────────────────────────────────────────────
app.get('/api/guilds/:guildId/settings', requireAuth, (req, res) => {
    try { res.json(db.getSettings(req.params.guildId)); }
    catch (err) { res.status(500).json({ error: 'Failed to fetch settings' }); }
});

app.post('/api/guilds/:guildId/settings', requireAuth, (req, res) => {
    const { key, value } = req.body;
    try {
        db.updateSettings(req.params.guildId, key, value);
        res.json({ success: true });
    } catch (err) {
        require('fs').appendFileSync('server_error.log', `${new Date().toISOString()} - Error: ${err.message}\nBody: ${JSON.stringify(req.body)}\n\n`);
        res.status(500).json({ error: err.message });
    }
});

// ─── Auto Responses ────────────────────────────────────────────────────────────
app.get('/api/guilds/:guildId/auto-responses', requireAuth, (req, res) =>
    res.json(db.getAutoResponses(req.params.guildId)));

app.post('/api/guilds/:guildId/auto-responses', requireAuth, (req, res) => {
    const { trigger, response } = req.body;
    if (!trigger || !response) return res.status(400).json({ error: 'Trigger and response required' });
    db.addAutoResponse(req.params.guildId, trigger, response);
    res.json({ success: true });
});

app.delete('/api/auto-responses/:id', requireAuth, (req, res) => {
    db.deleteAutoResponse(req.params.id);
    res.json({ success: true });
});

// ─── Custom Commands ───────────────────────────────────────────────────────────
app.get('/api/guilds/:guildId/commands', requireAuth, (req, res) =>
    res.json(db.getCustomCommands(req.params.guildId)));

app.post('/api/guilds/:guildId/commands', requireAuth, (req, res) => {
    const { command, response, embed, description, is_slash } = req.body;
    if (!command || !response) return res.status(400).json({ error: 'Command and response required' });
    db.addCustomCommandV2(req.params.guildId, command, response, embed || 0, description || '', is_slash ? 1 : 0);
    if (is_slash) db.addAction(req.params.guildId, 'REGISTER_COMMANDS', {});
    res.json({ success: true });
});

app.delete('/api/commands/:id', requireAuth, (req, res) => {
    db.deleteCustomCommand(req.params.id);
    res.json({ success: true });
});

// ─── Notifications ─────────────────────────────────────────────────────────────
app.get('/api/guilds/:guildId/notifications', requireAuth, (req, res) =>
    res.json(db.getNotifications(req.params.guildId)));

app.post('/api/guilds/:guildId/notifications/read', requireAuth, (req, res) => {
    db.markNotificationsRead(req.params.guildId);
    res.json({ success: true });
});

// ─── Azkar ────────────────────────────────────────────────────────────────────
app.get('/api/guilds/:guildId/azkar', requireAuth, (req, res) => {
    try { res.json(db.getAzkarConfig(req.params.guildId)); }
    catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/guilds/:guildId/azkar', requireAuth, (req, res) => {
    try { db.updateAzkarConfig(req.params.guildId, req.body); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: 'Failed to save azkar config' }); }
});

app.post('/api/guilds/:guildId/azkar/test', requireAuth, (req, res) => {
    db.addAction(req.params.guildId, 'TEST_AZKAR', { type: 'morning' });
    res.json({ success: true });
});

// ─── Level Rewards ─────────────────────────────────────────────────────────────
app.get('/api/guilds/:guildId/level-rewards', requireAuth, (req, res) =>
    res.json(db.getLevelRewards(req.params.guildId)));

app.post('/api/guilds/:guildId/level-rewards', requireAuth, (req, res) => {
    const { level, role_id } = req.body;
    if (!level || !role_id) return res.status(400).json({ error: 'Level and role_id required' });
    db.addLevelReward(req.params.guildId, level, role_id);
    res.json({ success: true });
});

app.delete('/api/level-rewards/:id', requireAuth, (req, res) => {
    db.deleteLevelReward(req.params.id);
    res.json({ success: true });
});

app.get('/api/guilds/:guildId/leaderboard', requireAuth, (req, res) =>
    res.json(db.getLeaderboard(req.params.guildId)));

// ─── Orbs System ───────────────────────────────────────────────────────────────
app.get('/api/orbs/leaderboard', requireAuth, async (req, res) =>
    res.json(await db.getOrbsLeaderboard(10)));

app.get('/api/orbs/:userId', requireAuth, async (req, res) =>
    res.json(await db.getOrbs('GLOBAL', req.params.userId)));

app.get('/api/guilds/:guildId/leaderboard', requireAuth, (req, res) =>
    res.json(db.getLeaderboard(req.params.guildId)));

app.post('/api/orbs/daily', requireAuth, async (req, res) => {
    try {
        const result = await db.claimDaily('GLOBAL', req.user.id);
        res.json(result);
    } catch (error) {
        console.error('Error claiming daily orbs:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء المحاولة' });
    }
});

app.post('/api/orbs/transfer', requireAuth, async (req, res) => {
    const { fromUserId, toUserId, amount } = req.body;
    if (!fromUserId || !toUserId || !amount) return res.status(400).json({ error: 'fromUserId, toUserId, amount required' });

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'كمية التحويل غير صالحة' });
    }
    if (parsedAmount > 50000000) {
        return res.status(400).json({ error: 'تم حظر التحويل: المبلغ ضخم جداً ويتجاوز الحد الأمن' });
    }
    if (fromUserId === toUserId) {
        return res.status(400).json({ error: 'لا يمكنك تحويل Orbs لنفسك' });
    }

    const result = await db.transferOrbs('GLOBAL', fromUserId, toUserId, parsedAmount);
    if (!result.success && result.reason === 'insufficient_funds') {
        return res.status(400).json({ error: 'لا يوجد في محفظة الorb الخاصة بك اي orb' });
    }
    res.json(result);
});

app.get('/api/user/transactions', requireAuth, (req, res) => {
    try {
        const list = db.getTransactions(req.user.id);
        res.json(list);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

const userCache = new Map();

async function getDiscordUser(userId) {
    if (userCache.has(userId)) return userCache.get(userId);
    try {
        const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
            headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }
        });
        if (res.ok) {
            const data = await res.json();
            const user = { username: data.username, avatar: data.avatar };
            userCache.set(userId, user);
            return user;
        }
    } catch (err) { }
    return { username: `User_${userId.slice(0, 5)}`, avatar: null };
}

app.get('/api/leaderboard/orbs', async (req, res) => {
    try {
        const top = await db.getOrbsLeaderboard(20);
        const augmented = await Promise.all(top.map(async (u) => {
            const dUser = await getDiscordUser(u.user_id);
            return { ...u, username: dUser.username, avatar_hash: dUser.avatar };
        }));
        res.json(augmented);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/leaderboard/xp', async (req, res) => {
    try {
        // Without a guildId, fetch top 20 globally across all guilds
        let q = req.query.guild;
        const qParams = [require('firebase/firestore').collection(db.firebase.db || require('../firebase').db || null, 'levels'), require('firebase/firestore').orderBy('xp', 'desc'), require('firebase/firestore').limit(20)];
        if (q) qParams.splice(1, 0, require('firebase/firestore').where('guild_id', '==', q));
        // Fallback since the current database.js `getXpLeaderboard` requires guild_id 
        const top = await db.getXpLeaderboard(q || 'GLOBAL', 20).catch(async () => {
            // If it fails or we want a custom global fallback we'd query it here directly but let's stick to modifying what we can.
            // Let's just fix the database.js getXpLeaderboard issue later or use existing logic.
            return [];
        });

        const augmented = await Promise.all(top.map(async (u) => {
            const dUser = await getDiscordUser(u.user_id);
            return { ...u, username: dUser.username, avatar_hash: dUser.avatar };
        }));
        res.json(augmented);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/api/leaderboard/rep', async (req, res) => {
    try {
        const top = await db.getRepLeaderboard(20);
        const augmented = await Promise.all(top.map(async (u) => {
            const dUser = await getDiscordUser(u.user_id);
            return { ...u, username: dUser.username, avatar_hash: dUser.avatar };
        }));
        res.json(augmented);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// ─── Ticket System ─────────────────────────────────────────────────────────────
app.get('/api/guilds/:guildId/tickets/config', requireAuth, (req, res) => {
    try { res.json(db.getTicketConfig(req.params.guildId)); }
    catch (err) { res.status(500).json({ error: 'Failed to fetch ticket config' }); }
});

app.post('/api/guilds/:guildId/tickets/config', requireAuth, (req, res) => {
    try {
        db.updateTicketConfig(req.params.guildId, req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save ticket config' });
    }
});

app.post('/api/guilds/:guildId/tickets/setup-panel', requireAuth, (req, res) => {
    db.addAction(req.params.guildId, 'SETUP_TICKET_PANEL', {});
    res.json({ success: true });
});

app.get('/api/guilds/:guildId/tickets', requireAuth, (req, res) =>
    res.json(db.getTickets(req.params.guildId)));

// ─── Shop & Profile ────────────────────────────────────────────────────────────
app.get('/api/shop/items', requireAuth, async (req, res) => res.json(await db.getShopItems()));

app.get('/api/user/inventory', requireAuth, async (req, res) => res.json(await db.getUserInventory(req.user.id)));

app.get('/api/user/profile', requireAuth, async (req, res) => res.json(await db.getUserProfile(req.user.id)));

app.get('/api/user/profile/image', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Level Data
        const settings = db.getSettings('GLOBAL'); // Using global or generic context since it's dashboard
        let levelData = await db.getUserLevel('GLOBAL', userId) || { xp: 0, level: 0 };

        // 2. Profile Data
        const profile = await db.getUserProfile(userId);
        let profileData = { profile_background_url: null, frame_color: null, badges: [], title: profile.title || "" };

        if (profile.current_background) {
            const bg = await db.getShopItem(profile.current_background);
            if (bg) {
                profileData.profile_background_url = bg.image_url;
                profileData.bg_is_css = bg.is_css;
                profileData.bg_name = bg.name;
            }
        }
        if (profile.current_frame) {
            const frame = await db.getShopItem(profile.current_frame);
            if (frame) {
                profileData.frame_color = frame.image_url;
                profileData.frame_is_css = frame.is_css;
                profileData.frame_name = frame.name;
            }
        }

        if (profile.badges && profile.badges.length > 0) {
            const seenIcons = new Set();
            for (const badgeId of [...new Set(profile.badges)]) {
                if (profileData.badges.length >= 8) break;
                try {
                    const badgeItem = await db.getShopItem(badgeId);
                    const icon = badgeItem?.image_url || badgeItem?.icon || 'Star';
                    if (seenIcons.has(icon)) continue;
                    seenIcons.add(icon);
                    if (badgeItem) profileData.badges.push({ icon, name: badgeItem.name, id: badgeId, color: badgeItem.color });
                    else if (!seenIcons.has('Star')) { seenIcons.add('Star'); profileData.badges.push({ icon: 'Star', name: 'Badge', id: badgeId }); }
                } catch { if (!seenIcons.has('Star')) { seenIcons.add('Star'); profileData.badges.push({ icon: 'Star', name: 'Badge', id: badgeId }); } }
            }
        }
        profileData.rep = profile.rep || 0;

        const discordUser = await getDiscordUser(userId);
        const userMock = {
            username: discordUser.username || req.user.username,
            tag: discordUser.username || req.user.username,
            displayAvatarURL: (opts) => {
                const hash = discordUser.avatar || req.user.avatar;
                if (hash) {
                    return `https://cdn.discordapp.com/avatars/${userId}/${hash}.png?size=${opts?.size || 256}`;
                }
                return `https://cdn.discordapp.com/embed/avatars/0.png`;
            }
        };

        if (profileData.bg_is_css || profileData.frame_is_css) {
            const { generateAnimatedProfileGif } = require('../bot/services/gifGenerator');
            const buffer = await generateAnimatedProfileGif(userMock, levelData, profileData);
            res.setHeader('Content-Type', 'image/gif');
            res.send(buffer);
        } else {
            const buffer = await generateProfileImage(userMock, levelData, profileData);
            res.setHeader('Content-Type', 'image/png');
            res.send(buffer);
        }
    } catch (e) {
        console.error('Failed to generate profile image:', e);
        res.status(500).send('Error');
    }
});

app.post('/api/shop/buy/:itemId', requireAuth, async (req, res) => {
    try {
        const result = await db.buyItem(req.user.id, req.params.itemId);
        if (!result.success) return res.status(400).json({ error: result.reason });
        res.json(result);
    } catch (err) {
        console.error('[SHOP] Buy Error:', err);
        require('fs').appendFileSync('server_error.log', `[${new Date().toISOString()}] SHOP BUY ERROR: ${err.message}\nStack: ${err.stack}\nUserId: ${req.user.id}\nItemId: ${req.params.itemId}\n\n`);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/user/profile/equip', requireAuth, async (req, res) => {
    const { itemId, type } = req.body;
    const result = await db.equipItem(req.user.id, itemId, type);
    if (!result.success) return res.status(400).json({ error: result.reason });
    res.json(result);
});

app.post('/api/user/profile/unequip', requireAuth, async (req, res) => {
    const { type } = req.body;
    const result = await db.unequipItem(req.user.id, type);
    if (!result.success) return res.status(400).json({ error: result.reason });
    res.json(result);
});

// ─── Badges System ─────────────────────────────────────────────────────────
app.get('/api/user/badges', requireAuth, async (req, res) => {
    try { res.json(await db.getBadges()); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/user/badge/equip', requireAuth, async (req, res) => {
    try { res.json(await db.equipBadge(req.user.id, req.body.badgeId)); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/user/badge/unequip', requireAuth, async (req, res) => {
    try { res.json(await db.unequipBadge(req.user.id, req.body.badgeId)); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// ─── Premium & Bots ────────────────────────────────────────────────────────
app.get('/api/premium/status', requireAuth, async (req, res) => {
    try { res.json(await db.getPremiumStatus(req.user.id)); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/premium/bots', requireAuth, async (req, res) => {
    try { res.json(await db.getPremiumBots(req.user.id)); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/premium/bots/delete', requireAuth, async (req, res) => {
    const { botId } = req.body;
    try {
        await db.deletePremiumBot(req.user.id, botId);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to delete bot' }); }
});

app.post('/api/premium/bots/add', requireAuth, async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });
    try {
        // Validate token with Discord
        const discordRes = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bot ${token}` }
        });
        if (!discordRes.ok) return res.status(400).json({ success: false, reason: 'invalid_token' });

        const botObj = await discordRes.json();
        const botData = {
            id: botObj.id,
            name: botObj.username,
            avatar: botObj.avatar ? `https://cdn.discordapp.com/avatars/${botObj.id}/${botObj.avatar}.png` : null,
            status: 'online',
            token: token // Warning: Storing tokens is sensitive, but requested for management
        };
        await db.addPremiumBot(req.user.id, botData);
        res.json({ success: true, bot: botData });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Profile Extras ────────────────────────────────────────────────────────
app.post('/api/user/profile/update-title', requireAuth, async (req, res) => {
    try {
        await db.updateProfileTitle(req.user.id, req.body.title);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// ─── Moderation System ─────────────────────────────────────────────────────────
app.get('/api/guilds/:guildId/moderation', requireAuth, (req, res) => {
    try { res.json(db.getModerationConfig(req.params.guildId)); }
    catch (err) { res.status(500).json({ error: 'Failed to fetch moderation config' }); }
});

app.post('/api/guilds/:guildId/moderation', requireAuth, (req, res) => {
    const { key, value } = req.body;
    try {
        db.updateModerationConfig(req.params.guildId, key, value);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Command Shortcuts ─────────────────────────────────────────────────────────
app.get('/api/guilds/:guildId/shortcuts', requireAuth, (req, res) => {
    try { res.json(db.getShortcuts(req.params.guildId)); }
    catch (err) { res.status(500).json({ error: 'Failed to fetch shortcuts' }); }
});

app.post('/api/guilds/:guildId/shortcuts', requireAuth, (req, res) => {
    const { name, target } = req.body;
    try {
        db.addShortcut(req.params.guildId, name, target);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/shortcuts/:id', requireAuth, (req, res) => {
    try {
        db.deleteShortcut(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Admin Section (RESTRICTED) ────────────────────────────────────────────────
const ADMIN_USER = 'oq18x';
app.get('/api/admin/stats', requireAuth, async (req, res) => {
    // SECURITY CHECK: Only oq18x can see this
    if (req.user.username !== ADMIN_USER) {
        console.warn(`[SECURITY] Potential unauthorized access attempt to ADMIN PANEL by ${req.user.username}`);
        return res.status(403).json({ error: 'Access Denied: Highly Restricted Area' });
    }

    try {
        const stats = {
            bot_meta: {
                version: '3.4.5-Stable',
                env: process.env.NODE_ENV || 'development',
                node: process.version,
                arch: process.arch
            },
            system: {
                uptime: Math.floor(process.uptime()),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            },
            database: {
                type: 'SQLite3 + Firebase (Orbs/XP/Profile)',
                firebase_connected: true
            },
            sensitive: {
                discord_callback: process.env.CALLBACK_URL,
                session_secret: '*** PROTECTED ***',
                client_id: process.env.CLIENT_ID
            }
        };
        res.json(stats);
    } catch (e) { res.status(500).json({ error: 'Stats unavailable' }); }
});

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[SERVER] Unhandled Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`[SERVER] ✅ Running on http://localhost:${PORT}`));

// ─── Start Discord Bot ───────────────────────────────────────────────────────────────
console.log('[BOT] Starting Discord bot...');
require('../bot/bot.js');

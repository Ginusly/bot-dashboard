const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new Database(dbPath);
const firebase = require('./firebase');

// Performance modes
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 4000');
db.pragma('foreign_keys = ON');

// ─── Core Tables ───────────────────────────────────────────────────────────────
db.prepare(`CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    prefix TEXT DEFAULT '!',
    welcome_channel TEXT,
    welcome_message TEXT DEFAULT 'مرحباً بك {user}!',
    logs_channel TEXT,
    admin_role TEXT,
    welcome_enabled INTEGER DEFAULT 0,
    levels_enabled INTEGER DEFAULT 0,
    level_up_channel TEXT
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS auto_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    trigger TEXT,
    response TEXT,
    UNIQUE(guild_id, trigger)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS custom_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    command TEXT,
    response TEXT,
    embed INTEGER DEFAULT 0,
    description TEXT,
    is_slash INTEGER DEFAULT 0,
    UNIQUE(guild_id, command)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    type TEXT,
    message TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS maintenance_mode (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 0,
    message TEXT DEFAULT 'النظام تحت الصيانة',
    allowed_roles TEXT,
    start_time DATETIME,
    end_time DATETIME
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS azkar_config (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT,
    enabled INTEGER DEFAULT 0,
    morning_time TEXT DEFAULT '07:00',
    evening_time TEXT DEFAULT '18:00',
    send_morning INTEGER DEFAULT 1,
    send_evening INTEGER DEFAULT 1
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS pending_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    type TEXT,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS custom_azkar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    content TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS level_rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    level INTEGER,
    role_id TEXT,
    UNIQUE(guild_id, level)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS orb_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    from_user TEXT,
    to_user TEXT,
    amount INTEGER,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS ticket_config (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT,
    category_id TEXT,
    support_roles TEXT DEFAULT '[]',
    panel_message_id TEXT,
    enabled INTEGER DEFAULT 0,
    ticket_count INTEGER DEFAULT 0
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY,
    guild_id TEXT,
    user_id TEXT,
    channel_id TEXT,
    reason TEXT,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    claimed_by TEXT,
    claimed_at DATETIME,
    priority TEXT DEFAULT 'medium'
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS shop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, 
    name TEXT,
    price INTEGER,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, name)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS user_inventory (
    user_id TEXT,
    item_id INTEGER,
    PRIMARY KEY(user_id, item_id),
    FOREIGN KEY(item_id) REFERENCES shop_items(id)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    current_background INTEGER,
    current_frame INTEGER,
    title TEXT DEFAULT '',
    rep INTEGER DEFAULT 0,
    badges TEXT DEFAULT '[]',
    FOREIGN KEY(current_background) REFERENCES shop_items(id),
    FOREIGN KEY(current_frame) REFERENCES shop_items(id)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS command_shortcuts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT, 
    name TEXT,
    target_command TEXT,
    UNIQUE(guild_id, name)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS moderation_config (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 0,
    anti_spam INTEGER DEFAULT 0,
    anti_link INTEGER DEFAULT 0,
    anti_invite INTEGER DEFAULT 0,
    bad_words TEXT DEFAULT '[]',
    ignored_roles TEXT DEFAULT '[]',
    ignored_channels TEXT DEFAULT '[]'
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT,
    reason TEXT,
    mod_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS reputation_log (
    from_user TEXT,
    to_user TEXT,
    last_rep DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(from_user, to_user)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS guild_points (
    guild_id TEXT,
    user_id TEXT,
    points INTEGER DEFAULT 0,
    PRIMARY KEY(guild_id, user_id)
)`).run();

// ─── Migrations ────────────────────────────────────────────────────────────────
function ensureColumn(table, column, type) {
    try {
        const info = db.prepare(`PRAGMA table_info(${table})`).all();
        if (!info.some(col => col.name === column)) {
            db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
            console.log(`[DB] Added column: ${table}.${column}`);
        }
    } catch (e) { }
}

ensureColumn('guild_settings', 'welcome_enabled', 'INTEGER DEFAULT 0');
ensureColumn('guild_settings', 'levels_enabled', 'INTEGER DEFAULT 0');
ensureColumn('guild_settings', 'level_up_channel', 'TEXT');
ensureColumn('guild_settings', 'suggestions_channel', 'TEXT');

const ALLOWED_SETTINGS_COLUMNS = new Set([
    'prefix', 'welcome_channel', 'welcome_message', 'logs_channel',
    'admin_role', 'welcome_enabled', 'welcome_type', 'welcome_image',
    'welcome_data', 'boost_channel', 'boost_message', 'boost_image',
    'boost_data', 'auto_role', 'levels_enabled', 'level_up_channel', 'suggestions_channel'
]);

// ─── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
    firebase,
    // ── Guild Settings ──────────────────────────────────────────────────────────
    getSettings: (guildId) => {
        let s = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
        if (!s) {
            db.prepare('INSERT INTO guild_settings (guild_id) VALUES (?)').run(guildId);
            s = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
        }
        return s;
    },
    updateSettings: (guildId, key, value) => {
        if (!ALLOWED_SETTINGS_COLUMNS.has(key)) throw new Error(`Invalid settings key: ${key}`);
        db.prepare('INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)').run(guildId);
        return db.prepare(`UPDATE guild_settings SET ${key} = ? WHERE guild_id = ?`).run(value, guildId);
    },

    // ── Auto Responses ──────────────────────────────────────────────────────────
    getAutoResponses: (guildId) => db.prepare('SELECT * FROM auto_responses WHERE guild_id = ?').all(guildId),
    addAutoResponse: (guildId, trigger, response) =>
        db.prepare('INSERT OR REPLACE INTO auto_responses (guild_id, trigger, response) VALUES (?, ?, ?)').run(guildId, trigger, response),
    deleteAutoResponse: (id) => db.prepare('DELETE FROM auto_responses WHERE id = ?').run(id),

    // ── Custom Commands ─────────────────────────────────────────────────────────
    getCustomCommands: (guildId) => db.prepare('SELECT * FROM custom_commands WHERE guild_id = ?').all(guildId),
    addCustomCommandV2: (guildId, command, response, embed, description, is_slash) =>
        db.prepare('INSERT OR REPLACE INTO custom_commands (guild_id, command, response, embed, description, is_slash) VALUES (?, ?, ?, ?, ?, ?)').run(guildId, command, response, embed, description, is_slash),
    deleteCustomCommand: (id) => db.prepare('DELETE FROM custom_commands WHERE id = ?').run(id),

    // ── Azkar Config ────────────────────────────────────────────────────────────
    getAzkarConfig: (guildId) => {
        let c = db.prepare('SELECT * FROM azkar_config WHERE guild_id = ?').get(guildId);
        if (!c) {
            db.prepare('INSERT INTO azkar_config (guild_id) VALUES (?)').run(guildId);
            c = db.prepare('SELECT * FROM azkar_config WHERE guild_id = ?').get(guildId);
        }
        return c;
    },
    updateAzkarConfig: (guildId, data) => {
        const { channel_id, enabled, morning_time, evening_time, send_morning, send_evening } = data;
        return db.prepare(`
            INSERT INTO azkar_config (guild_id, channel_id, enabled, morning_time, evening_time, send_morning, send_evening)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET
            channel_id=excluded.channel_id, enabled=excluded.enabled,
            morning_time=excluded.morning_time, evening_time=excluded.evening_time,
            send_morning=excluded.send_morning, send_evening=excluded.send_evening
        `).run(guildId, channel_id || null, enabled ? 1 : 0, morning_time || '07:00', evening_time || '18:00', send_morning ? 1 : 0, send_evening ? 1 : 0);
    },

    // ── Custom Azkar ────────────────────────────────────────────────────────────
    getCustomAzkar: (guildId) => db.prepare('SELECT * FROM custom_azkar WHERE guild_id = ?').all(guildId),
    addCustomAzkar: (guildId, content, imageUrl) =>
        db.prepare('INSERT INTO custom_azkar (guild_id, content, image_url) VALUES (?, ?, ?)').run(guildId, content, imageUrl),
    deleteCustomAzkar: (id) => db.prepare('DELETE FROM custom_azkar WHERE id = ?').run(id),

    // ── Notifications ───────────────────────────────────────────────────────────
    getNotifications: (guildId) => db.prepare('SELECT * FROM notifications WHERE guild_id = ? ORDER BY created_at DESC LIMIT 20').all(guildId),
    addNotification: (guildId, type, message) =>
        db.prepare('INSERT INTO notifications (guild_id, type, message) VALUES (?, ?, ?)').run(guildId, type, message),
    markNotificationsRead: (guildId) => db.prepare("UPDATE notifications SET read = 1 WHERE guild_id = ?").run(guildId),

    // ─── Orbs (Firebase Integrated) ───────────────────────────────────────────
    getOrbs: async (guildId, userId) => {
        const docId = `GLOBAL_${userId}`;
        const docRef = firebase.doc(firebase.db, 'economy', docId);
        const docSnap = await firebase.getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                balance: data.balance || 0,
                total_earned: data.total_earned || 0,
                last_daily: data.last_daily || null,
                user_id: userId,
                guild_id: 'GLOBAL'
            };
        }
        const data = { balance: 0, total_earned: 0, last_daily: null, user_id: userId, guild_id: 'GLOBAL' };
        await firebase.setDoc(docRef, data);
        return data;
    },
    addOrbs: async (guildId, userId, amount, reason = 'system', fromUserId = 'SYSTEM') => {
        const docId = `GLOBAL_${userId}`;
        const docRef = firebase.doc(firebase.db, 'economy', docId);
        const docSnap = await firebase.getDoc(docRef);
        let balance = amount;
        let total = amount > 0 ? amount : 0;
        if (docSnap.exists()) {
            balance = (docSnap.data().balance || 0) + amount;
            total = (docSnap.data().total_earned || 0) + (amount > 0 ? amount : 0);
        }
        await firebase.setDoc(docRef, { balance, total_earned: total, user_id: userId }, { merge: true });
        db.prepare('INSERT INTO orb_transactions (guild_id, from_user, to_user, amount, reason) VALUES (?, ?, ?, ?, ?)').run(guildId, fromUserId, userId, amount, reason);
        return { balance };
    },
    transferOrbs: async (guildId, fromUserId, toUserId, amount) => {
        const sender = await module.exports.getOrbs('GLOBAL', fromUserId);
        if (sender.balance < amount) return { success: false, reason: 'insufficient_funds' };
        if (amount <= 0) return { success: false, reason: 'invalid_amount' };

        await module.exports.addOrbs('GLOBAL', fromUserId, -amount, `transfer`, toUserId);
        await module.exports.addOrbs('GLOBAL', toUserId, amount, `transfer`, fromUserId);

        return { success: true };
    },
    getTransactions: (userId) => {
        return db.prepare('SELECT * FROM orb_transactions WHERE from_user = ? OR to_user = ? ORDER BY created_at DESC LIMIT 50').all(userId, userId);
    },
    getOrbsLeaderboard: async (limitCount = 100) => {
        const q = firebase.query(firebase.collection(firebase.db, 'economy'), firebase.orderBy('balance', 'desc'), firebase.limit(limitCount));
        const snap = await firebase.getDocs(q);
        return snap.docs.map(d => d.data());
    },
    getXpLeaderboard: async (guildId, limitCount = 10) => {
        const q = firebase.query(
            firebase.collection(firebase.db, 'levels'),
            firebase.where('guild_id', '==', guildId),
            firebase.orderBy('xp', 'desc'),
            firebase.limit(limitCount)
        );
        const snap = await firebase.getDocs(q);
        return snap.docs.map(d => d.data());
    },
    claimDaily: async (guildId, userId) => {
        const today = new Date().toISOString().split('T')[0];
        const orbs = await module.exports.getOrbs('GLOBAL', userId);
        if (orbs.last_daily === today) return { success: false, reason: 'already_claimed' };
        const bonus = 50;
        await module.exports.addOrbs('GLOBAL', userId, bonus, 'daily');
        const docRef = firebase.doc(firebase.db, 'economy', `GLOBAL_${userId}`);
        await firebase.updateDoc(docRef, { last_daily: today });
        return { success: true, amount: bonus };
    },

    // ─── Levels (Firebase Integrated) ───────────────────────────────────────────
    getUserLevel: async (guildId, userId) => {
        const docId = `${guildId}_${userId}`;
        const docRef = firebase.doc(firebase.db, 'levels', docId);
        const docSnap = await firebase.getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                xp: data.xp || 0,
                level: data.level || 0,
                guild_id: guildId,
                user_id: userId
            };
        }
        return { xp: 0, level: 0, guild_id: guildId, user_id: userId };
    },
    updateUserXP: async (guildId, userId, xp, level) => {
        const docId = `${guildId}_${userId}`;
        const docRef = firebase.doc(firebase.db, 'levels', docId);
        await firebase.setDoc(docRef, {
            xp, level, guild_id: guildId, user_id: userId
        }, { merge: true });
    },
    getLevelRewards: (guildId) => db.prepare('SELECT * FROM level_rewards WHERE guild_id = ? ORDER BY level ASC').all(guildId),
    addLevelReward: (guildId, level, roleId) =>
        db.prepare('INSERT OR REPLACE INTO level_rewards (guild_id, level, role_id) VALUES (?, ?, ?)').run(guildId, level, roleId),
    deleteLevelReward: (id) => db.prepare('DELETE FROM level_rewards WHERE id = ?').run(id),

    // ─── Tickets ────────────────────────────────────────────────────────────────
    getTicketConfig: (guildId) => {
        let c = db.prepare('SELECT * FROM ticket_config WHERE guild_id = ?').get(guildId);
        if (!c) {
            db.prepare('INSERT INTO ticket_config (guild_id) VALUES (?)').run(guildId);
            c = db.prepare('SELECT * FROM ticket_config WHERE guild_id = ?').get(guildId);
        }
        if (c?.support_roles) try { c.support_roles = JSON.parse(c.support_roles); } catch { c.support_roles = []; }
        return c;
    },
    updateTicketConfig: (guildId, data) => {
        const { channel_id, category_id, support_roles, enabled } = data;
        return db.prepare(`INSERT INTO ticket_config (guild_id, channel_id, category_id, support_roles, enabled)
            VALUES (?, ?, ?, ?, ?) ON CONFLICT(guild_id) DO UPDATE SET
            channel_id=excluded.channel_id, category_id=excluded.category_id, support_roles=excluded.support_roles, enabled=excluded.enabled`)
            .run(guildId, channel_id, category_id, JSON.stringify(support_roles || []), enabled ? 1 : 0);
    },
    createTicket: (guildId, userId, channelId, reason) =>
        db.prepare('INSERT INTO tickets (guild_id, user_id, channel_id, reason) VALUES (?, ?, ?, ?)').run(guildId, userId, channelId, reason),
    getTickets: (guildId) => db.prepare('SELECT * FROM tickets WHERE guild_id = ? ORDER BY created_at DESC').all(guildId),

    // ─── Profile & Shop (Hyper-Optimized & Secure) ─────────────────────────────────────────
    getShopItems: async (type) => {
        try {
            const q = type && type !== 'all' ?
                firebase.query(firebase.collection(firebase.db, 'shop_items'), firebase.where('type', '==', type)) :
                firebase.collection(firebase.db, 'shop_items');

            const snap = await firebase.getDocs(q);
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { return []; }
    },

    getShopItem: async (id) => {
        try {
            const docRef = firebase.doc(firebase.db, 'shop_items', id);
            const docSnap = await firebase.getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        } catch (e) { return null; }
    },

    getUserInventory: async (userId) => {
        if (!module.exports._cache) module.exports._cache = {};
        const cacheKey = `inv_${userId}`;
        if (module.exports._cache[cacheKey]) return module.exports._cache[cacheKey];

        try {
            const docRef = firebase.doc(firebase.db, 'user_inventory', userId);
            const docSnap = await firebase.getDoc(docRef);
            const items = docSnap.exists() ? docSnap.data().items || [] : [];

            module.exports._cache[cacheKey] = items;
            setTimeout(() => delete module.exports._cache[cacheKey], 30000); // كاش لمدة 30 ثانية
            return items;
        } catch (e) { return []; }
    },

    buyItem: async (userId, itemId) => {
        const lockKey = `lock_buy_${userId}`;
        if (module.exports._cache?.[lockKey]) return { success: false, reason: 'request_pending' };
        if (!module.exports._cache) module.exports._cache = {};
        module.exports._cache[lockKey] = true;

        try {
            const item = await module.exports.getShopItem(itemId);
            if (!item) throw new Error('item_not_found');

            const orbs = await module.exports.getOrbs('GLOBAL', userId);
            if (orbs.balance < item.price) throw new Error('insufficient_funds');

            const inventory = await module.exports.getUserInventory(userId);
            if (inventory.includes(itemId)) throw new Error('already_owned');

            await module.exports.addOrbs('GLOBAL', userId, -item.price, `buy_item_${itemId}`);

            const invRef = firebase.doc(firebase.db, 'user_inventory', userId);
            await firebase.setDoc(invRef, { items: firebase.arrayUnion(itemId) }, { merge: true });

            if (module.exports._cache) delete module.exports._cache[`inv_${userId}`];
            return { success: true };
        } catch (e) {
            return { success: false, reason: e.message };
        } finally {
            delete module.exports._cache[lockKey];
        }
    },

    getUserProfile: async (userId) => {
        const cacheKey = `prof_${userId}`;
        if (module.exports._cache?.[cacheKey]) return module.exports._cache[cacheKey];

        try {
            const docRef = firebase.doc(firebase.db, 'user_profiles', userId);
            const docSnap = await firebase.getDoc(docRef);
            let profile = docSnap.exists() ? docSnap.data() : null;

            if (!profile) {
                profile = { user_id: userId, current_background: null, current_frame: null, title: '', rep: 0, badges: [] };
                await firebase.setDoc(docRef, profile);
            }

            // Ensure important fields exist
            profile.title = profile.title || '';
            profile.rep = profile.rep || 0;
            profile.badges = profile.badges || [];

            if (!module.exports._cache) module.exports._cache = {};
            module.exports._cache[cacheKey] = profile;
            setTimeout(() => delete module.exports._cache[cacheKey], 60000); 
            return profile;
        } catch (e) { 
            return { user_id: userId, title: '', rep: 0, badges: [] }; 
        }
    },

    equipItem: async (userId, itemId, type) => {
        try {
            const inv = await module.exports.getUserInventory(userId);
            if (!inv.includes(itemId)) return { success: false, reason: 'not_owned' };

            const profRef = firebase.doc(firebase.db, 'user_profiles', userId);
            const col = type === 'background' ? 'current_background' : 'current_frame';
            await firebase.setDoc(profRef, { [col]: itemId }, { merge: true });

            if (module.exports._cache) delete module.exports._cache[`prof_${userId}`];
            return { success: true };
        } catch (e) { return { success: false, reason: e.message }; }
    },

    unequipItem: async (userId, type) => {
        try {
            const profRef = firebase.doc(firebase.db, 'user_profiles', userId);
            const col = type === 'background' ? 'current_background' : 'current_frame';
            await firebase.setDoc(profRef, { [col]: null }, { merge: true });

            if (module.exports._cache) delete module.exports._cache[`prof_${userId}`];
            return { success: true };
        } catch (e) { return { success: false, reason: e.message }; }
    },

    // ─── Moderation ─────────────────────────────────────────────────────────────
    getModerationConfig: (guildId) => {
        let c = db.prepare('SELECT * FROM moderation_config WHERE guild_id = ?').get(guildId);
        if (!c) {
            db.prepare('INSERT INTO moderation_config (guild_id) VALUES (?)').run(guildId);
            c = db.prepare('SELECT * FROM moderation_config WHERE guild_id = ?').get(guildId);
        }
        ['bad_words', 'ignored_roles', 'ignored_channels'].forEach(key => {
            try { c[key] = JSON.parse(c[key] || '[]'); } catch { c[key] = []; }
        });
        return c;
    },
    updateModerationConfig: (guildId, key, value) => {
        const finalValue = Array.isArray(value) ? JSON.stringify(value) : value;
        db.prepare('INSERT OR IGNORE INTO moderation_config (guild_id) VALUES (?)').run(guildId);
        return db.prepare(`UPDATE moderation_config SET ${key} = ? WHERE guild_id = ?`).run(finalValue, guildId);
    },

    // ─── Shortcuts ──────────────────────────────────────────────────────────
    getShortcuts: (guildId) => db.prepare('SELECT * FROM command_shortcuts WHERE guild_id = ? OR guild_id = ?').all('GLOBAL', guildId),
    addShortcut: (guildId, name, target) => db.prepare('INSERT OR REPLACE INTO command_shortcuts (guild_id, name, target_command) VALUES (?, ?, ?)').run(guildId, name, target),
    deleteShortcut: (id) => db.prepare('DELETE FROM command_shortcuts WHERE id = ?').run(id),

    getGuildStats: (guildId) => {
        const totalMembers = db.prepare('SELECT COUNT(*) as count FROM user_levels WHERE guild_id = ?').get(guildId)?.count || 0;
        const totalXp = db.prepare('SELECT SUM(xp) as sum FROM user_levels WHERE guild_id = ?').get(guildId)?.sum || 0;
        const totalTickets = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE guild_id = ?').get(guildId)?.count || 0;
        return { totalMembers, totalXp, totalTickets };
    },

    // ─── Deleted SQLite profile/rep logic (Moved to Firebase fully) ───

    // ─── Warnings ─────────────────────────────────────────────────────────────
    addWarning: (guildId, userId, modId, reason) => {
        return db.prepare('INSERT INTO warnings (guild_id, user_id, mod_id, reason) VALUES (?, ?, ?, ?)').run(guildId, userId, modId, reason);
    },
    getWarnings: (guildId, userId) => {
        return db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
    },
    removeWarning: (id) => db.prepare('DELETE FROM warnings WHERE id = ?').run(id),
    clearWarnings: (guildId, userId) => db.prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?').run(guildId, userId),

    // ─── Points ──────────────────────────────────────────────────────────────
    addPoints: (guildId, userId, amount) => {
        db.prepare('INSERT OR IGNORE INTO guild_points (guild_id, user_id, points) VALUES (?, ?, 0)').run(guildId, userId);
        return db.prepare('UPDATE guild_points SET points = points + ? WHERE guild_id = ? AND user_id = ?').run(amount, guildId, userId);
    },
    getPoints: (guildId, userId) => db.prepare('SELECT points FROM guild_points WHERE guild_id = ? AND user_id = ?').get(guildId, userId)?.points || 0,

    // ─── Premium & Membership ──────────────────────────────────────────────────
    getPremiumStatus: async (userId) => {
        const docRef = firebase.doc(firebase.db, 'premium_info', userId);
        const snap = await firebase.getDoc(docRef);
        return snap.exists() ? snap.data() : { is_premium: false };
    },
    setPremiumStatus: async (userId, data) => {
        const docRef = firebase.doc(firebase.db, 'premium_info', userId);
        await firebase.setDoc(docRef, { ...data, updated_at: new Date() }, { merge: true });
    },
    getPremiumBots: async (userId) => {
        const q = firebase.query(firebase.collection(firebase.db, 'premium_bots'), firebase.where('owner_id', '==', userId));
        const snap = await firebase.getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    addPremiumBot: async (userId, botData) => {
        const colRef = firebase.collection(firebase.db, 'premium_bots');
        await firebase.addDoc(colRef, { ...botData, owner_id: userId, created_at: new Date() });
    },

    // ─── User Profile Extra ────────────────────────────────────────────────────
    updateProfileTitle: async (userId, title) => {
        const profRef = firebase.doc(firebase.db, 'user_profiles', userId);
        await firebase.setDoc(profRef, { title }, { merge: true });
        if (module.exports._cache) delete module.exports._cache[`prof_${userId}`];
    },

    // ─── Badges System ─────────────────────────────────────────────────────────
    getBadges: async () => {
        const q = firebase.query(firebase.collection(firebase.db, 'shop_items'), firebase.where('type', '==', 'badge'));
        const snap = await firebase.getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    equipBadge: async (userId, badgeId) => {
        try {
            const badgeItem = await module.exports.getShopItem(badgeId);
            if (!badgeItem) throw new Error('Badge not found');

            if (badgeItem.price > 0) {
                const inv = await module.exports.getUserInventory(userId);
                if (!inv.includes(badgeId)) throw new Error('You do not own this badge');
            }

            // Get current badges, deduplicate, limit to 8
            const profRef = firebase.doc(firebase.db, 'user_profiles', userId);
            const snap = await firebase.getDoc(profRef);
            const existing = snap.exists() ? (snap.data().badges || []) : [];
            const deduped = [...new Set([...existing, badgeId])].slice(0, 8);
            await firebase.setDoc(profRef, { badges: deduped }, { merge: true });
            if (module.exports._cache) delete module.exports._cache[`prof_${userId}`];
            return { success: true };
        } catch (e) {
            return { success: false, reason: e.message };
        }
    },
    unequipBadge: async (userId, badgeId) => {
        const profRef = firebase.doc(firebase.db, 'user_profiles', userId);
        await firebase.setDoc(profRef, { badges: firebase.arrayRemove(badgeId) }, { merge: true });
        if (module.exports._cache) delete module.exports._cache[`prof_${userId}`];
        return { success: true };
    },
    deletePremiumBot: async (userId, botId) => {
        const botsRef = firebase.collection(firebase.db, 'premium_bots');
        const q = firebase.query(botsRef, firebase.where('owner_id', '==', userId), firebase.where('id', '==', botId));
        const snap = await firebase.getDocs(q);
        const batch = firebase.writeBatch(firebase.db);
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();
        return { success: true };
    },
    saveStarboardMessage: (guildId, origId, starId) => db.prepare('INSERT INTO starboard_messages (guild_id, original_msg_id, starboard_msg_id) VALUES (?, ?, ?)').run(guildId, origId, starId),
    getStarboardMessage: (origId) => db.prepare('SELECT * FROM starboard_messages WHERE original_msg_id = ?').get(origId),
    getStarboardConfig: (guildId) => db.prepare('SELECT * FROM starboard_config WHERE guild_id = ?').get(guildId),

    // ─── Pending Actions ────────────────────────────────────────────────────────
    getPendingActions: () => db.prepare('SELECT * FROM pending_actions ORDER BY created_at ASC').all(),
    deleteAction: (id) => db.prepare('DELETE FROM pending_actions WHERE id = ?').run(id),
    addPendingAction: (guildId, type, data) => db.prepare('INSERT INTO pending_actions (guild_id, type, data) VALUES (?, ?, ?)').run(guildId, type, JSON.stringify(data || {})),

    // ─── Ticket Extra ───────────────────────────────────────────────────────────
    updateTicketPanelMessageId: (guildId, msgId) => db.prepare('UPDATE ticket_config SET panel_message_id = ? WHERE guild_id = ?').run(msgId, guildId),
    getTicketByChannel: (channelId) => db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId),
    closeTicket: (channelId) => db.prepare('UPDATE tickets SET status = "closed", closed_at = CURRENT_TIMESTAMP WHERE channel_id = ?').run(channelId),
    incrementTicketCount: (guildId) => {
        const count = (db.prepare('SELECT ticket_count FROM ticket_config WHERE guild_id = ?').get(guildId)?.ticket_count || 0) + 1;
        db.prepare('UPDATE ticket_config SET ticket_count = ? WHERE guild_id = ?').run(count, guildId);
        return count;
    },

    // ─── Reputation System ───────────────────────────────────────────────────
    addRep: async (fromUserId, toUserId) => {
        const today = new Date().toISOString().split('T')[0];
        const docId = `rep_${fromUserId}_${toUserId}`;
        const repRef = firebase.doc(firebase.db, 'rep_history', docId);
        const repSnap = await firebase.getDoc(repRef);

        if (repSnap.exists() && repSnap.data().last_given === today) {
            return { success: false, reason: 'cooldown' };
        }

        await firebase.setDoc(repRef, { last_given: today }, { merge: true });

        const targetRef = firebase.doc(firebase.db, 'user_profiles', toUserId);
        const targetSnap = await firebase.getDoc(targetRef);
        const currentRep = targetSnap.exists() ? (targetSnap.data().rep || 0) : 0;

        await firebase.setDoc(targetRef, { rep: currentRep + 1 }, { merge: true });

        return { success: true };
    },

    // ─── Maintenance Mode ─────────────────────────────────────────────────────
    setMaintenanceMode: (guildId, enabled, message = null, allowedRoles = null, endTime = null) => {
        db.prepare(`
            INSERT OR REPLACE INTO maintenance_mode 
            (guild_id, enabled, message, allowed_roles, start_time, end_time) 
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
        `).run(guildId, enabled ? 1 : 0, message, allowedRoles ? JSON.stringify(allowedRoles) : null, endTime);
    },

    getMaintenanceMode: (guildId) => {
        const maintenance = db.prepare('SELECT * FROM maintenance_mode WHERE guild_id = ?').get(guildId);
        if (maintenance && maintenance.allowed_roles) {
            maintenance.allowed_roles = JSON.parse(maintenance.allowed_roles);
        }
        return maintenance;
    },

    isMaintenanceMode: (guildId) => {
        const maintenance = db.prepare('SELECT enabled, end_time FROM maintenance_mode WHERE guild_id = ?').get(guildId);
        if (!maintenance || !maintenance.enabled) return false;

        // Check if maintenance has expired
        if (maintenance.end_time && new Date(maintenance.end_time) < new Date()) {
            db.prepare('UPDATE maintenance_mode SET enabled = 0 WHERE guild_id = ?').run(guildId);
            return false;
        }

        return true;
    },

    canBypassMaintenance: (member, maintenance) => {
        if (!maintenance || !member) return false;

        // Check if user has admin permissions
        if (member.permissions.has('Administrator')) return true;

        // Check if user has allowed roles
        if (maintenance.allowed_roles && maintenance.allowed_roles.length > 0) {
            return member.roles.cache.some(role => maintenance.allowed_roles.includes(role.id));
        }

        return false;
    },

    getRepLeaderboard: async (limitCount = 100) => {
        const q = firebase.query(
            firebase.collection(firebase.db, 'user_profiles'),
            firebase.orderBy('rep', 'desc'),
            firebase.limit(limitCount)
        );
        const snap = await firebase.getDocs(q);
        return snap.docs.map(d => ({ user_id: d.id, rep: d.data().rep || 0 }));
    }
};

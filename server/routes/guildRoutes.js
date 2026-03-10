const express = require('express');
const db = require('../../shared/database');
const { discordHeaders } = require('../utils/discordUtils');

const router = express.Router();

// ─── Guild Routes ────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
    const adminGuilds = req.user.guilds.filter(g => (g.permissions & 0x20) === 0x20);
    res.json(adminGuilds);
});

// ─── Bot Status (is bot in this guild?) ───────────────────────────────────────
router.get('/:guildId/bot-status', async (req, res) => {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${req.params.guildId}`, {
            headers: discordHeaders()
        });
        res.json({ inGuild: response.ok, status: response.status });
    } catch (err) {
        res.json({ inGuild: false, status: 0 });
    }
});

router.get('/:guildId/stats', (req, res) => {
    try { 
        res.json(db.getGuildStats(req.params.guildId)); 
    } catch (err) { 
        res.status(500).json({ error: 'Failed to fetch stats' }); 
    }
});

// ─── Channels ──────────────────────────────────────────────────────────────────
router.get('/:guildId/channels', async (req, res) => {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${req.params.guildId}/channels`, {
            headers: discordHeaders()
        });
        if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch channels' });
        const channels = await response.json();
        res.json(channels);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
});

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/:guildId/categories', async (req, res) => {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${req.params.guildId}/channels`, {
            headers: discordHeaders()
        });
        if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch categories' });
        const channels = await response.json();
        const categories = channels.filter(c => c.type === 4);
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// ─── Roles ───────────────────────────────────────────────────────────────────
router.get('/:guildId/roles', async (req, res) => {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${req.params.guildId}/roles`, {
            headers: discordHeaders()
        });
        if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch roles' });
        const roles = await response.json();
        res.json(roles);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

module.exports = router;

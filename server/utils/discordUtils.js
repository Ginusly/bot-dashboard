const discordHeaders = () => ({ Authorization: `Bot ${process.env.DISCORD_TOKEN}` });

const requireAuth = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

const validateGuildAccess = (req, res, next) => {
    const guildId = req.params.guildId;
    const userGuilds = req.user.guilds;
    
    const hasAccess = userGuilds.some(guild => 
        guild.id === guildId && (guild.permissions & 0x20) === 0x20
    );
    
    if (!hasAccess) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
};

module.exports = {
    discordHeaders,
    requireAuth,
    validateGuildAccess
};

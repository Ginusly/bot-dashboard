const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
    Client, GatewayIntentBits, Collection, PermissionFlagsBits
} = require('discord.js');

const db = require('../shared/database');
const schedule = require('node-schedule');
const { generateCanvasImage } = require('./services/imageGenerator');

// Import modular components
const CommandLoader = require('./handlers/commandLoader');
const InteractionHandler = require('./handlers/interactionHandler');
const SlashCommandRegister = require('./handlers/slashCommandRegister');
const AzkarSystem = require('./systems/azkarSystem');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ]
});

// Initialize collections and systems
client.commands = new Collection();
const xpCooldowns = new Set();
const spamTracker = new Map();

// Initialize handlers and systems
const commandLoader = new CommandLoader(client);
const interactionHandler = new InteractionHandler(client);
const slashCommandRegister = new SlashCommandRegister(client);
const azkarSystem = new AzkarSystem(client);

// Load commands on startup
commandLoader.loadCommands();

// ─── Ready Event ────────────────────────────────────────────────────────────────
client.once('ready', () => {
    console.log(`[BOT] ✅ Logged in as ${client.user.tag}`);
    scheduleAzkar();
    setInterval(checkPendingActions, 3000);
    client.user.setActivity('🔮 Umbral Bot', { type: 0 });
    
    // Register global commands
    slashCommandRegister.registerGlobalCommands();
});

// ─── Pending Actions Queue ─────────────────────────────────────────────────────
async function checkPendingActions() {
    try {
        const actions = db.getPendingActions();
        for (const action of actions) {
            try {
                await processAction(action);
            } catch (err) {
                console.error(`[BOT] Error processing action ${action.type}:`, err.message);
            }
            db.deleteAction(action.id);
        }
    } catch (error) {
        console.error('[BOT] Error in pending actions loop:', error);
    }
}

async function processAction(action) {
    const guild = client.guilds.cache.get(action.guild_id);
    if (!guild) return console.warn(`[BOT] Guild not found: ${action.guild_id}`);

    switch (action.type) {
        case 'TEST_AZKAR':
            await azkarSystem.testAzkar(guild);
            break;

        case 'REGISTER_COMMANDS':
            await slashCommandRegister.registerGuildCommands(action.guild_id);
            break;

        case 'SETUP_TICKET_PANEL':
            await interactionHandler.ticketSystem.createTicketPanel(guild, action.data?.channelId);
            break;

        default:
            console.warn(`[BOT] Unknown action type: ${action.type}`);
    }
}

// ─── Azkar Scheduling ─────────────────────────────────────────────────────────
function scheduleAzkar() {
    // Schedule morning azkar at 7:00 AM
    schedule.scheduleJob('0 7 * * *', () => {
        client.guilds.cache.forEach(guild => {
            azkarSystem.sendAzkar(guild, 'morning');
        });
    });

    // Schedule evening azkar at 6:00 PM
    schedule.scheduleJob('0 18 * * *', () => {
        client.guilds.cache.forEach(guild => {
            azkarSystem.sendAzkar(guild, 'evening');
        });
    });

    console.log('[BOT] Azkar scheduling initialized');
}

// ─── Interaction Handler ───────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {
    await interactionHandler.handleInteraction(interaction);
});

// ─── Message Events ────────────────────────────────────────────────────────────
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Handle custom commands including !@ owner command
    await interactionHandler.handleMessage(message);

    // XP System - Temporarily disabled to fix !@ command
    /*
    if (!xpCooldowns.has(message.author.id)) {
        xpCooldowns.add(message.author.id);
        setTimeout(() => xpCooldowns.delete(message.author.id), 60000);

        const currentXp = (await db.getUserLevel(message.guild.id, message.author.id)).xp || 0;
        const currentLevel = (await db.getUserLevel(message.guild.id, message.author.id)).level || 0;
        const newXp = currentXp + Math.floor(Math.random() * 15) + 10;
        const newLevel = Math.floor(newXp / 100);

        db.setUserXP(message.guild.id, message.author.id, newXp);

        if (newLevel > currentLevel) {
            db.setUserLevel(message.guild.id, message.author.id, newLevel);
            
            const levelRewards = db.getLevelRewards(message.guild.id);
            const reward = levelRewards.find(r => r.level === newLevel);
            
            if (reward) {
                const role = message.guild.roles.cache.get(reward.role_id);
                if (role) {
                    await message.member.roles.add(role);
                    const levelUpEmbed = new EmbedBuilder()
                        .setTitle('🎉 ترقية مستوى!')
                        .setDescription(`مبروك! لقد وصلت إلى المستوى ${newLevel}`)
                        .addFields(
                            { name: 'المكافأة', value: `الدور: ${role.name}`, inline: true }
                        )
                        .setColor('#00ff00');
                    await message.channel.send({ embeds: [levelUpEmbed] });
                }
            }
        }
    }
    */

    // Auto-responses
    const autoResponses = db.getAutoResponses(message.guild.id);
    const response = autoResponses.find(r => 
        message.content.toLowerCase().includes(r.trigger.toLowerCase())
    );
    
    if (response) {
        message.reply(response.response);
    }

    // Spam detection
    if (!spamTracker.has(message.author.id)) {
        spamTracker.set(message.author.id, []);
    }
    
    const userMessages = spamTracker.get(message.author.id);
    userMessages.push(Date.now());
    
    const recentMessages = userMessages.filter(time => Date.now() - time < 5000);
    spamTracker.set(message.author.id, recentMessages);
    
    if (recentMessages.length >= 5) {
        const member = await message.guild.members.fetch(message.author.id);
        if (member) {
            await member.timeout(300000, 'Spam detection');
            message.reply('⚠️ تم إيقافك مؤقتاً بسبب السبام.');
        }
    }
});

// ─── Guild Events ─────────────────────────────────────────────────────────────
client.on('guildMemberAdd', async member => {
    const settings = db.getGuildSettings(member.guild.id);
    if (settings?.welcome_enabled && settings?.welcome_channel) {
        const channel = member.guild.channels.cache.get(settings.welcome_channel);
        if (channel) {
            const welcomeMessage = settings.welcome_message
                .replace('{user}', member.toString())
                .replace('{server}', member.guild.name);
            
            // Generate welcome image
            try {
                const imageBuffer = await generateCanvasImage(member);
                await channel.send({
                    content: welcomeMessage,
                    files: [{ attachment: imageBuffer, name: 'welcome.png' }]
                });
            } catch (err) {
                console.error('[BOT] Error generating welcome image:', err);
                await channel.send(welcomeMessage);
            }
        }
    }
});

client.on('guildMemberRemove', async member => {
    const settings = db.getGuildSettings(member.guild.id);
    if (settings?.welcome_enabled && settings?.welcome_channel) {
        const channel = member.guild.channels.cache.get(settings.welcome_channel);
        if (channel) {
            const leaveMessage = `👋 غادر العضو ${member.user.tag} السيرفر`;
            await channel.send(leaveMessage);
        }
    }
});

// ─── Error Handling ────────────────────────────────────────────────────────────
process.on('unhandledRejection', error => {
    console.error('[BOT] Unhandled Rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('[BOT] Uncaught Exception:', error);
});

client.on('error', error => {
    console.error('[BOT] Discord.js Error:', error);
});

// ─── Login Events ───────────────────────────────────────────────────────────────────
client.on('ready', () => {
    console.log('🤖 Bot is online!');
    console.log(`🔥 Logged in as ${client.user.tag}!`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
});

// ─── Login ───────────────────────────────────────────────────────────────────────
console.log('[BOT] Attempting to login with Discord...');
console.log('[BOT] Token exists:', !!process.env.DISCORD_TOKEN);

client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('[BOT] Failed to login:', err);
    process.exit(1);
});

// Export for testing purposes
module.exports = {
    client,
    commandLoader,
    interactionHandler,
    slashCommandRegister,
    azkarSystem
};

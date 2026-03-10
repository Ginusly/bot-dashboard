const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
    Client, GatewayIntentBits, Collection, EmbedBuilder, REST, Routes,
    SlashCommandBuilder, ModalBuilder, ActionRowBuilder, ButtonBuilder,
    TextInputBuilder, ButtonStyle, TextInputStyle, ChannelType, PermissionFlagsBits
} = require('discord.js');

const db = require('../shared/database');
const schedule = require('node-schedule');
const { generateCanvasImage } = require('./services/imageGenerator');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ]
});

client.commands = new Collection();
const xpCooldowns = new Set();
const spamTracker = new Map();

async function loadCommands() {
    client.commands.clear();
    const commandsPath = path.join(__dirname, 'commands');
    try {
        const fs = require('fs');
        if (fs.existsSync(commandsPath)) {
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                try {
                    delete require.cache[require.resolve(filePath)]; // Clear cache for hot reloading
                    const command = require(filePath);
                    if (command && command.data && command.execute) {
                        client.commands.set(command.data.name, command);
                        console.log(`[BOT] Loaded command: ${command.data.name}`);
                    } else {
                        console.warn(`[BOT] Command at ${file} is missing data or execute!`);
                    }
                } catch (cmdErr) {
                    console.error(`[BOT] Failed to load command ${file}:`, cmdErr.message);
                }
            }
        }
    } catch (e) {
        console.error('[BOT] Error loading commands:', e);
    }
}
loadCommands();

// ─── Azkar Lists ───────────────────────────────────────────────────────────────
const azkarMorning = [
    '**أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ**',
    '**اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ**',
    '**أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ ﷺ**',
    '**سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ**',
    '**اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ**',
];

const azkarEvening = [
    '**أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ**',
    '**اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ**',
    '**أَمْسَيْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ ﷺ**',
    '**أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ**',
    '**بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ**',
];

// ─── Ready ─────────────────────────────────────────────────────────────────────
client.once('ready', () => {
    console.log(`[BOT] ✅ Logged in as ${client.user.tag}`);
    scheduleAzkar();
    setInterval(checkPendingActions, 3000);
    client.user.setActivity('🔮 Umbral Bot', { type: 0 });
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
        case 'TEST_AZKAR': {
            const config = db.getAzkarConfig(action.guild_id);
            if (!config?.channel_id) return;
            const channel = guild.channels.cache.get(config.channel_id);
            if (!channel) return;
            const embed = new EmbedBuilder()
                .setTitle('🧪 تجربة الأذكار')
                .setDescription('هذه رسالة تجريبية للتأكد من أن نظام الأذكار يعمل بشكل صحيح.\n\n**أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ**')
                .setColor('#23a559')
                .setFooter({ text: 'Umbral Bot — رسالة تجريبية' })
                .setTimestamp();
            await channel.send({ embeds: [embed] });
            break;
        }

        case 'REGISTER_COMMANDS':
            await registerGuildCommands(action.guild_id);
            break;

        case 'SETUP_TICKET_PANEL':
            await setupTicketPanel(guild);
            break;

        default:
            console.warn(`[BOT] Unknown action type: ${action.type}`);
    }
}

// ─── Slash Commands Registration ───────────────────────────────────────────────
async function registerGuildCommands(guildId) {
    try {
        if (!process.env.CLIENT_ID) {
            return console.error('[BOT] CLIENT_ID is missing in .env');
        }

        const customCommands = db.getCustomCommands(guildId);
        const slashCommands = customCommands
            .filter(cmd => cmd.is_slash)
            .map(cmd => {
                const builder = new SlashCommandBuilder()
                    .setName(cmd.command.toLowerCase().replace(/\s+/g, '-'))
                    .setDescription(cmd.description || 'أمر مخصص');
                return builder.toJSON();
            });

        // ONLY register Custom Slash Commands for guilds, 
        // Built-in commands should be handled globally by deploy-commands.js
        const allSlash = [...slashCommands];

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        // Use applicationGuildCommands for instant update in specific guild
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
            { body: allSlash }
        );
        console.log(`[BOT] Registered ${allSlash.length} slash commands for ${guildId}`);
        return true;
    } catch (error) {
        console.error(`[BOT] Error registering commands for guild ${guildId}:`, error);
        return false;
    }
}

async function registerGlobalCommands() {
    try {
        if (!process.env.CLIENT_ID) return;

        const builtInSlash = client.commands.map(cmd => cmd.data.toJSON());
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        console.log('[BOT] Registering global slash commands...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: builtInSlash }
        );
        console.log('[BOT] Global slash commands registered successfully!');
    } catch (error) {
        console.error('[BOT] Error registering global commands:', error);
    }
}

// ─── Ticket Panel Setup ────────────────────────────────────────────────────────
async function setupTicketPanel(guild) {
    try {
        const config = db.getTicketConfig(guild.id);
        if (!config?.channel_id || !config.enabled) {
            return console.warn(`[TICKETS] Config not ready for guild ${guild.id}`);
        }

        const channel = guild.channels.cache.get(config.channel_id);
        if (!channel) return console.warn(`[TICKETS] Channel not found: ${config.channel_id}`);

        // Delete old panel message if exists
        if (config.panel_message_id) {
            try {
                const oldMsg = await channel.messages.fetch(config.panel_message_id);
                if (oldMsg) await oldMsg.delete();
            } catch { /* old message already deleted */ }
        }

        const embed = new EmbedBuilder()
            .setTitle('🎫 نظام التذاكر')
            .setDescription('هل تحتاج مساعدة أو لديك استفسار؟\n\nاضغط على الزر أدناه لفتح تذكرة خاصة مع فريق الإدارة.\nسيتم طلب منك كتابة سبب التذكرة.')
            .setColor('#5865F2')
            .setFooter({ text: 'Umbral Bot — نظام التذاكر' })
            .setTimestamp();

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('🎫 فتح تذكرة')
                .setStyle(ButtonStyle.Primary)
        );

        const msg = await channel.send({ embeds: [embed], components: [button] });
        db.updateTicketPanelMessageId(guild.id, msg.id);
        console.log(`[TICKETS] Panel set up in ${channel.name} for guild ${guild.name}`);
    } catch (err) {
        console.error('[TICKETS] Error setting up panel:', err);
    }
}

// ─── Interactions (Button + Modal + Slash) ─────────────────────────────────────
client.on('interactionCreate', async interaction => {
    try {
        // ── Slash Commands ───────────────────────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (command) {
                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error(`Error executing ${interaction.commandName}:`, error);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'حدث خطأ أثناء تنفيذ هذا الأمر!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'حدث خطأ أثناء تنفيذ هذا الأمر!', ephemeral: true });
                    }
                }
                return;
            }

            const customCommands = db.getCustomCommands(interaction.guildId);
            const cmd = customCommands.find(c => c.command === interaction.commandName);
            if (cmd) {
                if (cmd.embed) {
                    await interaction.reply({ embeds: [new EmbedBuilder().setDescription(cmd.response).setColor('#5865F2')] });
                } else {
                    await interaction.reply(cmd.response);
                }
            }
            return;
        }

        // ── Button: Open Ticket ──────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'open_ticket') {
            const existingTicket = db.getTickets(interaction.guildId)
                .find(t => t.user_id === interaction.user.id && t.status === 'open');

            if (existingTicket) {
                const ch = interaction.guild.channels.cache.get(existingTicket.channel_id);
                const mention = ch ? `<#${ch.id}>` : 'تذكرتك الحالية';
                return await interaction.reply({
                    content: `⚠️ لديك تذكرة مفتوحة بالفعل: ${mention}`,
                    ephemeral: true
                });
            }

            // Show modal for reason
            const modal = new ModalBuilder()
                .setCustomId('ticket_reason_modal')
                .setTitle('🎫 فتح تذكرة');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('ticket_reason')
                        .setLabel('سبب فتح التذكرة')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('اكتب سبب تذكرتك بالتفصيل...')
                        .setMinLength(10)
                        .setMaxLength(500)
                        .setRequired(true)
                )
            );

            await interaction.showModal(modal);
            return;
        }

        // ── Button: Close Ticket ─────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'close_ticket') {
            const ticket = db.getTicketByChannel(interaction.channelId);
            if (!ticket) return await interaction.reply({ content: '❌ لا توجد تذكرة في هذه القناة.', ephemeral: true });

            // Check if user has permission to close (opener or has Manage Channels)
            const canClose = interaction.user.id === ticket.user_id
                || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

            if (!canClose) return await interaction.reply({ content: '❌ ليس لديك صلاحية لإغلاق هذه التذكرة.', ephemeral: true });

            await interaction.reply({ content: '🔒 سيتم إغلاق التذكرة خلال 5 ثوانٍ...' });

            db.closeTicket(interaction.channelId);

            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (err) {
                    console.error('[TICKETS] Error deleting channel:', err);
                }
            }, 5000);
            return;
        }

        // ── Modal: Ticket Reason Submitted ───────────────────────────────────────
        if (interaction.isModalSubmit() && interaction.customId === 'ticket_reason_modal') {
            await interaction.deferReply({ ephemeral: true });

            const reason = interaction.fields.getTextInputValue('ticket_reason');
            const guild = interaction.guild;
            const member = interaction.member;

            const config = db.getTicketConfig(guild.id);
            if (!config?.enabled) {
                return await interaction.editReply({ content: '❌ نظام التذاكر غير مفعّل.' });
            }

            // Get ticket number
            const ticketNum = db.incrementTicketCount(guild.id);
            // Clean username for channel name (Discord only allows alphanumeric + hyphens, no leading/trailing hyphens)
            const safeUsername = member.user.username
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')  // remove diacritics
                .replace(/[^a-z0-9]/g, '-')         // replace non-alphanumeric with dash
                .replace(/-+/g, '-')                 // collapse multiple dashes
                .replace(/^-+|-+$/g, '')             // remove leading/trailing dashes
                .slice(0, 16) || `u${member.id.slice(-6)}`; // fallback to last 6 digits of ID
            const channelName = `ticket-${ticketNum.toString().padStart(4, '0')}-${safeUsername}`;
            console.log(`[TICKETS] Creating channel: ${channelName}`);

            // Build permissions
            const supportRoles = Array.isArray(config.support_roles) ? config.support_roles : [];
            const permOverwrites = [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: member.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles,
                    ],
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                ...supportRoles.map(roleId => ({
                    id: roleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.AttachFiles,
                    ],
                }))
            ];

            // Create the ticket channel
            let ticketChannel;
            try {
                const createOptions = {
                    name: channelName,
                    type: ChannelType.GuildText,
                    permissionOverwrites: permOverwrites,
                    topic: `Ticket #${ticketNum} | ${member.user.tag}`,
                };
                // Only set parent if it's a valid non-empty string
                if (config.category_id && config.category_id.trim()) {
                    createOptions.parent = config.category_id.trim();
                }
                ticketChannel = await guild.channels.create(createOptions);
                console.log(`[TICKETS] Channel created: ${ticketChannel.name} (${ticketChannel.id})`);
            } catch (err) {
                console.error('[TICKETS] ❌ Error creating channel:', err.message);
                console.error('[TICKETS] Code:', err.code, '| Status:', err.status);
                const errMsg = err.code === 50013
                    ? '❌ البوت يفتقر لصلاحية إنشاء القنوات. تأكد أن البوت يملك **Manage Channels** أو **Administrator**.'
                    : err.code === 50035
                        ? `❌ اسم القناة غير صالح: \`${channelName}\`. جرب تغيير اسم المستخدم.`
                        : `❌ فشل في إنشاء القناة: ${err.message}`;
                return await interaction.editReply({ content: errMsg });
            }

            // Save ticket to DB
            db.createTicket(guild.id, member.id, ticketChannel.id, reason);

            // Build mentions for support roles
            const roleMentions = supportRoles.map(r => `<@&${r}>`).join(' ');

            // First message in ticket channel
            const ticketEmbed = new EmbedBuilder()
                .setTitle(`🎫 تذكرة #${ticketNum}`)
                .addFields(
                    { name: '👤 المستخدم', value: `<@${member.id}>`, inline: true },
                    { name: '📅 التاريخ', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '📝 السبب', value: reason }
                )
                .setColor('#5865F2')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Umbral Bot — نظام التذاكر' })
                .setTimestamp();

            const closeButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 إغلاق التذكرة')
                    .setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({
                content: `${roleMentions ? roleMentions + ' | ' : ''}<@${member.id}> تم فتح تذكرتك!`,
                embeds: [ticketEmbed],
                components: [closeButton]
            });

            await interaction.editReply({
                content: `✅ تم فتح تذكرتك بنجاح! انتقل إلى <#${ticketChannel.id}>`
            });

            console.log(`[TICKETS] Ticket #${ticketNum} opened by ${member.user.tag} in ${guild.name}`);
        }

        // ── Shop Category Selection ──────────────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('shop_')) {
            const type = interaction.customId.split('_')[1].replace(/s$/, ''); // backgrounds -> background
            const items = await db.getShopItems(type);

            const embed = new EmbedBuilder()
                .setTitle(`🛍️ متجر ${type === 'background' ? 'الخلفيات' : type === 'frame' ? 'الفريمات' : 'الأوسمة'}`)
                .setDescription('اختر عنصراً من القائمة المنسدلة أدناه لشرائه.')
                .setColor('#3b82f6');

            const select = new StringSelectMenuBuilder()
                .setCustomId('shop_buy_item')
                .setPlaceholder('اختر عنصراً للشراء');

            items.forEach(item => {
                select.addOptions({
                    label: item.name,
                    description: `السعر: ${item.price} Orb`,
                    value: `buy_${item.id}`
                });
            });

            const row = new ActionRowBuilder().addComponents(select);
            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            return;
        }

        // ── Shop: Buy Item ───────────────────────────────────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'shop_buy_item') {
            const itemId = interaction.values[0].split('_')[1];
            const result = await db.buyItem(interaction.user.id, itemId);

            if (result.success) {
                await interaction.reply({ content: '✅ تمت عملية الشراء بنجاح! يمكنك تجهيز العنصر من `/inventory`', ephemeral: true });
            } else {
                let msg = '❌ فشل الشراء.';
                if (result.reason === 'insufficient_funds') msg = '❌ ليس لديك Orbs كافية!';
                if (result.reason === 'already_owned') msg = '❌ أنت تملك هذا العنصر بالفعل!';
                await interaction.reply({ content: msg, ephemeral: true });
            }
            return;
        }

        // ── Inventory: Equip Item ────────────────────────────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'inventory_equip') {
            const [action, type, id] = interaction.values[0].split('_');

            let result;
            if (type === 'badge') {
                // For badges, we toggle
                const profile = await db.getUserProfile(interaction.user.id);
                if (profile.badges && profile.badges.includes(id)) {
                    result = await db.unequipBadge(interaction.user.id, id);
                } else {
                    result = await db.equipBadge(interaction.user.id, id);
                }
            } else {
                result = await db.equipItem(interaction.user.id, id, type);
            }

            if (result.success) {
                await interaction.reply({ content: '✅ تم تحديث بروفايلك بنجاح!', ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ فشل التجهيز: ${result.reason}`, ephemeral: true });
            }
            return;
        }

        // ── Button: Suggestion Voting ──────────────────────────────────────────
        if (interaction.isButton() && (interaction.customId === 'suggest_up' || interaction.customId === 'suggest_down')) {
            const upBtn = interaction.message.components[0].components[0];
            const downBtn = interaction.message.components[0].components[1];

            let upCount = parseInt(upBtn.label.split(' ')[1]) || 0;
            let downCount = parseInt(downBtn.label.split(' ')[1]) || 0;

            if (interaction.customId === 'suggest_up') upCount++;
            else downCount++;

            const newButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('suggest_up').setLabel(`👍 ${upCount}`).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('suggest_down').setLabel(`👎 ${downCount}`).setStyle(ButtonStyle.Danger)
            );

            await interaction.update({ components: [newButtons] });
            return;
        }

    } catch (err) {
        console.error('[INTERACTION] Error:', err);
        try {
            const errMsg = { content: '❌ حدث خطأ أثناء المعالجة.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(errMsg);
            } else {
                await interaction.reply(errMsg);
            }
        } catch { /* already replied */ }
    }
});

// ─── Azkar Scheduler ───────────────────────────────────────────────────────────
function scheduleAzkar() {
    schedule.scheduleJob('0 7 * * *', () => sendAzkar('morning'));
    schedule.scheduleJob('0 18 * * *', () => sendAzkar('evening'));
    console.log('[BOT] ✅ Azkar scheduler initialized');
}

async function sendAzkar(type) {
    let sent = 0;
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            const config = db.getAzkarConfig(guildId);
            if (!config?.enabled || !config.channel_id) continue;
            if (type === 'morning' && !config.send_morning) continue;
            if (type === 'evening' && !config.send_evening) continue;

            const channel = guild.channels.cache.get(config.channel_id);
            if (!channel) continue;

            const customAzkar = db.getCustomAzkar(guildId);
            let azkarText = '';
            let azkarImage = null;

            if (customAzkar.length > 0 && Math.random() > 0.5) {
                const rnd = customAzkar[Math.floor(Math.random() * customAzkar.length)];
                azkarText = rnd.content;
                azkarImage = rnd.image_url;
            } else {
                const list = type === 'morning' ? azkarMorning : azkarEvening;
                azkarText = list[Math.floor(Math.random() * list.length)];
            }

            const embed = new EmbedBuilder()
                .setTitle(type === 'morning' ? '🌅 أذكار الصباح' : '🌙 أذكار المساء')
                .setDescription(azkarText)
                .setColor(type === 'morning' ? '#FFD700' : '#1E3A8A')
                .setFooter({ text: 'Umbral Bot — تذكير تلقائي' })
                .setTimestamp();
            if (azkarImage) embed.setImage(azkarImage);
            await channel.send({ embeds: [embed] });
            sent++;
        } catch (err) {
            console.error(`[AZKAR] Error sending to ${guildId}:`, err);
        }
    }
    console.log(`[AZKAR] Sent ${type} azkar to ${sent} guilds`);
}

// ─── Starboard ───────────────────────────────────────────────────────────────
client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.emoji.name !== '⭐') return;
    if (reaction.message.partial) await reaction.message.fetch();

    const guildId = reaction.message.guildId;
    const config = db.getStarboardConfig?.(guildId);
    if (!config?.enabled || !config.channel_id) return;

    if (reaction.count >= (config.required_stars || 3)) {
        const starChannel = reaction.message.guild.channels.cache.get(config.channel_id);
        if (!starChannel) return;

        // Check if already posted
        const existing = db.getStarboardMessage?.(reaction.message.id);
        if (existing) return;

        const embed = new EmbedBuilder()
            .setAuthor({ name: reaction.message.author.username, iconURL: reaction.message.author.displayAvatarURL() })
            .setDescription(reaction.message.content || '[محتوى وسائط]')
            .addFields({ name: 'الأصل', value: `[انتقل للرسالة](${reaction.message.url})` })
            .setColor('#fbbf24')
            .setTimestamp();

        if (reaction.message.attachments.first()) {
            embed.setImage(reaction.message.attachments.first().url);
        }

        const msg = await starChannel.send({ content: `⭐ **${reaction.count}** | <#${reaction.message.channelId}>`, embeds: [embed] });
        db.saveStarboardMessage?.(guildId, reaction.message.id, msg.id);
    }
});

// ─── Member Join ───────────────────────────────────────────────────────────────
client.on('guildMemberAdd', async (member) => {
    const settings = db.getSettings(member.guild.id);
    if (!settings) return;

    // Auto Role
    if (settings.auto_role) {
        try {
            const role = member.guild.roles.cache.get(settings.auto_role);
            if (role) await member.roles.add(role);
        } catch (e) {
            console.error(`[AUTO-ROLE] ${member.guild.name}:`, e.message);
        }
    }

    // Welcome Message
    if (!settings.welcome_enabled) return;

    const channel = settings.welcome_channel
        ? member.guild.channels.cache.get(settings.welcome_channel)
        : member.guild.systemChannel;
    if (!channel) return;

    const messageText = (settings.welcome_message || 'مرحباً بك {user}!')
        .replace('{user}', `<@${member.id}>`)
        .replace('{server}', member.guild.name)
        .replace('{count}', member.guild.memberCount.toString());

    try {
        if (settings.welcome_type === 'image') {
            const buffer = await generateCanvasImage(member, settings.welcome_image, settings.welcome_data);
            await channel.send({ content: messageText, files: [{ attachment: buffer, name: 'welcome.png' }] });
        } else if (settings.welcome_type === 'embed') {
            const embed = new EmbedBuilder()
                .setDescription(messageText)
                .setColor('#5865F2')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `العضو #${member.guild.memberCount}` })
                .setTimestamp();
            if (settings.welcome_image) embed.setImage(settings.welcome_image);
            await channel.send({ embeds: [embed] });
        } else {
            await channel.send(messageText);
        }
    } catch (error) {
        console.error('[WELCOME] Error:', error.message);
        channel.send(messageText).catch(() => { });
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const authorId = message.author.id;
    const settings = db.getSettings(guildId);
    const modConfig = db.getModerationConfig(guildId);

    // ─── Moderation System ───────────────────────────────────────────────────────
    let isStaff = message.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
        message.member.permissions.has(PermissionFlagsBits.Administrator) ||
        (settings.admin_role && message.member.roles.cache.has(settings.admin_role)) ||
        message.author.username === 'oq18x' || message.author.id === '112233445566778899'; // Owner ID fallback

    if (modConfig.enabled && !isStaff) {
        // Check ignored channels/roles
        const isIgnored = modConfig.ignored_channels.includes(message.channel.id) ||
            message.member.roles.cache.some(r => modConfig.ignored_roles.includes(r.id));

        if (!isIgnored) {
            let deleteNeeded = false;
            let reason = '';

            // 1. Anti-Invite
            if (modConfig.anti_invite && /(discord\.gg\/.+|discord\.com\/invite\/.+)/i.test(message.content)) {
                deleteNeeded = true;
                reason = 'ممنوع إرسال روابط الدعوة ❌';
            }

            // 2. Anti-Link
            if (!deleteNeeded && modConfig.anti_link && /https?:\/\//i.test(message.content)) {
                deleteNeeded = true;
                reason = 'ممنوع إرسال الروابط في هذا السيرفر ❌';
            }

            // 3. Bad Words
            if (!deleteNeeded && modConfig.bad_words.length > 0) {
                const containsBad = modConfig.bad_words.some(word =>
                    message.content.toLowerCase().includes(word.toLowerCase())
                );
                if (containsBad) {
                    deleteNeeded = true;
                    reason = 'الرجاء الالتزام بالأدب في الحديث ⚠️';
                }
            }

            // 4. Anti-Spam
            if (!deleteNeeded && modConfig.anti_spam) {
                const now = Date.now();
                const userSpam = spamTracker.get(authorId) || { count: 0, lastTime: now };
                if (now - userSpam.lastTime < 3000) { // 3 seconds window
                    userSpam.count++;
                    if (userSpam.count > 4) { // 5 messages in 3 seconds
                        deleteNeeded = true;
                        reason = 'توقف عن السبام! 🚫';
                        // Temporary mute or warning would go here
                    }
                } else {
                    userSpam.count = 1;
                    userSpam.lastTime = now;
                }
                spamTracker.set(authorId, userSpam);
            }

            if (deleteNeeded) {
                try {
                    await message.delete();
                    const warnMsg = await message.channel.send(`<@${authorId}>، ${reason}`);
                    setTimeout(() => warnMsg.delete().catch(() => { }), 5000);
                    return; // Stop processing further for this message
                } catch (e) {
                    console.error('[MODERATION] Delete failed:', e.message);
                }
            }
        }
    }

    // ─── Shortcut Hijacking ──────────────────────────────────────────────────────
    const prefix = settings.prefix || '!';
    let content = message.content.trim();
    if (content.startsWith(prefix)) {
        const potentialCmd = content.slice(prefix.length).split(/ +/)[0].toLowerCase();
        const shortcuts = db.getShortcuts(guildId);
        const shortcut = shortcuts.find(s => s.name.toLowerCase() === potentialCmd);
        if (shortcut) {
            // Hijack content: e.g. !p -> !profail
            const remaining = content.slice(prefix.length + potentialCmd.length);
            content = prefix + shortcut.target_command + remaining;
            // Update message content for the rest of the flow (simulation)
            message.content = content;
        }
    }

    // ── XP System ────────────────────────────────────────────────────────────────
    if (settings.levels_enabled && !xpCooldowns.has(message.author.id)) {
        const userLevel = await db.getUserLevel(message.guild.id, message.author.id) || { xp: 0, level: 0 };
        const xpToAdd = Math.floor(Math.random() * 10) + 15;
        let newXp = (userLevel.xp || 0) + xpToAdd;
        let newLevel = userLevel.level || 0;
        const xpNeeded = (newLevel + 1) * 200;

        if (newXp >= xpNeeded) {
            newLevel++;
            newXp -= xpNeeded;
            const embed = new EmbedBuilder()
                .setTitle('🎉 ترقية في المستوى!')
                .setDescription(`مبروك <@${message.author.id}>! وصلت إلى **المستوى ${newLevel}** 🏆`)
                .setColor('#f0b232')
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            const targetChannel = settings.level_up_channel
                ? message.guild.channels.cache.get(settings.level_up_channel)
                : message.channel;

            if (targetChannel) {
                targetChannel.send({ embeds: [embed] }).catch(() => { });
            }

            // Level reward: orbs
            await db.addOrbs(message.guild.id, message.author.id, newLevel * 5, 'level_up');

            // Role reward
            const rewards = db.getLevelRewards(message.guild.id);
            const reward = rewards.find(r => r.level === newLevel);
            if (reward) {
                try {
                    const role = message.guild.roles.cache.get(reward.role_id);
                    if (role) await message.member.roles.add(role);
                } catch (e) { console.error('[LEVELS] Role assign failed:', e.message); }
            }
        }

        await db.updateUserXP(message.guild.id, message.author.id, newXp, newLevel);
        xpCooldowns.add(message.author.id);
        setTimeout(() => xpCooldowns.delete(message.author.id), 60000);
    }

    // ── Admin Panel (!@ for Owner) ────────────────────────────────────────────────
    if (message.content.startsWith('!@') && (message.author.id === '1410212322676310076' || message.author.username === 'oq18x')) {
        const adminArgs = message.content.slice(2).trim().split(/ +/);
        const adminCmd = adminArgs.shift()?.toLowerCase();

        if (!adminCmd) {
            const embed = new EmbedBuilder()
                .setTitle('👑 تحية إجلال كبرى للزعيم والمؤسس 👑')
                .setDescription(`يا مرحباً بمالك وعقل Umbral الأعظم! كل الأنظمة والبوت تحت طوعك.\nإليك مفاتيح التحكم السرية والمطلقة:\n\n` +
                    `**[ النظام والاقتصاد ]**\n` +
                    `> \`!@addorbs @user <amount>\` — توليد Orbs بلا حدود\n` +
                    `> \`!@removeorbs @user <amount>\` — سحب Orbs و حرقها\n` +
                    `> \`!@setlevel @user <level>\` — تحديد مستوى تعسفي\n` +
                    `> \`!@addrep @user <amount>\` — منح نقاط سمعة (Rep) فائقة\n\n` +
                    `**[ الأغراض والمتجر ]**\n` +
                    `> \`!@giveitem @user <item_id>\` — منح أي غرض (إطار/خلفية) فوراً\n` +
                    `> \`!@giveall @user\` — منح جميع أغراض المتجر للمستخدم (جديد)\n\n` +
                    `**[ عقوبات ودمار شامل ]**\n` +
                    `> \`!@nuke @user\` — تصفير وإبادة كاملة لبيانات المستخدم\n` +
                    `> \`!@drain @user\` — سحب جميع أموال الضحية لحسابك (جديد)\n` +
                    `> \`!@blacklist @user\` — حظر المستخدم من استخدام البوت (جديد)\n` +
                    `> \`!@unblacklist @user\` — فك حظر المستخدم (جديد)\n\n` +
                    `**[ التحكم العام ]**\n` +
                    `> \`!@status <text>\` — تغيير حالة البوت (Playing) إلى أي شيء (جديد)\n` +
                    `> \`!@leave <guild_id>\` — الخروج من سيرفر معين بالقوة (جديد)\n` +
                    `> \`!@register\` — تسجيل Slash Commands بالقوة\n` +
                    `> \`!@reload\` — إعادة تشغيل أكواد البوت\n` +
                    `> \`!@stats\` — عرض سيرفرات وإحصائيات البوت\n` +
                    `> \`!@globalmsg <text>\` — إرسال رسالة لكل السيرفرات`)
                .setColor('#FF0000') // Red for supreme power
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Supreme Commander Panel — OWNER ONLY' })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        switch (adminCmd) {
            case 'register':
                await message.reply('⏳ جاري تسجيل أوامر الـ Slash لهذا السيرفر...');
                await registerGuildCommands(message.guild.id);
                return message.reply('✅ السيطرة تمت بنجاح!');

            case 'reload':
                await loadCommands();
                return message.reply('✅ تم تحديث أوامر النظام سيدي!');

            case 'addorbs': {
                const target = message.mentions.users.first();
                const amount = parseInt(adminArgs[1]);
                if (!target || isNaN(amount)) return message.reply('❌ `!@addorbs @user <amount>`');
                await db.addOrbs('GLOBAL', target.id, amount, 'supreme_command');
                return message.reply(`✅ تم طبع **${amount}** Orb وإعطاؤها لـ ${target.username}.`);
            }
            case 'removeorbs': {
                const target = message.mentions.users.first();
                const amount = parseInt(adminArgs[1]);
                if (!target || isNaN(amount)) return message.reply('❌ `!@removeorbs @user <amount>`');
                await db.addOrbs('GLOBAL', target.id, -amount, 'supreme_punish');
                return message.reply(`✅ تم حرق **${amount}** Orb من حساب ${target.username}.`);
            }
            case 'setlevel': {
                const target = message.mentions.users.first();
                const level = parseInt(adminArgs[1]);
                if (!target || isNaN(level)) return message.reply('❌ `!@setlevel @user <level>`');
                await db.updateUserXP(message.guild.id, target.id, 0, level);
                return message.reply(`✅ تم تعيين مستوى ${target.username} بالقوة إلى **${level}**.`);
            }
            case 'addrep': {
                const target = message.mentions.users.first();
                const amount = parseInt(adminArgs[1]);
                if (!target || isNaN(amount)) return message.reply('❌ `!@addrep @user <amount>`');
                const targetRef = require('../shared/firebase').doc(require('../shared/firebase').db, 'user_profiles', target.id);
                const targetSnap = await require('../shared/firebase').getDoc(targetRef);
                const currentRep = targetSnap.exists() ? (targetSnap.data().rep || 0) : 0;
                await require('../shared/firebase').setDoc(targetRef, { rep: currentRep + amount }, { merge: true });
                return message.reply(`✅ تم تفخيم سمعة ${target.username} بـ **${amount}** Rep!`);
            }
            case 'giveitem': {
                const target = message.mentions.users.first();
                const itemId = adminArgs[1];
                if (!target || !itemId) return message.reply('❌ `!@giveitem @user <item_id>`');
                const invRef = require('../shared/firebase').doc(require('../shared/firebase').db, 'user_inventory', target.id);
                await require('../shared/firebase').setDoc(invRef, { items: require('../shared/firebase').arrayUnion(itemId) }, { merge: true });
                return message.reply(`✅ تم زرع الغرض \`${itemId}\` في خزينة ${target.username}.`);
            }
            case 'nuke': {
                const target = message.mentions.users.first();
                if (!target) return message.reply('❌ `!@nuke @user`');
                const fb = require('../shared/firebase');
                await fb.deleteDoc(fb.doc(fb.db, 'economy', `GLOBAL_${target.id}`));
                await fb.deleteDoc(fb.doc(fb.db, 'levels', `${message.guild.id}_${target.id}`));
                await fb.deleteDoc(fb.doc(fb.db, 'user_inventory', target.id));
                await fb.deleteDoc(fb.doc(fb.db, 'user_profiles', target.id));
                return message.reply(`☢️ تم إبادة جميع معلومات ${target.username} من الوجود بنجاح!`);
            }
            case 'globalmsg': {
                const text = adminArgs.join(' ');
                if (!text) return message.reply('❌ `!@globalmsg <text>`');
                let sentObj = 0;
                client.guilds.cache.forEach(g => {
                    const ch = g.channels.cache.find(c => c.type === 0 && c.permissionsFor(g.members.me).has('SendMessages'));
                    if (ch) {
                        ch.send(`**رسالة من الزعيم:**\n\n${text}`).catch(() => { });
                        sentObj++;
                    }
                });
                return message.reply(`✅ تم نشر رسالتك لـ **${sentObj}** سيرفر يا زعيم.`);
            }
            case 'stats': {
                const guildStats = db.getGuildStats(message.guild.id);
                const embed = new EmbedBuilder()
                    .setTitle('📊 إحصائيات النظام الشاملة')
                    .addFields(
                        { name: '🌐 إجمالي السيرفرات', value: `${client.guilds.cache.size}`, inline: true },
                        { name: '👥 إجمالي المستخدمين', value: `${client.users.cache.size}`, inline: true },
                        { name: '⚡ البينق', value: `${client.ws.ping}ms`, inline: true },
                        { name: 'معدل الـ XP هنا', value: `${guildStats.totalXp}`, inline: true }
                    )
                    .setColor('#FF0000')
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            // ── NEW SECRETS ──────────────────────────────────────────────────────────
            case 'giveall': {
                const target = message.mentions.users.first();
                if (!target) return message.reply('❌ `!@giveall @user`');
                const fb = require('../shared/firebase');
                const bgs = (await db.getShopItems('background')).map(i => i.id);
                const frames = (await db.getShopItems('frame')).map(i => i.id);
                const badges = (await db.getShopItems('badge')).map(i => i.id);
                const allItems = [...bgs, ...frames, ...badges];
                const invRef = fb.doc(fb.db, 'user_inventory', target.id);
                await fb.setDoc(invRef, { items: fb.arrayUnion(...allItems) }, { merge: true });
                return message.reply(`✅ تم إغراق ${target.username} بجميع أغراض البوت بلا رحمة!`);
            }
            case 'drain': {
                const target = message.mentions.users.first();
                if (!target) return message.reply('❌ `!@drain @user`');
                const targetOrbs = await db.getOrbs('GLOBAL', target.id);
                if (targetOrbs.balance <= 0) return message.reply(`❌ ${target.username} مُفلس أساساً!`);
                await db.addOrbs('GLOBAL', target.id, -targetOrbs.balance, 'drained_by_owner');
                await db.addOrbs('GLOBAL', message.author.id, targetOrbs.balance, 'stolen_orbs');
                return message.reply(`🧛 تم شفط ثروة ${target.username} (**${targetOrbs.balance.toLocaleString()}** Orb) بالكامل لحسابك سيدي!`);
            }
            case 'blacklist': {
                const target = message.mentions.users.first() || { id: adminArgs[0], username: 'ID:' + adminArgs[0] };
                if (!adminArgs[0]) return message.reply('❌ `!@blacklist @user/id`');
                const fb = require('../shared/firebase');
                await fb.setDoc(fb.doc(fb.db, 'blacklisted', target.id), { time: Date.now() });
                return message.reply(`🚫 تم نفي ${target.username} وحظره من أنظمة البوت.`);
            }
            case 'unblacklist': {
                const target = message.mentions.users.first() || { id: adminArgs[0], username: 'ID:' + adminArgs[0] };
                if (!adminArgs[0]) return message.reply('❌ `!@unblacklist @user/id`');
                const fb = require('../shared/firebase');
                await fb.deleteDoc(fb.doc(fb.db, 'blacklisted', target.id));
                return message.reply(`✅ تم العفو عن ${target.username} والسماح له بالعودة.`);
            }
            case 'status': {
                const text = adminArgs.join(' ');
                if (!text) return message.reply('❌ `!@status <text>`');
                client.user.setActivity(text, { type: 0 }); // 0 is Playing
                return message.reply(`✅ غُيرت حالة البوت لـ: Playing \`${text}\``);
            }
            case 'leave': {
                const guildId = adminArgs[0];
                if (!guildId) return message.reply('❌ `!@leave <guild_id>`');
                const g = client.guilds.cache.get(guildId);
                if (!g) return message.reply('❌ لم أجد سيرفراً بهذا الـ ID.');
                await g.leave();
                return message.reply(`✅ تم الخروج من سيرفر \`${g.name}\` بنجاح.`);
            }
        }
        return;
    }


    // ── Auto Responses ───────────────────────────────────────────────────────────
    const autoResponses = db.getAutoResponses(message.guild.id);
    for (const ar of autoResponses) {
        if (message.content.toLowerCase().includes(ar.trigger.toLowerCase())) {
            await message.reply(ar.response).catch(() => { });
            return;
        }
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ── Custom Commands ──────────────────────────────────────────────────────────
    const customCommands = db.getCustomCommands(message.guild.id);
    for (const cmd of customCommands) {
        if (command === cmd.command.toLowerCase() && !cmd.is_slash) {
            if (cmd.embed) {
                await message.reply({ embeds: [new EmbedBuilder().setDescription(cmd.response).setColor('#5865F2')] }).catch(() => { });
            } else {
                await message.reply(cmd.response).catch(() => { });
            }
            return;
        }
    }

    // ── Built-in Commands ────────────────────────────────────────────────────────
    switch (command) {

        case 'ping': {
            const sent = await message.reply('🏓 جاري الفحص...');
            const embed = new EmbedBuilder()
                .setTitle('🏓 Pong!')
                .addFields(
                    { name: '🤖 استجابة البوت', value: `**${client.ws.ping}ms**`, inline: true },
                    { name: '📡 استجابة الاتصال', value: `**${sent.createdTimestamp - message.createdTimestamp}ms**`, inline: true }
                )
                .setColor('#3b82f6')
                .setTimestamp();
            sent.edit({ content: null, embeds: [embed] });
            break;
        }

        case 'prefix': {
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply({ embeds: [new EmbedBuilder().setDescription('❌ **تحتاج صلاحية مسؤول لتغيير البادئة!**').setColor('#EF4444')] });
            }
            const newPrefix = args[0];
            if (!newPrefix) {
                return message.reply({ embeds: [new EmbedBuilder().setDescription(`ℹ️ البادئة الحالية هي: \`${prefix}\``).setColor('#3b82f6')] });
            }
            if (newPrefix.length > 5) {
                return message.reply({ embeds: [new EmbedBuilder().setDescription('❌ **البادئة يجب أن تكون 5 أحرف أو أقل!**').setColor('#EF4444')] });
            }
            db.updateSettings(message.guild.id, 'prefix', newPrefix);
            message.reply({ embeds: [new EmbedBuilder().setDescription(`✅ **تم تغيير البادئة بنجاح إلى:** \`${newPrefix}\``).setColor('#23a559')] });
            break;
        }

        case 'orbs':
        case 'balance':
        case 'رصيد': {
            const target = message.mentions.users.first() || message.author;
            if (target.bot) return message.reply({ embeds: [new EmbedBuilder().setDescription('❌ **البوتات لا تملك رصيد Orbs!**').setColor('#EF4444')] });

            const orbData = await db.getOrbs('GLOBAL', target.id); // Needs await
            const today = new Date().toISOString().split('T')[0];
            const canDaily = orbData.last_daily !== today;

            const embed = new EmbedBuilder()
                .setTitle(`💳 محفظة UMBRAL — ${target.username}`)
                .addFields(
                    { name: '💰 الرصيد الحالي', value: `**${orbData.balance.toLocaleString()}** Orb`, inline: true },
                    { name: '📈 إجمالي المكتسب', value: `**${orbData.total_earned.toLocaleString()}** Orb`, inline: true },
                    { name: '🎁 المكافأة اليومية', value: canDaily ? `✅ متاحة! استخدم \`${prefix}daily\`` : '⏰ تم الاستلام اليوم', inline: false }
                )
                .setColor('#d946ef') // neon pink
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Umbral Global Economy' })
                .setTimestamp();
            message.reply({ embeds: [embed] });
            break;
        }

        case 'daily':
        case 'يومي': {
            const result = await db.claimDaily('GLOBAL', message.author.id); // Needs await
            if (!result.success) {
                const nextReset = new Date();
                nextReset.setDate(nextReset.getDate() + 1);
                nextReset.setHours(0, 0, 0, 0);
                const embed = new EmbedBuilder()
                    .setTitle('⏰ لقد استلمت مكافأتك اليومية بالفعل')
                    .setDescription(`يمكنك المطالبة بها مجدداً غداً!\n\n**التوقيت القادم:** <t:${Math.floor(nextReset.getTime() / 1000)}:R>`)
                    .setColor('#EF4444')
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            const orbData = await db.getOrbs('GLOBAL', message.author.id);
            const embed = new EmbedBuilder()
                .setTitle('🎁 مكافأة يومية تم استلامها!')
                .setDescription(`لقد حصلت على **5 🔮 Orbs** لمحفظتك!\n\n**الرصيد الكلي:** ${orbData.balance.toLocaleString()} Orb`)
                .setColor('#23a559')
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            message.reply({ embeds: [embed] });
            break;
        }

        case 'transfer':
        case 'تطوير': // Was tahweel but meaning convert orb
        case 'تحويل': {
            const targetUser = message.mentions.users.first();
            const amount = parseInt(args[1]);

            if (!targetUser || isNaN(amount) || amount <= 0) {
                return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ **الاستخدام الصحيح:** \`${prefix}transfer @user <amount>\``).setColor('#EF4444')] });
            }
            if (amount > 50000000) {
                return message.reply({ embeds: [new EmbedBuilder().setDescription('❌ **تم حظر التحويل: المبلغ ضخم جداً ويتجاوز الحد الأمن.**').setColor('#EF4444')] });
            }
            if (targetUser.id === message.author.id) {
                return message.reply({ embeds: [new EmbedBuilder().setDescription('❌ **لا يمكنك تحويل الـ Orbs لنفسك!**').setColor('#EF4444')] });
            }
            if (targetUser.bot) {
                return message.reply({ embeds: [new EmbedBuilder().setDescription('❌ **لا يمكنك تحويل الـ Orbs للبوتات!**').setColor('#EF4444')] });
            }

            const result = await db.transferOrbs('GLOBAL', message.author.id, targetUser.id, amount);
            if (!result.success) {
                if (result.reason === 'insufficient_funds') {
                    return message.reply({ embeds: [new EmbedBuilder().setDescription('❌ **رصيد محفظتك غير كافٍ لإتمام التحويل!**').setColor('#EF4444')] });
                }
                return message.reply({ embeds: [new EmbedBuilder().setDescription('❌ **حدث خطأ أثناء محاولة التحويل.**').setColor('#EF4444')] });
            }

            const senderData = await db.getOrbs('GLOBAL', message.author.id);
            const embed = new EmbedBuilder()
                .setTitle('💸 تم التحويل بنجاح!')
                .addFields(
                    { name: '📤 المرسل', value: `<@${message.author.id}>`, inline: true },
                    { name: '📥 المستلم', value: `<@${targetUser.id}>`, inline: true },
                    { name: '💰 الكمية المحولة', value: `**${amount.toLocaleString()}** 🔮 Orb`, inline: false },
                    { name: '💳 رصيدك المتبقي', value: `${senderData.balance.toLocaleString()} Orb`, inline: false }
                )
                .setColor('#23a559')
                .setTimestamp();
            message.reply({ embeds: [embed] });
            break;
        }

        case 'coinflip':
        case 'cf': {
            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount <= 0) {
                return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ **الاستخدام الصحيح:** \`${prefix}cf <amount>\`\n(يجب تحديد مبلغ للرهان)`).setColor('#EF4444')] });
            }

            const orbData = await db.getOrbs('GLOBAL', message.author.id);
            if (orbData.balance < amount) {
                return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ **رصيدك غير كافٍ للرهان! رصيدك: ${orbData.balance}**`).setColor('#EF4444')] });
            }

            const win = Math.random() >= 0.5;
            if (win) {
                await db.addOrbs('GLOBAL', message.author.id, amount, 'coinflip_win');
                const embed = new EmbedBuilder()
                    .setTitle('🪙 Coin Flip — ربحت!')
                    .setDescription(`مبروك 🎉 لقد حالفك الحظ وربحت **${amount.toLocaleString()}** 🔮 Orbs!\n\n**رصيدك المحدث:** ${(orbData.balance + amount).toLocaleString()} Orb`)
                    .setColor('#23a559')
                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();
                message.reply({ embeds: [embed] });
            } else {
                // Must manually build update for deduct since addOrbs usually takes absolute value + adds
                await db.transferOrbs('GLOBAL', message.author.id, 'SYSTEM_WALLET_CF', amount); // Needs await

                const embed = new EmbedBuilder()
                    .setTitle('🪙 Coin Flip — خسرت!')
                    .setDescription(`للأسف لقد خسرت الرهان هذه المرة وضاع منك **${amount.toLocaleString()}** 🔮 Orbs.\n\n**رصيدك المحدث:** ${(orbData.balance - amount).toLocaleString()} Orb`)
                    .setColor('#EF4444')
                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();
                message.reply({ embeds: [embed] });
            }
            break;
        }

        case 'orbtop':
        case 'توب': {
            const leaderboard = db.getOrbsLeaderboard('GLOBAL');
            if (leaderboard.length === 0) {
                return message.reply({ embeds: [new EmbedBuilder().setDescription('❌ **لا توجد بيانات بعد.**').setColor('#EF4444')] });
            }
            const list = leaderboard
                .map((u, i) => `${['🥇', '🥈', '🥉'][i] || `**${i + 1}.**`} <@${u.user_id}> — **${u.balance.toLocaleString()}** 🔮`)
                .join('\n\n');
            const embed = new EmbedBuilder()
                .setTitle('🏆 قائمة أثرياء Orbs (عالمياً)')
                .setDescription(list)
                .setColor('#f0b232')
                .setTimestamp();
            message.reply({ embeds: [embed] });
            break;
        }

        case 'level': {
            const target = message.mentions.users.first() || message.author;
            if (target.bot) return message.reply({ embeds: [new EmbedBuilder().setDescription('❌ **البوتات لا تملك مستويات!**').setColor('#EF4444')] });

            const levelData = db.getUserLevel(message.guild.id, target.id);
            const level = levelData?.level || 0;
            const xp = levelData?.xp || 0;
            const xpNeeded = (level + 1) * 100;
            const progress = Math.round((xp / xpNeeded) * 100);

            let progressBar = '';
            const filledBlocks = Math.round(progress / 10);
            for (let i = 0; i < 10; i++) progressBar += i < filledBlocks ? '🟩' : '⬛';

            const embed = new EmbedBuilder()
                .setTitle(`📊 مستوى — ${target.username}`)
                .addFields(
                    { name: '🏅 المستوى الحالي', value: `**${level}**`, inline: true },
                    { name: '⭐ النقاط (XP)', value: `**${xp} / ${xpNeeded}** XP`, inline: true },
                    { name: '📈 التقدم', value: `${progressBar} ${progress}%`, inline: false }
                )
                .setColor('#3b82f6')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
                .setTimestamp();
            message.reply({ embeds: [embed] });
            break;
        }

        case 'help':
        case 'مساعدة': {
            const customCmds = db.getCustomCommands(message.guild.id).filter(c => !c.is_slash);
            const embed = new EmbedBuilder()
                .setTitle('📚 الأوامر العامة — Umbral Bot')
                .setDescription(`البادئة الخاصة بالسيرفر هي: \`${prefix}\`\n\nيُفضل استخدام **[أوامر السلاش (/) المدمجة]** داخل الديسكورد للوصول إلى الميزات الإضافية كأدوات الإدارة والمحفظة المصورة (\`/wallet\`).`)
                .addFields(
                    { name: '🌐 اقتصاد Orbs العالمي', value: `> \`${prefix}orbs\` — عرض رصيدك\n> \`${prefix}daily\` — استلام المكافأة (5 Orbs)\n> \`${prefix}transfer @user amount\` — تحويل\n> \`${prefix}cf amount\` — لعبة رمي العملة والمراهنة\n> \`${prefix}orbtop\` — أثرياء العالم` },
                    { name: '📊 النظام والتفاعل', value: `> \`${prefix}level [@user]\` — عرض المستوى ومعدل الـ XP\n> \`${prefix}ping\` — سرعة الاستجابة\n> \`${prefix}help\` — قائمة الأوامر` },
                    { name: '🛠️ الإدارة', value: `> \`${prefix}prefix <new>\` — تغيير البادئة (للمسؤولين)` },
                    ...(customCmds.length > 0 ? [{ name: '🚀 الأوامر المخصصة للسيرفر', value: customCmds.map(c => `\`${prefix}${c.command}\``).join(' | ') }] : [])
                )
                .setColor('#3b82f6')
                .setFooter({ text: `Umbral System | ${process.env.CLIENT_URL || 'http://localhost:5173'}` })
                .setTimestamp();
            message.reply({ embeds: [embed] });
            break;
        }
    }
});

// ─── Ready Event ─────────────────────────────────────────────────────────────
client.once('ready', async () => {
    console.log(`[BOT] 🚀 Bot stands ready as ${client.user.tag}!`);
    console.log(`[BOT] Serving ${client.guilds.cache.size} guilds and ${client.users.cache.size} users.`);

    // Auto-register commands for all guilds on start for debugging/convenience
    console.log('[BOT] Auto-registering commands for guilds...');
    for (const [guildId, guild] of client.guilds.cache) {
        registerGuildCommands(guildId).catch(err => {
            console.error(`[BOT] Failed auto-register for guild ${guildId}:`, err.message);
        });
    }

    // Also register globally
    registerGlobalCommands().catch(err => {
        console.error('[BOT] Global registration error:', err.message);
    });

    scheduleAzkar();
});

// ─── Global Error Handlers ─────────────────────────────────────────────────────
process.on('unhandledRejection', error => console.error('[BOT] Unhandled Rejection:', error));
process.on('uncaughtException', error => console.error('[BOT] Uncaught Exception:', error));

// ─── Login ─────────────────────────────────────────────────────────────────────
console.log('[BOT] 🔌 Connecting...');
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('[BOT] ✅ Login handshake complete.'))
    .catch(err => {
        console.error('[BOT] ❌ Login failed:', err.message);
        console.error('[BOT] Check: DISCORD_TOKEN, Privileged Intents (Members + Message Content), internet connection.');
    });

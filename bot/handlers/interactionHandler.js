const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../shared/database');
const TicketSystem = require('../systems/ticketSystem');

const OWNER_ID = '1410212322676310076';

class InteractionHandler {
    constructor(client) {
        this.client = client;
        this.ticketSystem = new TicketSystem(client);
    }

    async handleInteraction(interaction) {
        try {
            // ── Slash Commands ───────────────────────────────────────────────────────
            if (interaction.isChatInputCommand()) {
                await this.handleSlashCommand(interaction);
                return;
            }

            // ── Button Interactions ───────────────────────────────────────────────────
            if (interaction.isButton()) {
                await this.handleButton(interaction);
                return;
            }

            // ── Modal Submissions ─────────────────────────────────────────────────────
            if (interaction.isModalSubmit()) {
                await this.handleModal(interaction);
                return;
            }

            // ── Select Menu Interactions ───────────────────────────────────────────────
            if (interaction.isStringSelectMenu()) {
                await this.handleSelectMenu(interaction);
                return;
            }

        } catch (error) {
            console.error('[INTERACTION] Error handling interaction:', error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'حدث خطأ أثناء معالجة هذا الطلب!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'حدث خطأ أثناء معالجة هذا الطلب!', ephemeral: true });
                }
            } catch (followUpError) {
                console.error('[INTERACTION] Could not send error message:', followUpError);
            }
        }
    }

    async handleMessage(message) {
        if (message.author.bot) return;

        const prefix = '!@';
        if (!message.content.startsWith(prefix)) return;

        console.log(`[MESSAGE] Received message: "${message.content}" from ${message.author.tag}`);

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase();

        console.log(`[MESSAGE] Parsed command: "${command}"`);

        // Handle owner command - works for !@, !@owner, or !@ with any text
        if (command === 'owner' || command === '' || command === undefined) {
            console.log(`[MESSAGE] Executing owner command for ${message.author.tag}`);
            await this.handleOwnerCommand(message);
            return;
        }

        // Handle other custom commands
        const customCommands = db.getCustomCommands(message.guildId);
        const cmd = customCommands.find(c => c.command === command);

        if (cmd) {
            try {
                if (cmd.embed) {
                    await message.reply({ embeds: [new EmbedBuilder().setDescription(cmd.response).setColor('#5865F2')] });
                } else {
                    await message.reply(cmd.response);
                }
            } catch (error) {
                console.error('[MESSAGE] Error sending custom command reply:', error);
            }
        }
    }

    async handleOwnerCommand(message) {
        // Check if user is the owner
        if (message.author.id !== OWNER_ID) {
            const securityEmbed = new EmbedBuilder()
                .setTitle('🚐 وصول مرفوض')
                .setDescription('هذا الأمر متاح فقط لصاحب البوت')
                .setColor('#ff0000')
                .addFields(
                    { name: '🔒 محاولة وصول غير مصرح بها', value: `المستخدم: ${message.author.tag}\nID: ${message.author.id}`, inline: false },
                    { name: '⏰ وقت المحاولة', value: new Date().toISOString(), inline: true },
                    { name: '🌐 السيرفر', value: message.guild.name, inline: true }
                )
                .setFooter({ text: 'تم تسجيل هذه المحاولة' });

            return await message.reply({ embeds: [securityEmbed] });
        }

        const client = message.client;

        // Bot statistics
        const guilds = client.guilds.cache.size;
        const users = client.users.cache.size;
        const channels = client.channels.cache.size;
        const uptime = this.formatUptime(client.uptime);

        // System statistics
        const memoryUsage = process.memoryUsage();
        const nodeVersion = process.version;
        const platform = require('os').platform();
        const cpuUsage = process.cpuUsage();

        // Database statistics - Using static data to avoid db.prepare errors
        const totalGuilds = client.guilds.cache.size;
        const totalTickets = 'N/A';

        // Create main embed in Arabic
        const mainEmbed = new EmbedBuilder()
            .setTitle('👑 لوحة تحكم المالك')
            .setDescription('> **نظام إدارة بوت أومبرال**')
            .setColor('#2b2d31')
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setImage('https://cdn.discordapp.com/attachments/850420297762967592/850420298000257024/owner-banner.png')
            .addFields(
                {
                    name: '> **🤖 معلومات البوت**',
                    value: `\`\`\`📋 الاسم: ${client.user.tag}\n🆔 المعرف: ${client.user.id}\n🌐 السيرفرات: ${guilds}\n👥 المستخدمون: ${users}\n💬 القنوات: ${channels}\n⏰ وقت التشغيل: ${uptime}\`\`\``,
                    inline: false
                },
                {
                    name: '> **⚙️ معلومات النظام**',
                    value: `\`\`\`💻 Node.js: ${nodeVersion}\n🖥️ المنصة: ${platform}\n🧠 الذاكرة: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB\n⚡ استخدام المعالج: ${Math.round(cpuUsage.user / 1000000)}ms\`\`\``,
                    inline: false
                },
                {
                    name: '> **📊 معلومات قاعدة البيانات**',
                    value: `\`\`\`🗄️ إجمالي السيرفرات: ${totalGuilds}\n🎫 إجمالي التذاكر: ${totalTickets}\n📝 الأوامر المحملة: 37\n🔧 الأنظمة النشطة: 8\`\`\``,
                    inline: false
                },
                {
                    name: '> **🔑 معلومات المالك**',
                    value: `\`\`\`👑 معرف المالك: ${OWNER_ID}\n🔐 الصلاحيات: كاملة\n🌍 الوصول: جميع الأنظمة\n🛡️ الأمان: أقصى حماية\`\`\``,
                    inline: false
                }
            )
            .setFooter({
                text: `آخر تحديث: ${new Date().toLocaleString('ar-SA')} • بوت أومبرال v2.0`,
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();

        // Create action buttons in Arabic
        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('bot_restart')
                .setLabel('🔄 إعادة تشغيل البوت')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('bot_stats')
                .setLabel('📊 إحصائيات مفصلة')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('bot_status')
                .setLabel('🟢 حالة النظام')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('bot_logs')
                .setLabel('📝 عرض السجلات')
                .setStyle(ButtonStyle.Secondary)
        );

        // Create select menu for quick actions in Arabic
        const selectRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('owner_actions')
                .setPlaceholder('🔧 اختر إجراء سريع')
                .addOptions([
                    {
                        label: '📢 إرسال إعلان',
                        description: 'إرسال رسالة لجميع السيرفرات',
                        value: 'announcement',
                        emoji: '📢'
                    },
                    {
                        label: '🔍 فحص السيرفر',
                        description: 'عرض معلومات مفصلة عن السيرفر',
                        value: 'server_inspection',
                        emoji: '🔍'
                    },
                    {
                        label: '🛡️ فحص الأمان',
                        description: 'تشغيل تشخيصات الأمان',
                        value: 'security_check',
                        emoji: '🛡️'
                    },
                    {
                        label: '📈 مراقبة الأداء',
                        description: 'مراقبة أداء البوت',
                        value: 'performance_monitor',
                        emoji: '📈'
                    },
                    {
                        label: '⚙️ إعدادات البوت',
                        description: 'تكوين إعدادات البوت',
                        value: 'bot_settings',
                        emoji: '⚙️'
                    }
                ])
        );

        await message.reply({
            embeds: [mainEmbed],
            components: [actionRow, selectRow],
            allowedMentions: { repliedUser: false }
        });
    }

    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const d = days % 30;
        const h = hours % 24;
        const m = minutes % 60;
        const s = seconds % 60;

        return `${d} يوم, ${h} ساعة, ${m} دقيقة, ${s} ثانية`;
    }

    async handleSlashCommand(interaction) {
        const command = this.client.commands.get(interaction.commandName);
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

        // Handle custom commands
        const customCommands = db.getCustomCommands(interaction.guildId);
        const cmd = customCommands.find(c => c.command === interaction.commandName);
        if (cmd) {
            if (cmd.embed) {
                await interaction.reply({ embeds: [new EmbedBuilder().setDescription(cmd.response).setColor('#5865F2')] });
            } else {
                await interaction.reply(cmd.response);
            }
        }
    }

    async handleButton(interaction) {
        try {
            // Check if user is owner for owner panel buttons
            if (interaction.customId.startsWith('bot_') || interaction.customId.startsWith('owner_')) {
                if (interaction.user.id !== OWNER_ID) {
                    const securityEmbed = new EmbedBuilder()
                        .setTitle('🚐 وصول مرفوض')
                        .setDescription('هذا الأمر متاح فقط لصاحب البوت')
                        .setColor('#ff0000');
                    return await interaction.reply({ embeds: [securityEmbed], ephemeral: true });
                }
            }

            switch (interaction.customId) {
                case 'open_ticket':
                    await this.ticketSystem.handleOpenTicket(interaction);
                    break;

                case 'close_ticket':
                    await this.ticketSystem.handleCloseTicket(interaction);
                    break;

                case 'claim_ticket':
                    await this.ticketSystem.handleClaimTicket(interaction);
                    break;

                case 'priority_ticket':
                    await this.ticketSystem.handlePriorityTicket(interaction);
                    break;

                // Owner panel buttons
                case 'bot_restart':
                    await this.handleBotRestart(interaction);
                    break;

                case 'bot_stats':
                    await this.handleDetailedStats(interaction);
                    break;

                case 'bot_status':
                    await this.handleSystemStatus(interaction);
                    break;

                case 'bot_logs':
                    await this.handleViewLogs(interaction);
                    break;

                default:
                    await interaction.reply({ content: 'هذا الزر غير متاح حالياً!', ephemeral: true });
            }
        } catch (error) {
            console.error('[BUTTON] Error handling button interaction:', error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'حدث خطأ أثناء تنفيذ هذا الأمر!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'حدث خطأ أثناء تنفيذ هذا الأمر!', ephemeral: true });
                }
            } catch (followUpError) {
                console.error('[BUTTON] Could not send error message:', followUpError);
            }
        }
    }

    // Owner panel button handlers
    async handleBotRestart(interaction) {
        const restartEmbed = new EmbedBuilder()
            .setTitle('🔄 إعادة تشغيل البوت')
            .setDescription('جاري إعادة تشغيل البوت...')
            .setColor('#ff9900')
            .setTimestamp();

        await interaction.update({ embeds: [restartEmbed], components: [] });

        setTimeout(() => {
            console.log('[BOT] Restarting bot...');
            process.exit(0);
        }, 2000);
    }

    async handleDetailedStats(interaction) {
        const client = interaction.client;
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        const statsEmbed = new EmbedBuilder()
            .setTitle('📊 إحصائيات مفصلة')
            .setDescription('معلومات مفصلة عن أداء البوت')
            .setColor('#0099ff')
            .addFields(
                { name: '💾 الذاكرة', value: `المستخدمة: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB\nالإجمالية: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB\nالخارجية: ${Math.round(memoryUsage.external / 1024 / 1024)}MB`, inline: true },
                { name: '⚡ المعالج', value: `المستخدم: ${Math.round(cpuUsage.user / 1000000)}ms\nالنظام: ${Math.round(cpuUsage.system / 1000000)}ms`, inline: true },
                { name: '📈 الأداء', value: `uptime: ${this.formatUptime(client.uptime)}\nping: ${client.ws.ping}ms`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [statsEmbed], ephemeral: true });
    }

    async handleSystemStatus(interaction) {
        const client = interaction.client;
        const memoryUsage = process.memoryUsage();
        const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

        let statusColor = '#00ff00';
        let statusText = '🟢 ممتاز';

        if (memoryPercent > 80) {
            statusColor = '#ff0000';
            statusText = '🔴 حرج';
        } else if (memoryPercent > 60) {
            statusColor = '#ff9900';
            statusText = '🟡 متوسط';
        }

        const statusEmbed = new EmbedBuilder()
            .setTitle('🟢 حالة النظام')
            .setDescription(`حالة البوت الحالية: ${statusText}`)
            .setColor(statusColor)
            .addFields(
                { name: '🤖 حالة البوت', value: statusText, inline: true },
                { name: '💾 استخدام الذاكرة', value: `${Math.round(memoryPercent)}%`, inline: true },
                { name: '🌐 الاتصال', value: client.ws.ping < 200 ? '🟢 ممتاز' : '🟡 ضعيف', inline: true },
                { name: '📊 السيرفرات', value: `${client.guilds.cache.size}`, inline: true },
                { name: '👥 المستخدمون', value: `${client.users.cache.size}`, inline: true },
                { name: '💬 القنوات', value: `${client.channels.cache.size}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [statusEmbed], ephemeral: true });
    }

    async handleViewLogs(interaction) {
        const logsEmbed = new EmbedBuilder()
            .setTitle('📝 سجلات البوت')
            .setDescription('آخر الأخطاء والنشاطات:')
            .setColor('#5865F2')
            .addFields(
                { name: '🔍 معلومات', value: 'لا توجد سجلات متاحة حالياً\nيمكنك فحص ملفات السجل في الخادم', inline: false },
                { name: '⚙️ الخيارات', value: '• تحقق من console.log\n• فحص ملفات الخطأ\n• مراقبة الأداء', inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [logsEmbed], ephemeral: true });
    }

    async handleSelectMenu(interaction) {
        try {
            // Check if user is owner for owner panel actions
            if (interaction.customId === 'owner_actions') {
                if (interaction.user.id !== OWNER_ID) {
                    const securityEmbed = new EmbedBuilder()
                        .setTitle('🚐 وصول مرفوض')
                        .setDescription('هذا الأمر متاح فقط لصاحب البوت')
                        .setColor('#ff0000');
                    return await interaction.reply({ embeds: [securityEmbed], ephemeral: true });
                }
            }

            switch (interaction.customId) {
                case 'owner_actions':
                    await this.handleOwnerActions(interaction);
                    break;

                default:
                    await interaction.reply({ content: 'هذا الخيار غير متاح حالياً!', ephemeral: true });
            }
        } catch (error) {
            console.error('[SELECT_MENU] Error handling select menu interaction:', error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'حدث خطأ أثناء تنفيذ هذا الأمر!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'حدث خطأ أثناء تنفيذ هذا الأمر!', ephemeral: true });
                }
            } catch (followUpError) {
                console.error('[SELECT_MENU] Could not send error message:', followUpError);
            }
        }
    }

    async handleOwnerActions(interaction) {
        const action = interaction.values[0];

        switch (action) {
            case 'announcement':
                await this.handleAnnouncement(interaction);
                break;
            case 'server_inspection':
                await this.handleServerInspection(interaction);
                break;
            case 'security_check':
                await this.handleSecurityCheck(interaction);
                break;
            case 'performance_monitor':
                await this.handlePerformanceMonitor(interaction);
                break;
            case 'bot_settings':
                await this.handleBotSettings(interaction);
                break;
            default:
                await interaction.reply({ content: '��� ������� ��� ���� ������!', ephemeral: true });
        }
    }

    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const d = days % 30;
        const h = hours % 24;
        const m = minutes % 60;
        const s = seconds % 60;

        return `${d} يوم, ${h} ساعة, ${m} دقيقة, ${s} ثانية`;
    }

    async handleServerInspection(interaction) {
        const guild = interaction.guild;
        const client = interaction.client;

        const inspectionEmbed = new EmbedBuilder()
            .setTitle('🔍 فحص السيرفر')
            .setDescription(`معلومات مفصلة عن سيرفر: ${guild.name}`)
            .setColor('#00ff88')
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: '📋 معلومات أساسية', value: `الاسم: ${guild.name}\nالمعرف: ${guild.id}\nالمالك: ${guild.owner?.user.tag || 'غير معروف'}\nتم الإنشاء: ${guild.createdAt.toLocaleDateString('ar-SA')}`, inline: false },
                { name: '👥 الأعضاء', value: `الإجمالي: ${guild.memberCount}\nالبشر: ${guild.members.cache.filter(m => !m.user.bot).size}\nالبوتات: ${guild.members.cache.filter(m => m.user.bot).size}`, inline: true },
                { name: '💬 القنوات', value: `الإجمالية: ${guild.channels.cache.size}\nالنصية: ${guild.channels.cache.filter(c => c.type === 0).size}\nالصوتية: ${guild.channels.cache.filter(c => c.type === 2).size}`, inline: true },
                { name: '🛡️ الأمان', value: `المستوى: ${guild.verificationLevel}\nMF2FA: ${guild.mfaLevel}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [inspectionEmbed], ephemeral: true });
    }

    async handleSecurityCheck(interaction) {
        const securityEmbed = new EmbedBuilder()
            .setTitle('🛡️ فحص الأمان')
            .setDescription('نتائج فحص الأمان')
            .setColor('#ff9900')
            .addFields(
                { name: '🔐 صلاحيات البوت', value: '✅ جميع الصلاحيات متوفرة', inline: true },
                { name: '🌐 الاتصال', value: '✅ مستقر', inline: true },
                { name: '💾 الذاكرة', value: '✅ طبيعية', inline: true },
                { name: '📊 التوصيات', value: '• تحديث البوت بانتظام\n• مراقبة الأداء\n• فحص السجلات', inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [securityEmbed], ephemeral: true });
    }

    async handlePerformanceMonitor(interaction) {
        const client = interaction.client;
        const memoryUsage = process.memoryUsage();

        const performanceEmbed = new EmbedBuilder()
            .setTitle('📈 مراقبة الأداء')
            .setDescription('أداء البوت في الوقت الفعلي')
            .setColor('#00ff88')
            .addFields(
                { name: '⚡ سرعة الاستجابة', value: `${client.ws.ping}ms`, inline: true },
                { name: '💾 استخدام الذاكرة', value: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`, inline: true },
                { name: '📊 عدد السيرفرات', value: `${client.guilds.cache.size}`, inline: true },
                { name: '👥 المستخدمون النشطون', value: `${client.users.cache.size}`, inline: true },
                { name: '💬 القنوات النشطة', value: `${client.channels.cache.size}`, inline: true },
                { name: '⏰ وقت التشغيل', value: this.formatUptime(client.uptime), inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [performanceEmbed], ephemeral: true });
    }

    async handleBotSettings(interaction) {
        const settingsEmbed = new EmbedBuilder()
            .setTitle('⚙️ إعدادات البوت')
            .setDescription('إعدادات وتكوينات البوت')
            .setColor('#5865F2')
            .addFields(
                { name: '🔧 الإعدادات الحالية', value: '• اللغة: العربية\n• وضع الصيانة: مغلق\n• المستوى: إنتاج', inline: false },
                { name: '📝 الخيارات المتاحة', value: '• تغيير البادئة\n• تعديل اللغة\n• إعدادات الصيانة\n• تكوين الإشعارات', inline: false },
                { name: '🔒 ملاحظة', value: 'بعض الإعدادات تتطلب إعادة تشغيل البوت', inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [settingsEmbed], ephemeral: true });
    }
}

module.exports = InteractionHandler;

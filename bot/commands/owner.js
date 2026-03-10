const { SlashCommandBuilder, EmbedBuilder, version: discordVersion } = require('discord.js');
const db = require('../../shared/database');
const os = require('os');
const process = require('process');

const OWNER_ID = '1410212322676310076';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('owner')
        .setDescription('لوحة تحكم المالك - معلومات سرية وإحصائيات البوت')
        .addSubcommand(subcommand =>
            subcommand
                .setName('dashboard')
                .setDescription('عرض لوحة تحكم المالك الرئيسية')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('security')
                .setDescription('عرض معلومات الأمان والصلاحيات')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('economy')
                .setDescription('عرض إحصائيات الاقتصاد والعملات')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('users')
                .setDescription('عرض إحصائيات المستخدمين والبيانات')
        ),

    async execute(interaction) {
        // Check if user is the owner
        if (interaction.user.id !== OWNER_ID) {
            const securityEmbed = new EmbedBuilder()
                .setTitle('🚐 وصول مرفوض')
                .setDescription('هذا الأمر متاح فقط لصاحب البوت')
                .setColor('#ff0000')
                .addFields(
                    { name: '🔒 محاولة وصول غير مصرح بها', value: `المستخدم: ${interaction.user.tag}\nID: ${interaction.user.id}`, inline: false },
                    { name: '⏰ وقت المحاولة', value: new Date().toISOString(), inline: true },
                    { name: '🌐 السيرفر', value: interaction.guild.name, inline: true }
                )
                .setFooter({ text: 'تم تسجيل هذه المحاولة' });

            return await interaction.reply({ embeds: [securityEmbed], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'dashboard':
                await this.showDashboard(interaction);
                break;
            case 'security':
                await this.showSecurity(interaction);
                break;
            case 'economy':
                await this.showEconomy(interaction);
                break;
            case 'users':
                await this.showUsers(interaction);
                break;
        }
    },

    async showDashboard(interaction) {
        const client = interaction.client;
        
        // Bot statistics
        const guilds = client.guilds.cache.size;
        const users = client.users.cache.size;
        const channels = client.channels.cache.size;
        const uptime = this.formatUptime(client.uptime);
        
        // System statistics
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const nodeVersion = process.version;
        const platform = os.platform();
        const arch = os.arch();
        
        // Database statistics
        const totalGuilds = db.prepare('SELECT COUNT(*) as count FROM guild_settings').get().count;
        const totalTickets = db.prepare('SELECT COUNT(*) as count FROM tickets').get().count;
        const totalCommands = db.prepare('SELECT COUNT(*) as count FROM custom_commands').get().count;
        
        const embed = new EmbedBuilder()
            .setTitle('👑 لوحة تحكم المالك')
            .setDescription('معلومات وإحصائيات البوت السرية')
            .setColor('#ffd700')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '🤖 معلومات البوت', value: 
                    `**الاسم:** ${client.user.tag}\n**ID:** ${client.user.id}\n**الحالة:** ${client.presence?.status || 'offline'}\n**الخوادم:** ${guilds}\n**المستخدمون:** ${users}\n**القنوات:** ${channels}`,
                    inline: false },
                    
                { name: '⏙️ معلومات النظام', value:
                    `**Node.js:** ${nodeVersion}\n**Discord.js:** ${discordVersion}\n**المنصة:** ${platform} ${arch}\n**Uptime:** ${uptime}\n**الذاكرة:** ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                    inline: false },
                    
                { name: '📊 إحصائيات قاعدة البيانات', value:
                    `**الخوادم:** ${totalGuilds}\n**التذاكر:** ${totalTickets}\n**الأوامر المخصصة:** ${totalCommands}`,
                    inline: false },
                    
                { name: '🔑 معلومات المالك', value:
                    `**ID:** ${OWNER_ID}\n**الصلاحيات:** الكاملة\n**الوصول:** جميع الأنظمة`,
                    inline: false }
            )
            .setImage('https://cdn.discordapp.com/attachments/850420297762967592/850420298000257024/owner-banner.png')
            .setFooter({ text: `آخر تحديث: ${new Date().toLocaleString('ar-SA')}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async showSecurity(interaction) {
        const client = interaction.client;
        
        // Security information
        const ownerGuilds = client.guilds.cache.map(g => ({
            name: g.name,
            id: g.id,
            members: g.memberCount,
            owner: g.ownerId,
            permissions: g.members.me?.permissions.bitfield.toString() || '0'
        }));
        
        // Maintenance modes
        const maintenanceGuilds = db.prepare('SELECT guild_id, enabled, message, start_time FROM maintenance_mode WHERE enabled = 1').all();
        
        // Admin roles in all guilds
        const adminRoles = db.prepare('SELECT guild_id, admin_role FROM guild_settings WHERE admin_role IS NOT NULL').all();
        
        const embed = new EmbedBuilder()
            .setTitle('🔐 معلومات الأمان')
            .setDescription('معلومات الأمان والصلاحيات الحساسة')
            .setColor('#ff4444')
            .addFields(
                { name: '🏘️ الخوادم والصلاحيات', value: 
                    ownerGuilds.slice(0, 3).map(g => `**${g.name}** (${g.id})\nالأعضاء: ${g.members}\nالمالك: ${g.owner}`).join('\n\n'),
                    inline: false },
                    
                { name: '🔧 وضع الصيانة النشط', value:
                    maintenanceGuilds.length > 0 
                        ? maintenanceGuilds.map(m => `السيرفر: ${m.guild_id}\nالرسالة: ${m.message}`).join('\n\n')
                        : 'لا توجد صيانة نشطة',
                    inline: false },
                    
                { name: '👑 رولات الإدارة', value:
                    adminRoles.length > 0
                        ? adminRoles.map(a => `السيرفر: ${a.guild_id}\nالرول: ${a.admin_role}`).join('\n\n')
                        : 'لا توجد رولات إدارة محددة',
                    inline: false },
                    
                { name: '🔑 معلومات حساسة', value:
                    `**Token Prefix:** ${process.env.DISCORD_TOKEN ? '✅ موجود' : '❌ غير موجود'}\n**Database Path:** ${require('path').resolve(__dirname, '../../database.sqlite')}\n**Environment:** ${process.env.NODE_ENV || 'development'}`,
                    inline: false }
            )
            .setFooter({ text: '⚠️ هذه المعلومات حساسة - لا تشاركها' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async showEconomy(interaction) {
        try {
            // Get economy statistics from Firebase
            const firebase = require('../../shared/firebase');
            const economyQuery = firebase.query(
                firebase.collection(firebase.db, 'economy'),
                firebase.limit(1000)
            );
            const economySnapshot = await firebase.getDocs(economyQuery);
            
            let totalBalance = 0;
            let totalEarned = 0;
            let userCount = 0;
            
            economySnapshot.forEach(doc => {
                const data = doc.data();
                totalBalance += data.balance || 0;
                totalEarned += data.total_earned || 0;
                userCount++;
            });
            
            // Get transaction statistics
            const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM orb_transactions').get().count;
            
            // Get shop statistics
            const totalShopItems = db.prepare('SELECT COUNT(*) as count FROM shop_items').get().count;
            const totalInventory = db.prepare('SELECT COUNT(*) as count FROM user_inventory').get().count;
            
            const embed = new EmbedBuilder()
                .setTitle('💰 إحصائيات الاقتصاد')
                .setDescription('معلومات الاقتصاد والعملات في البوت')
                .setColor('#00ff88')
                .addFields(
                    { name: '📊 إحصائيات العملة', value:
                        `**إجمالي الرصيد:** ${totalBalance.toLocaleString()}\n**إجمالي المكتسب:** ${totalEarned.toLocaleString()}\n**عدد المستخدمين:** ${userCount}\n**متوسط الرصيد:** ${userCount > 0 ? Math.round(totalBalance / userCount) : 0}`,
                        inline: false },
                        
                    { name: '💸 المعاملات', value:
                        `**إجمالي المعاملات:** ${totalTransactions}\n**متوسط المعاملات للمستخدم:** ${userCount > 0 ? Math.round(totalTransactions / userCount) : 0}`,
                        inline: false },
                        
                    { name: '🛍️ المتجر', value:
                        `**إجمالي العناصر:** ${totalShopItems}\n**العناصر في المخزون:** ${totalInventory}`,
                        inline: false },
                        
                    { name: '🏆 أفضل 5 مستخدمين', value:
                        'يتم تحميلها من Firebase...', inline: false }
                )
                .setFooter({ text: 'بيانات الاقتصاد - محدثة' });

            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } catch (error) {
            console.error('[OWNER] Economy stats error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ في جلب بيانات الاقتصاد',
                ephemeral: true
            });
        }
    },

    async showUsers(interaction) {
        try {
            const client = interaction.client;
            
            // Get user statistics
            const totalUsers = client.users.cache.size;
            const uniqueUsers = new Set();
            
            client.guilds.cache.forEach(guild => {
                guild.members.cache.forEach(member => {
                    uniqueUsers.add(member.id);
                });
            });
            
            // Get profile statistics
            const firebase = require('../../shared/firebase');
            const profilesQuery = firebase.query(
                firebase.collection(firebase.db, 'user_profiles'),
                firebase.limit(1000)
            );
            const profilesSnapshot = await firebase.getDocs(profilesQuery);
            
            let totalRep = 0;
            let profilesCount = 0;
            
            profilesSnapshot.forEach(doc => {
                const data = doc.data();
                totalRep += data.rep || 0;
                profilesCount++;
            });
            
            // Get activity statistics
            const today = new Date().toISOString().split('T')[0];
            const todayTickets = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE created_at LIKE ?').get(`${today}%`).count;
            
            const embed = new EmbedBuilder()
                .setTitle('👥 إحصائيات المستخدمين')
                .setDescription('معلومات المستخدمين والنشاط في البوت')
                .setColor('#00d4ff')
                .addFields(
                    { name: '📊 إحصائيات المستخدمين', value:
                        `**المستخدمون في الكاش:** ${totalUsers}\n**المستخدمون الفريدون:** ${uniqueUsers.size}\n**البروفايلات:** ${profilesCount}\n**متوسط السمعة:** ${profilesCount > 0 ? Math.round(totalRep / profilesCount) : 0}`,
                        inline: false },
                        
                    { name: '🎯 النشاط اليومي', value:
                        `**التذاكر اليوم:** ${todayTickets}\n**التاريخ:** ${new Date().toLocaleDateString('ar-SA')}`,
                        inline: false },
                        
                    { name: '🌐 توزيع الخوادم', value:
                        client.guilds.cache.map(g => `**${g.name}**: ${g.memberCount} عضو`).slice(0, 5).join('\n'),
                        inline: false },
                        
                    { name: '🔍 معلومات إضافية', value:
                        `**إجمالي البروفايلات في Firebase:** ${profilesCount}\n**إجمالي السمعة:** ${totalRep}\n**متوسط السمعة للمستخدم:** ${profilesCount > 0 ? Math.round(totalRep / profilesCount) : 0}`,
                        inline: false }
                )
                .setFooter({ text: 'بيانات المستخدمين - محدثة' });

            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } catch (error) {
            console.error('[OWNER] User stats error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ في جلب بيانات المستخدمين',
                ephemeral: true
            });
        }
    },

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
};

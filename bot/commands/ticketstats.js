const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../shared/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketstats')
        .setDescription('عرض إحصائيات نظام التذاكر')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const guildId = interaction.guildId;

        try {
            // Get ticket statistics
            const allTickets = db.prepare('SELECT * FROM tickets WHERE guild_id = ?').all(guildId);
            const openTickets = allTickets.filter(t => t.status === 'open');
            const closedTickets = allTickets.filter(t => t.status === 'closed');
            
            // Today's tickets
            const today = new Date().toISOString().split('T')[0];
            const todayTickets = allTickets.filter(t => t.created_at.startsWith(today));
            
            // Priority statistics
            const priorityStats = {
                low: allTickets.filter(t => t.priority === 'low').length,
                medium: allTickets.filter(t => t.priority === 'medium').length,
                high: allTickets.filter(t => t.priority === 'high').length
            };

            // Average response time (claimed tickets)
            const claimedTickets = allTickets.filter(t => t.claimed_at);
            let avgResponseTime = 'غير متاح';
            if (claimedTickets.length > 0) {
                const totalResponseTime = claimedTickets.reduce((total, ticket) => {
                    const created = new Date(ticket.created_at);
                    const claimed = new Date(ticket.claimed_at);
                    return total + (claimed - created);
                }, 0);
                const avgMs = totalResponseTime / claimedTickets.length;
                const avgMinutes = Math.floor(avgMs / (1000 * 60));
                avgResponseTime = `${avgMinutes} دقيقة`;
            }

            // Top supporters (most claimed tickets)
            const supporterStats = {};
            claimedTickets.forEach(ticket => {
                if (ticket.claimed_by) {
                    supporterStats[ticket.claimed_by] = (supporterStats[ticket.claimed_by] || 0) + 1;
                }
            });
            
            const topSupporters = Object.entries(supporterStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);

            // Get user names for top supporters
            const supporterNames = await Promise.all(
                topSupporters.map(async ([userId, count]) => {
                    try {
                        const user = await interaction.client.users.fetch(userId);
                        return `${user.username}: ${count} تذكرة`;
                    } catch {
                        return `مستخدم غير معروف: ${count} تذكرة`;
                    }
                })
            );

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('📊 إحصائيات نظام التذاكر')
                .setDescription(`إحصائيات شاملة لنظام التذاكر في **${interaction.guild.name}**`)
                .setColor('#00d4ff')
                .setThumbnail(interaction.guild.iconURL())
                .addFields(
                    { name: '🎫 إجمالي التذاكر', value: allTickets.length.toString(), inline: true },
                    { name: '🟢 تذاكر مفتوحة', value: openTickets.length.toString(), inline: true },
                    { name: '🔴 تذاكر مغلقة', value: closedTickets.length.toString(), inline: true },
                    { name: '📅 تذاكر اليوم', value: todayTickets.length.toString(), inline: true },
                    { name: '⏱️ متوسط وقت الاستجابة', value: avgResponseTime, inline: true },
                    { name: '📈 نسبة الإغلاق', value: closedTickets.length > 0 ? `${Math.round((closedTickets.length / allTickets.length) * 100)}%` : '0%', inline: true }
                )
                .addFields(
                    { name: '🔊 توزيع الأولويات', value: 
                        `🟢 منخفض: ${priorityStats.low}\n🟡 متوسط: ${priorityStats.medium}\n🔴 عالي: ${priorityStats.high}`, 
                        inline: true }
                );

            if (supporterNames.length > 0) {
                embed.addFields(
                    { name: '🏆 أفضل المساعدين', value: supporterNames.join('\n'), inline: true }
                );
            }

            // Recent activity
            const recentTickets = allTickets
                .filter(t => t.status === 'open')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 3);

            if (recentTickets.length > 0) {
                const recentList = await Promise.all(
                    recentTickets.map(async (ticket) => {
                        try {
                            const user = await interaction.client.users.fetch(ticket.user_id);
                            const priority = ticket.priority || 'medium';
                            const priorityEmoji = priority === 'high' ? '🔴' : priority === 'low' ? '🟢' : '🟡';
                            return `${priorityEmoji} #${ticket.id} - ${user.username}`;
                        } catch {
                            return `❓ #${ticket.id} - مستخدم غير معروف`;
                        }
                    })
                );

                embed.addFields(
                    { name: '🕐 التذاكر المفتوحة الحديثة', value: recentList.join('\n'), inline: false }
                );
            }

            embed.setFooter({ text: `آخر تحديث: ${new Date().toLocaleString('ar-SA')}` })
                 .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('[TICKET STATS] Error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء جلب الإحصائيات.',
                ephemeral: true
            });
        }
    }
};

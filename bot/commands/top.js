const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const db = require('../../shared/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('عرض قائمة أفضل 10 لاعبين في السيرفر')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('نوع قائمة المتصدرين (XP أو Orbs)')
                .setRequired(false)
                .addChoices(
                    { name: 'XP', value: 'xp' },
                    { name: 'Orbs', value: 'orbs' }
                )),
    execute: async (interaction) => {
        const type = interaction.options.getString('type') || 'xp';
        let leaders = [];
        let title = '';

        if (type === 'xp') {
            leaders = await db.getXpLeaderboard(interaction.guildId, 10);
            title = '🏆 لوحة المتصدرين بحسب الخبرة (XP)';
        } else {
            leaders = await db.getOrbsLeaderboard(10);
            title = '💎 قائمة أكثر الأشخاص ثراءً (Orbs)';
        }

        if (!leaders || leaders.length === 0) return interaction.reply({ content: '❌ لا توجد بيانات كافية حالياً.', ephemeral: true });

        const list = leaders.map((u, i) => {
            const label = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            const val = type === 'xp' ? `Lvl ${u.level || 0} (${u.xp || 0} XP)` : `${(u.balance || 0).toLocaleString()} Orbs`;
            return `${label} <@${u.user_id}> — **${val}**`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(list)
            .setColor(type === 'xp' ? '#f0b232' : '#d946ef')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: `Umbral Leaderboards • ${interaction.guild.name}`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

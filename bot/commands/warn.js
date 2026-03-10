const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../shared/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('تحذير عضو في السيرفر')
        .addUserOption(option => option.setName('user').setDescription('العضو المراد تحذيره').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('سبب التحذير').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    execute: async (interaction) => {
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'لا يوجد سبب محدد';

        if (target.bot) return interaction.reply({ content: '❌ لا يمكنك تحذير البوتات.', ephemeral: true });

        db.addWarning(interaction.guildId, target.id, interaction.user.id, reason);
        const warnings = db.getWarnings(interaction.guildId, target.id);

        const embed = new EmbedBuilder()
            .setTitle('⚠️ تم إضافة تحذير')
            .addFields(
                { name: '👤 العضو', value: `<@${target.id}>`, inline: true },
                { name: '🛡️ المشرف', value: `<@${interaction.user.id}>`, inline: true },
                { name: '🔢 إجمالي التحذيرات', value: `${warnings.length}`, inline: true },
                { name: '📝 السبب', value: reason }
            )
            .setColor('#fbbf24')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Try to DM user
        try {
            await target.send(`⚠️ لقد تلقيت تحذيراً في سيرفر **${interaction.guild.name}**\nالسبب: ${reason}\nإجمالي تحذيراتك: ${warnings.length}`);
        } catch { }
    }
};

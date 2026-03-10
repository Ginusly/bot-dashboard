const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('كتم عضو (لمدة محددة أو مفتوحة)')
        .addUserOption(option => option.setName('user').setDescription('العضو المراد كتمه').setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('مدة الكتم بالدقائق (مثلاً: 60) - اتركها فارغة لكتم طويل')
                .setRequired(false))
        .addStringOption(option => option.setName('reason').setDescription('سبب الكتم').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    execute: async (interaction) => {
        const target = interaction.options.getMember('user');
        const duration = interaction.options.getInteger('duration') || 1440; // Default 24h
        const reason = interaction.options.getString('reason') || 'لا يوجد سبب محدد';

        if (!target.moderatable) return interaction.reply({ content: '❌ لا يمكنني كتم هذا العضو. تأكد من أن رتبته أقل من رتبتي.', ephemeral: true });

        try {
            await target.timeout(duration * 60 * 1000, reason);
            await interaction.reply({ content: `✅ تم كتم <@${target.id}> بنجاح لمدة **${duration}** دقيقة!\nسبب: ${reason}` });
        } catch (e) {
            await interaction.reply({ content: '❌ فشل كتم العضو. حاول مرة أخرى لاحقاً.', ephemeral: true });
        }
    }
};

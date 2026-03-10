const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('فك الحظر عن عضو معين')
        .addStringOption(option => option.setName('user_id').setDescription('ID العضو المراد فك الحظر عنه').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    execute: async (interaction) => {
        const userId = interaction.options.getString('user_id');
        try {
            await interaction.guild.members.unban(userId);
            await interaction.reply({ content: `✅ تم فك الحظر عن العضو بنجاح (ID: ${userId})!` });
        } catch (err) {
            await interaction.reply({ content: '❌ فشل فك الحظر. تأكد من أن الـ ID صحيح والقسم محظور بالفعل.', ephemeral: true });
        }
    }
};

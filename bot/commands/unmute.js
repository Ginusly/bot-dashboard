const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('فك الكتم عن عضو معين')
        .addUserOption(option => option.setName('user').setDescription('العضو المراد فك كتمه').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    execute: async (interaction) => {
        const target = interaction.options.getMember('user');
        if (!target.moderatable) return interaction.reply({ content: '❌ لا يمكنني فك كتم هذا العضو.', ephemeral: true });

        try {
            await target.timeout(null);
            await interaction.reply({ content: `✅ تم فك الكتم عن <@${target.id}> بنجاح!` });
        } catch (e) {
            await interaction.reply({ content: '❌ فشل فك كتم العضو. حاول مرة أخرى لاحقاً.', ephemeral: true });
        }
    }
};

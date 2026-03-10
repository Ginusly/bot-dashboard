const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('إغلاق القناة الحالية')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    execute: async (interaction) => {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false
        });
        await interaction.reply({ content: '🔒 تم إغلاق القناة بنجاح! لا يمكن لغير المشرفين إرسال الرسائل الآن.' });
    }
};

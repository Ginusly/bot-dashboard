const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('حذف عدد معين من الرسائل')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('عدد الرسائل المراد حذفها (بين 1 و 100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    execute: async (interaction) => {
        const amount = interaction.options.getInteger('amount');
        const deleted = await interaction.channel.bulkDelete(amount, true);

        await interaction.reply({ content: `✅ تم حذف **${deleted.size}** رسالة بنجاح!`, ephemeral: true });
    }
};

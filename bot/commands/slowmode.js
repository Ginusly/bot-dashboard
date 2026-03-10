const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('تغيير نظام التباطؤ (الوضع البطئ) في القناة')
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('عدد الثواني (بين 0 لتعطيله و 21600)')
                .setMinValue(0)
                .setMaxValue(21600)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    execute: async (interaction) => {
        const seconds = interaction.options.getInteger('seconds');
        await interaction.channel.setRateLimitPerUser(seconds);

        if (seconds === 0) {
            await interaction.reply({ content: '✅ تم تعطيل الوضع البطئ في هذه القناة.' });
        } else {
            await interaction.reply({ content: `✅ تم تفعيل الوضع البطئ! الفاصل هو **${seconds}** ثانية.` });
        }
    }
};

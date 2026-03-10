const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('رمي حجر نرد'),
    execute: async (interaction) => {
        const res = Math.floor(Math.random() * 6) + 1;
        await interaction.reply({ content: `🎲 نتيجة رمي النرد هي: **${res}**` });
    }
};

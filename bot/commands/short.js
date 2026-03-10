const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('short')
        .setDescription('اختصار رابط طويل لسهولة مشاركته')
        .addStringOption(option => option.setName('url').setDescription('الرابط الطويل').setRequired(true)),
    execute: async (interaction) => {
        const url = interaction.options.getString('url');
        if (!url.startsWith('http')) return interaction.reply({ content: '❌ يجب إدخال رابط صالح يبدأ بـ http أو https.', ephemeral: true });

        await interaction.deferReply();
        try {
            const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
            await interaction.editReply({ content: `✅ الرابط المختصر:\n${res.data}` });
        } catch (e) {
            await interaction.editReply('❌ فشل اختصار الرابط. حاول مرة أخرى لاحقاً.');
        }
    }
};

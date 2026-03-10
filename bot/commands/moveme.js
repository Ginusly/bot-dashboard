const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moveme')
        .setDescription('ينقلك إلى روم صوتي معين')
        .addChannelOption(option => option.setName('channel').setDescription('الروم الذي تود الذهاب إليه').setRequired(true)),
    execute: async (interaction) => {
        const channel = interaction.options.getChannel('channel');
        const member = interaction.member;

        if (channel.type !== 2) return interaction.reply({ content: '❌ يجب اختيار روم صوتي (Voice Channel).', ephemeral: true });
        if (!member.voice.channel) return interaction.reply({ content: '❌ يجب أن تكون موجوداً في روم صوتي ليتم نقلك.', ephemeral: true });

        try {
            await member.voice.setChannel(channel);
            await interaction.reply({ content: `🎵 تم نقلك بنجاح إلى <#${channel.id}>!` });
        } catch (err) {
            await interaction.reply({ content: '❌ لا أملك الصلاحية الكافية لنقلك. تأكد من إعطائي رتبة **Move Members**.', ephemeral: true });
        }
    }
};

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../shared/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('إرسال اقتراح جديد للسيرفر')
        .addStringOption(option => option.setName('suggestion').setDescription('ما هو اقتراحك؟').setRequired(true)),

    async execute(interaction) {
        const suggestion = interaction.options.getString('suggestion');
        const settings = db.getSettings(interaction.guildId);

        const targetChannelId = settings.suggestions_channel || interaction.channelId;
        const channel = interaction.guild.channels.cache.get(targetChannelId);

        if (!channel) return interaction.reply({ content: '❌ لم يتم العثور على قناة الاقتراحات.', ephemeral: true });

        const embed = new EmbedBuilder()
            .setAuthor({ name: `اقتراح من ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setDescription(suggestion)
            .setColor('#fbbf24')
            .setFooter({ text: 'استخدم الأزرار للتصويت على الاقتراح' })
            .setTimestamp();

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('suggest_up')
                .setLabel('👍 0')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('suggest_down')
                .setLabel('👎 0')
                .setStyle(ButtonStyle.Danger)
        );

        const msg = await channel.send({ embeds: [embed], components: [buttons] });

        await interaction.reply({ content: `✅ تم إرسال اقتراحك في <#${channel.id}>`, ephemeral: true });
    }
};

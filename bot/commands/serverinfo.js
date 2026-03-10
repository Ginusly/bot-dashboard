const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('عرض معلومات شاملة عن الخادم')
        .setDMPermission(false),
    async execute(interaction) {
        const { guild } = interaction;
        const { members, channels, roles, stickers, emojis } = guild;

        const embed = new EmbedBuilder()
            .setTitle(`🏰 معلومات خادم ${guild.name}`)
            .setColor('#5865F2')
            .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
            .setImage(guild.bannerURL({ size: 1024 }))
            .addFields(
                { name: '🆔 هوية الخادم', value: `${guild.id}`, inline: true },
                { name: '👑 المالك', value: `<@${guild.ownerId}>`, inline: true },
                { name: '📅 تاريخ الإنشاء', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                {
                    name: '👥 الأعضاء',
                    value: `• الإجمالي: **${guild.memberCount}**\n• المستخدمين: **${guild.memberCount - guild.members.cache.filter(m => m.user.bot).size}**\n• البوتات: **${guild.members.cache.filter(m => m.user.bot).size}**`,
                    inline: true
                },
                {
                    name: '💬 القنوات',
                    value: `• نصية: **${channels.cache.filter(c => c.type === 0).size}**\n• صوتية: **${channels.cache.filter(c => c.type === 2).size}**\n• فئات: **${channels.cache.filter(c => c.type === 4).size}**`,
                    inline: true
                },
                {
                    name: '✨ الإضافات',
                    value: `• الأدوار: **${roles.cache.size}**\n• الإيموجيات: **${emojis.cache.size}**\n• الملصقات: **${stickers.cache.size}**`,
                    inline: true
                },
                { name: '🚀 مستوى التعزيز', value: `المستوى **${guild.premiumTier}** (${guild.premiumSubscriptionCount} تعزيز)`, inline: false }
            )
            .setFooter({ text: `طلب بواسطة: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

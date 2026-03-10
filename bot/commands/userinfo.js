const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('عرض معلومات مفصلة عن مستخدم')
        .addUserOption(option => option.setName('user').setDescription('المستخدم المراد عرض معلوماته')),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle(`👤 معلومات ${user.username}`)
            .setColor(member?.displayHexColor || '#5865F2')
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .addFields(
                { name: '🆔 المعرف', value: `\`${user.id}\``, inline: true },
                { name: '🤖 بوت؟', value: user.bot ? 'نعم' : 'لا', inline: true },
                { name: '📅 انضم لـ ديسكورد', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
            );

        if (member) {
            embed.addFields(
                { name: '📥 انضم للسيرفر', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🏷️ أعلى رتبة', value: `${member.roles.highest}`, inline: true },
                { name: '🎭 الأدوار', value: member.roles.cache.size > 1 ? member.roles.cache.map(r => r).filter(r => r.name !== '@everyone').join(' ') : 'لا يوجد', inline: false }
            );
        }

        embed.setFooter({ text: `طلب بواسطة: ${interaction.user.username}` }).setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

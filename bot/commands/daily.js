const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../shared/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('استلام المكافأة اليومية من الـ Orbs'),
    async execute(interaction) {
        const result = await db.claimDaily('GLOBAL', interaction.user.id);

        if (!result.success) {
            const nextReset = new Date();
            nextReset.setDate(nextReset.getDate() + 1);
            nextReset.setHours(0, 0, 0, 0);

            const embed = new EmbedBuilder()
                .setTitle('⏰ عذراً، المكافأة مستلمة')
                .setDescription(`لقد استلمت مكافأتك اليومية بالفعل. عد إلينا غداً!\n\n**موعد التجديد:** <t:${Math.floor(nextReset.getTime() / 1000)}:R>`)
                .setColor('#EF4444')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const orbData = await db.getOrbs('GLOBAL', interaction.user.id);
        const embed = new EmbedBuilder()
            .setTitle('🎁 تم استلام المكافأة اليومية!')
            .setDescription(`لقد ربحت **${result.amount}** 🔮 Orbs!\n\n**رصيدك الآن:** ${orbData.balance.toLocaleString()} Orb`)
            .setColor('#10b981')
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'استمر في العمل الجاد!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const db = require('../../shared/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('credits')
        .setDescription('يظهر رصيدك أو رصيد شخص ما')
        .addUserOption(option => option.setName('user').setDescription('المستخدم المراد فحص رصيده')),
    execute: async (interaction) => {
        const target = interaction.options.getUser('user') || interaction.user;
        const orbs = await db.getOrbs('GLOBAL', target.id);

        const embed = new EmbedBuilder()
            .setTitle('💳 الرصيد')
            .setDescription(`رصيد <@${target.id}> الحالي:\n\n**${orbs.toLocaleString()} Orbs** 🔮`)
            .setColor('#3b82f6')
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

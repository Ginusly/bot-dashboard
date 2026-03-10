const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../shared/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('عرض تحذيرات عضو معين')
        .addUserOption(option => option.setName('user').setDescription('العضو المراد فحص تحذيراته').setRequired(false)),
    execute: async (interaction) => {
        const target = interaction.options.getUser('user') || interaction.user;
        const warnings = db.getWarnings(interaction.guildId, target.id);

        if (warnings.length === 0) {
            return interaction.reply({ content: `✅ <@${target.id}> ليس لديه أي تحذيرات مسبقة.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`📜 تحذيرات ${target.username}`)
            .setDescription(warnings.map((w, i) => `${i + 1}. **السبب:** ${w.reason}\n   **بواسطة:** <@${w.mod_id}>\n   **التاريخ:** <t:${Math.floor(new Date(w.created_at).getTime() / 1000)}:R>`).join('\n\n'))
            .setColor('#fbbf24')
            .setFooter({ text: `إجمالي التحذيرات: ${warnings.length}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../shared/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settitle')
        .setDescription('تعيين عنوان لبروفايلك')
        .addStringOption(option => 
            option.setName('title')
                .setDescription('العنوان الذي تريد تعيينه')
                .setRequired(true)
                .setMaxLength(50)
        ),
    async execute(interaction) {
        const title = interaction.options.getString('title');
        const userId = interaction.user.id;

        try {
            // Update user profile with new title
            db.updateUserProfile(userId, { title });

            const embed = {
                title: '✅ تم تحديث العنوان بنجاح!',
                description: `عنوانك الجديد: **${title}**`,
                color: 0x00ff88,
                timestamp: new Date().toISOString()
            };

            await interaction.reply({ embeds: [embed], ephemeral: true });
            console.log(`[TITLE] ${interaction.user.tag} set title to: ${title}`);

        } catch (error) {
            console.error('[TITLE] Error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء تحديث العنوان!',
                ephemeral: true
            });
        }
    }
};

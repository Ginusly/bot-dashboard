const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const db = require('../../shared/database');
const { generateWalletImage } = require('../services/imageGenerator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('إظهار محفظة الـ Orbs الخاصة بك في صورة مشفرة'),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const userId = interaction.user.id;
            const orbsData = await db.getOrbs('GLOBAL', userId);
            const userOrbs = orbsData ? orbsData.balance : 0;

            // Generate the image
            const buffer = await generateWalletImage(interaction.user, userOrbs);
            const attachment = new AttachmentBuilder(buffer, { name: 'wallet.png' });

            await interaction.editReply({ files: [attachment] });
        } catch (error) {
            console.error('[COMMAND: wallet] Error:', error);
            await interaction.editReply('❌ حدث خطأ أثناء جلب محفظتك. يرجى المحاولة لاحقاً.');
        }
    },
};

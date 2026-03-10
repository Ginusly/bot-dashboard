const { SlashCommandBuilder } = require('discord.js');
const db = require('../../shared/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('orbtransfer')
        .setDescription('تحويل orbs إلى عضو آخر')
        .addUserOption(opt => opt.setName('user').setDescription('المستلم').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('الكمية (الحد الأقصى 50م)').setRequired(true)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        if (amount <= 0) {
            return await interaction.reply({ content: '❌ كمية التحويل غير صالحة.', ephemeral: true });
        }
        if (amount > 50000000) {
            return await interaction.reply({ content: '❌ تم حظر التحويل: المبلغ ضخم جداً ويتجاوز الحد الأمن.', ephemeral: true });
        }
        if (targetUser.id === interaction.user.id) {
            return await interaction.reply({ content: '❌ لا يمكنك تحويل الـ Orbs لنفسك!', ephemeral: true });
        }
        if (targetUser.bot) {
            return await interaction.reply({ content: '❌ لا يمكنك تحويل الـ Orbs للبوتات!', ephemeral: true });
        }

        const result = await db.transferOrbs('GLOBAL', interaction.user.id, targetUser.id, amount);
        if (!result.success) {
            if (result.reason === 'insufficient_funds') {
                return await interaction.reply({ content: '❌ لا يوجد في محفظة الرب الخاصة بك اي orb.', ephemeral: true });
            }
            return await interaction.reply({ content: '❌ حدث خطأ في التحويل.', ephemeral: true });
        }

        const senderData = await db.getOrbs('GLOBAL', interaction.user.id);

        await interaction.reply(`💸 **تم التحويل بنجاح!**\n📤 المرسل: <@${interaction.user.id}>\n📥 المستلم: <@${targetUser.id}>\n💰 الكمية: **${amount}** 🔮 Orb\n💳 رصيدك المتبقي: ${senderData.balance} Orb`);
    },
};

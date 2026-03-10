const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vip')
        .setDescription('معلومات عن نظام بوتات البريميوم'),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setTitle('✨ نظام بوتات البريميوم (Umbral VIP)')
            .setDescription('هل تريد امتلاك بوت خاص بك بنفس مميزات Umbral؟\n\n' +
                '**المميزات:**\n' +
                '• اسم وصورة واسم نشاط مخصص.\n' +
                '• تشغيل 24/7 دون انقطاع.\n' +
                '• سرعة استجابة أعلى.\n' +
                '• تحكم كامل من الداشبورد الخاص بك.\n\n' +
                'للحصول على البوت، توجه إلى: [صفحة البريميوم](http://localhost:5173/premium)')
            .setColor('#fbbf24')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

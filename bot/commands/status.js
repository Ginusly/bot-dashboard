const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('عرض حالة البوت وإحصائيات النظام'),
    async execute(interaction) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;

        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

        const embed = new EmbedBuilder()
            .setTitle('🚀 حالة نظام Umbral Bot')
            .setColor('#10b981')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: '⏱️ وقت التشغيل', value: `${days}d ${hours}h ${minutes}m`, inline: true },
                { name: '🛰️ الخادم (Ping)', value: `${interaction.client.ws.ping}ms`, inline: true },
                { name: '📦 الإصدار', value: `v2.4.0 (D.JS ${version})`, inline: true },
                { name: '📟 الذاكرة المستخدمة', value: `${memoryUsage} MB / ${totalMemory} GB`, inline: true },
                { name: '🌍 السيرفرات', value: `${interaction.client.guilds.cache.size}`, inline: true },
                { name: '👥 المستخدمين', value: `${interaction.client.users.cache.size}`, inline: true }
            )
            .setFooter({ text: 'تم التطوير بواسطة Umbral Team' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

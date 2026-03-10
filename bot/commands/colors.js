const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const COLORS = [
    { name: 'Red', hex: '#ef4444', emoji: '🔴' },
    { name: 'Blue', hex: '#3b82f6', emoji: '🔵' },
    { name: 'Green', hex: '#22c55e', emoji: '🟢' },
    { name: 'Yellow', hex: '#fabb24', emoji: '🟡' },
    { name: 'Purple', hex: '#a855f7', emoji: '🟣' },
    { name: 'Pink', hex: '#ec4899', emoji: '💗' },
    { name: 'Orange', hex: '#f97316', emoji: '🟠' },
    { name: 'Cyan', hex: '#06b6d4', emoji: '🌊' },
    { name: 'White', hex: '#ffffff', emoji: '⚪' },
    { name: 'Black', hex: '#1c1c1c', emoji: '⚫' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('colors')
        .setDescription('عرض الألوان المتاحة لاختيار لونك الخاص'),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setTitle('🎨 الألوان المتاحة')
            .setDescription('اختر لونك المفضل باستخدام الأمر `/color [اللون]`\n\n' + COLORS.map(c => `${c.emoji} **${c.name}** (${c.hex})`).join('\n'))
            .setColor('#5865f2')
            .setFooter({ text: 'Umbral Color System' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
    COLORS
};

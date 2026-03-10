const { SlashCommandBuilder } = require('discord.js');
const { COLORS } = require('./colors');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('color')
        .setDescription('تغيير لونك في السيرفر')
        .addStringOption(option =>
            option.setName('color')
                .setDescription('اسم اللون (مثلاً: Red, Blue, Pink)')
                .setRequired(true)),
    execute: async (interaction) => {
        const colorName = interaction.options.getString('color').toLowerCase();
        const colorData = COLORS.find(c => c.name.toLowerCase() === colorName);

        if (!colorData) return interaction.reply({ content: '❌ هذا اللون غير متوفر حالياً. اكتب `/colors` لرؤية الألوان المتاحة.', ephemeral: true });

        const member = interaction.member;
        const guild = interaction.guild;

        // Cleanup old color roles
        const colorRoleNames = COLORS.map(c => `Umbral-${c.name}`);
        const userRoles = member.roles.cache.filter(r => colorRoleNames.includes(r.name));
        for (const [id, role] of userRoles) {
            await member.roles.remove(role).catch(() => { });
        }

        // Check/Create new role
        const roleName = `Umbral-${colorData.name}`;
        let role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            try {
                role = await guild.roles.create({
                    name: roleName,
                    color: colorData.hex,
                    reason: 'نظام الألوان التلقائي',
                    position: guild.members.me.roles.highest.position - 1
                });
            } catch (err) {
                return interaction.reply({ content: '❌ لا أملك صلاحية إنشاء الأدوار (Roles). تأكد من رفع رتبة البوت.', ephemeral: true });
            }
        }

        await member.roles.add(role);
        await interaction.reply({ content: `🎨 تم بنجاح تغيير لون اسمك إلى **${colorData.name}**!` });
    }
};

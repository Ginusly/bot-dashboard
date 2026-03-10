const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../shared/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('levelreward')
        .setDescription('إضافة أو حذف جوائز الرتب للمستويات')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('إضافة رتبة كجائزة لمستوى معين')
                .addIntegerOption(opt => opt.setName('level').setDescription('المستوى المطلوب').setRequired(true))
                .addRoleOption(opt => opt.setName('role').setDescription('الرتبة التي سيتم منحها').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('حذف جائزة مستوى معين')
                .addIntegerOption(opt => opt.setName('level').setDescription('المستوى المراد حذف جائزته').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('عرض جميع جوائز المستويات في السيرفر')
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        if (sub === 'add') {
            const level = interaction.options.getInteger('level');
            const role = interaction.options.getRole('role');
            db.addLevelReward(guildId, level, role.id);
            return interaction.reply(`✅ تم ضبط رتبة ${role} كجائزة للمستوى **${level}**!`);
        }

        if (sub === 'remove') {
            const level = interaction.options.getInteger('level');
            const rewards = db.getLevelRewards(guildId);
            const reward = rewards.find(r => r.level === level);
            if (!reward) return interaction.reply('❌ لا توجد جائزة مضبوطة لهذا المستوى.');

            db.deleteLevelReward(reward.id);
            return interaction.reply(`✅ تم حذف جائزة المستوى **${level}**.`);
        }

        if (sub === 'list') {
            const rewards = db.getLevelRewards(guildId);
            if (rewards.length === 0) return interaction.reply('ℹ️ لا توجد جوائز مستويات مضبوطة حالياً.');

            const description = rewards.map(r => `• المستوى **${r.level}**: <@&${r.role_id}>`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('🏆 جوائز المستويات')
                .setDescription(description)
                .setColor('#fbbf24');

            return interaction.reply({ embeds: [embed] });
        }
    }
};

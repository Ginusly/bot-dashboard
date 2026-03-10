const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('حظر عضو من السيرفر')
        .addUserOption(opt => opt.setName('user').setDescription('العضو المراد حظره').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('سبب الحظر').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'لا يوجد سبب';

        // Check user inside guild
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (member) {
            // Cannot ban self
            if (user.id === interaction.user.id) {
                return await interaction.reply({ content: '❌ لا يمكنك حظر نفسك.', ephemeral: true });
            }

            // Cannot ban someone with higher/equal role
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({ content: '❌ لا يمكنك حظر هذا العضو لأن رتبته أعلى أو تساوی رتبتك.', ephemeral: true });
            }
        }

        try {
            await interaction.guild.bans.create(user.id, { reason: reason });
            await interaction.reply(`✅ تم حظر العضو **${user.tag}** بنجاح.\nالسبب: ${reason}`);
        } catch (error) {
            console.error('[COMMAND: ban] Error:', error);
            await interaction.reply({ content: '❌ حدث خطأ، لم أتمكن من حظر العضو.', ephemeral: true });
        }
    },
};

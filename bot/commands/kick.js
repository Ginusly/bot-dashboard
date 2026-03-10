const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('طرد عضو من السيرفر')
        .addUserOption(opt => opt.setName('user').setDescription('العضو المراد طرده').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('سبب الطرد').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'لا يوجد سبب';

        // Check user
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return await interaction.reply({ content: '❌ العضو غير موجود في السيرفر.', ephemeral: true });
        }

        // Cannot kick self or bot
        if (user.id === interaction.user.id) {
            return await interaction.reply({ content: '❌ لا يمكنك طرد نفسك.', ephemeral: true });
        }

        // Cannot kick someone with higher/equal role
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return await interaction.reply({ content: '❌ لا يمكنك طرد هذا العضو لأن رتبته أعلى أو تساوی رتبتك.', ephemeral: true });
        }

        try {
            await member.kick(reason);
            await interaction.reply(`✅ تم طرد العضو **${user.tag}** بنجاح.\nالسبب: ${reason}`);
        } catch (error) {
            console.error('[COMMAND: kick] Error:', error);
            await interaction.reply({ content: '❌ حدث خطأ، لم أتمكن من طرد العضو.', ephemeral: true });
        }
    },
};

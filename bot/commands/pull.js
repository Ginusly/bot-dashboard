const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pull')
        .setDescription('سحب عضو من روم صوتي لآخر (أو لرومك الحالي)')
        .addUserOption(opt => opt.setName('user').setDescription('العضو المراد سحبه').setRequired(true))
        .addChannelOption(opt =>
            opt.setName('channel')
                .setDescription('الروم الصوتي المستهدف (اختياري، الافتراضي رومك الحالي)')
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const targetChannelOpt = interaction.options.getChannel('channel');

        // Check if executor is in a voice channel
        const executorMember = await interaction.guild.members.fetch(interaction.user.id);
        const executorVoiceChannel = executorMember.voice.channel;

        const destChannel = targetChannelOpt || executorVoiceChannel;

        if (!destChannel) {
            return await interaction.reply({ content: '❌ يرجى الانضمام لروم صوتي أو تحديد الروم المستهدف.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!targetMember || !targetMember.voice.channel) {
            return await interaction.reply({ content: `❌ العضو **${user.tag}** غير متصل بأي روم صوتي في هذا السيرفر.`, ephemeral: true });
        }

        try {
            await targetMember.voice.setChannel(destChannel.id);
            await interaction.reply(`✅ تم سحب **${user.tag}** إلى روم <#${destChannel.id}>.`);
        } catch (error) {
            console.error('[COMMAND: pull] Error:', error);
            await interaction.reply({ content: '❌ حدث خطأ، لم أتمكن من سحب العضو. ربما تنقصني الصلاحيات.', ephemeral: true });
        }
    },
};

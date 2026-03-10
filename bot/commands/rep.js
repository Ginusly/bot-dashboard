const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const db = require('../../shared/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rep')
        .setDescription('إعطاء سمعة لمستخدم آخر')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('المستخدم الذي تريد إعطاءه سمعة')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('سبب إعطاء السمعة (اختياري)')
                .setRequired(false)
        ),
    execute: async (interaction) => {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'بدون سبب';
        const fromUser = interaction.user;

        // Prevent giving reputation to yourself
        if (targetUser.id === fromUser.id) {
            return await interaction.reply({
                content: '❌ لا يمكنك إعطاء سمعة لنفسك!',
                ephemeral: true
            });
        }

        // Prevent giving reputation to bots
        if (targetUser.bot) {
            return await interaction.reply({
                content: '❌ لا يمكنك إعطاء سمعة للبوتات!',
                ephemeral: true
            });
        }

        try {
            const result = await db.addRep(fromUser.id, targetUser.id);

            if (!result.success) {
                if (result.reason === 'cooldown') {
                    return await interaction.reply({
                        content: '⏰ يمكنك إعطاء سمعة لهذا المستخدم مرة أخرى فقط بعد 24 ساعة!',
                        ephemeral: true
                    });
                }
                return await interaction.reply({
                    content: '❌ حدث خطأ أثناء محاولة إعطاء السمعة!',
                    ephemeral: true
                });
            }

            // Get updated reputation count
            const newRepProfile = await db.getUserProfile(targetUser.id);
            const newRep = newRepProfile.rep || 0;

            // Success message
            const embed = new EmbedBuilder()
                .setTitle('✨ تم إعطاء السمعة بنجاح!')
                .setDescription(`**${fromUser.username}** أعطى سمعة لـ **${targetUser.username}**`)
                .setColor('#00ff88')
                .addFields(
                    {
                        name: '📝 السبب',
                        value: reason,
                        inline: false
                    },
                    {
                        name: '⭐ السمعة الجديدة',
                        value: `${newRep} نقطة`,
                        inline: true
                    }
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Log the reputation action
            console.log(`[REP] ${fromUser.tag} gave reputation to ${targetUser.tag} (Reason: ${reason})`);

        } catch (error) {
            console.error('[REP] Error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ غير متوقع!',
                ephemeral: true
            });
        }
    }
};

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../shared/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maintenance')
        .setDescription('تحكم في وضع الصيانة للبوت')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('تفعيل وضع الصيانة')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('رسالة الصيانة')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('مدة الصيانة (مثال: 1h, 30m, 12h)')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('allowed_role')
                        .setDescription('رول مسموح له بتجاوز الصيانة')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('تعطيل وضع الصيانة')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('عرض حالة الصيانة الحالية')
        ),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'enable':
                await this.enableMaintenance(interaction);
                break;
            case 'disable':
                await this.disableMaintenance(interaction);
                break;
            case 'status':
                await this.showMaintenanceStatus(interaction);
                break;
        }
    },

    async enableMaintenance(interaction) {
        const message = interaction.options.getString('message') || 'النظام تحت الصيانة حالياً';
        const duration = interaction.options.getString('duration');
        const allowedRole = interaction.options.getRole('allowed_role');

        let endTime = null;
        if (duration) {
            const durationMs = this.parseDuration(duration);
            if (durationMs) {
                endTime = new Date(Date.now() + durationMs).toISOString();
            }
        }

        const allowedRoles = allowedRole ? [allowedRole.id] : null;

        db.setMaintenanceMode(interaction.guildId, true, message, allowedRoles, endTime);

        const embed = new EmbedBuilder()
            .setTitle('🔧 تم تفعيل وضع الصيانة')
            .setDescription('النظام الآن في وضع الصيانة')
            .setColor('#ff6b6b')
            .addFields(
                { name: '📝 الرسالة', value: message, inline: false },
                { name: '⏰ وقت البدء', value: new Date().toLocaleTimeString('ar-SA'), inline: true },
                { name: '⏱️ وقت الانتهاء', value: endTime ? new Date(endTime).toLocaleTimeString('ar-SA') : 'غير محدد', inline: true },
                { name: '👥 الرول المسموح', value: allowedRole ? allowedRole.name : 'لا يوجد', inline: true }
            )
            .setFooter({ text: 'فقط المشرفين يمكنهم استخدام الأوامر' });

        await interaction.reply({ embeds: [embed] });
        console.log(`[MAINTENANCE] Enabled by ${interaction.user.tag} in ${interaction.guild.name}`);
    },

    async disableMaintenance(interaction) {
        db.setMaintenanceMode(interaction.guildId, false);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعطيل وضع الصيانة')
            .setDescription('النظام الآن يعمل بشكل طبيعي')
            .setColor('#00ff88')
            .addFields(
                { name: '⏰ وقت التعطيل', value: new Date().toLocaleTimeString('ar-SA'), inline: true },
                { name: '👤 قام بالتعطيل', value: interaction.user.tag, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
        console.log(`[MAINTENANCE] Disabled by ${interaction.user.tag} in ${interaction.guild.name}`);
    },

    async showMaintenanceStatus(interaction) {
        const maintenance = db.getMaintenanceMode(interaction.guildId);
        const isEnabled = db.isMaintenanceMode(interaction.guildId);

        const embed = new EmbedBuilder()
            .setTitle('🔧 حالة الصيانة')
            .setColor(isEnabled ? '#ff6b6b' : '#00ff88')
            .addFields(
                { name: '📊 الحالة', value: isEnabled ? 'مفعل' : 'معطل', inline: true },
                { name: '📝 الرسالة', value: maintenance?.message || 'لا يوجد', inline: false }
            );

        if (maintenance) {
            embed.addFields(
                { name: '⏰ وقت البدء', value: maintenance.start_time ? new Date(maintenance.start_time).toLocaleTimeString('ar-SA') : 'غير محدد', inline: true },
                { name: '⏱️ وقت الانتهاء', value: maintenance.end_time ? new Date(maintenance.end_time).toLocaleTimeString('ar-SA') : 'غير محدد', inline: true }
            );

            if (maintenance.allowed_roles && maintenance.allowed_roles.length > 0) {
                const roleNames = maintenance.allowed_roles.map(roleId => {
                    const role = interaction.guild.roles.cache.get(roleId);
                    return role ? role.name : 'غير موجود';
                }).join(', ');
                
                embed.addFields(
                    { name: '👥 الرولات المسموحة', value: roleNames, inline: false }
                );
            }
        }

        await interaction.reply({ embeds: [embed] });
    },

    parseDuration(duration) {
        const match = duration.match(/^(\d+)([hm])$/);
        if (!match) return null;

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case 'h': return value * 60 * 60 * 1000; // hours to ms
            case 'm': return value * 60 * 1000; // minutes to ms
            default: return null;
        }
    }
};

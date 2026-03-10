const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('إنشاء رسالة إيمبد (Embed) مخصصة واحترافية')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option => option.setName('description').setDescription('نص الرسالة الأساسي').setRequired(true))
        .addStringOption(option => option.setName('title').setDescription('عنوان الرسالة').setRequired(false))
        .addStringOption(option => option.setName('color').setDescription('لون الرسالة (Hex مثل #ff0000)').setRequired(false))
        .addStringOption(option => option.setName('thumbnail').setDescription('رابط صورة مصغرة (Thumbnail)').setRequired(false))
        .addStringOption(option => option.setName('image').setDescription('رابط صورة كبيرة (Image)').setRequired(false))
        .addStringOption(option => option.setName('footer').setDescription('النص في أسفل الرسالة').setRequired(false)),

    async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description').replace(/\\n/g, '\n');
        const color = interaction.options.getString('color') || '#5865F2';
        const thumbnail = interaction.options.getString('thumbnail');
        const image = interaction.options.getString('image');
        const footer = interaction.options.getString('footer');

        const embed = new EmbedBuilder()
            .setDescription(description)
            .setColor(color.startsWith('#') ? color : `#${color}`);

        if (title) embed.setTitle(title);
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (image) embed.setImage(image);
        if (footer) embed.setFooter({ text: footer });

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '✅ تم إرسال الإيمبد بنجاح!', ephemeral: true });
    }
};

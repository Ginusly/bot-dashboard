const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const db = require('../../shared/database');
const { generateProfileImage } = require('../services/imageGenerator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('عرض مستواك وترتيبك في السيرفر')
        .addUserOption(option => option.setName('user').setDescription('المستخدم المراد فحص مستواه')),
    execute: async (interaction) => {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        const guildId = interaction.guildId;
        const userId = target.id;

        const settings = db.getSettings(guildId);
        const levelData = await db.getUserLevel(guildId, userId) || { xp: 0, level: 0 };

        const profile = await db.getUserProfile(userId);

        let profileData = {
            profile_background_url: null,
            frame_color: null,
            badges: [],
            title: profile.title || ""
        };

        if (profile.current_background) {
            const bg = await db.getShopItem(profile.current_background);
            if (bg) profileData.profile_background_url = bg.image_url;
        }
        if (profile.current_frame) {
            const frame = await db.getShopItem(profile.current_frame);
            if (frame) profileData.frame_color = frame.image_url;
        }

        if (profile.badges && profile.badges.length > 0) {
            for (const badgeId of profile.badges.slice(0, 8)) {
                try {
                    const badgeItem = await db.getShopItem(badgeId);
                    if (badgeItem) profileData.badges.push({ icon: badgeItem.icon, name: badgeItem.name, id: badgeId });
                } catch { }
            }
        }

        const buffer = await generateProfileImage(target, levelData, profileData);
        const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });

        await interaction.editReply({ files: [attachment] });
    }
};

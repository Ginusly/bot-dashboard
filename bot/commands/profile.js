const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../shared/database');
const { generateProfileImage } = require('../services/imageGenerator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('عرض بروفايلك الشخصي ومستواك في السيرفر أو بروفايل شخص آخر')
        .addUserOption(option => option.setName('user').setDescription('الشخص الذي تود رؤية بروفايله').setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const guildId = interaction.guildId;
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const userId = targetUser.id;
            const settings = db.getSettings(guildId);

            // Leveling logic: only show if enabled
            let levelData = null;
            if (settings.levels_enabled) {
                levelData = await db.getUserLevel(guildId, userId) || { xp: 0, level: 0 };
            }

            // Get profile data from database
            const profile = await db.getUserProfile(userId);

            // Prepare profile data for generator
            let profileData = {
                profile_background_url: null,
                frame_color: null,
                title: profile.title || '',
                rep: profile.rep || 0,
                badges: []
            };

            // Get background
            if (profile.current_background) {
                const bg = await db.getShopItem(profile.current_background);
                if (bg) {
                    profileData.profile_background_url = bg.image_url;
                    profileData.bg_is_css = bg.is_css;
                    profileData.bg_name = bg.name;
                }
            }

            // Get frame
            if (profile.current_frame) {
                const frame = await db.getShopItem(profile.current_frame);
                if (frame) {
                    profileData.frame_color = frame.image_url;
                    profileData.frame_is_css = frame.is_css;
                    profileData.frame_name = frame.name;
                }
            }

            // Get badges with details
            if (profile.badges && profile.badges.length > 0) {
                const seenIcons = new Set();
                for (const badgeId of [...new Set(profile.badges)]) {
                    if (profileData.badges.length >= 10) break; // Max 10 badges
                    try {
                        const badgeItem = await db.getShopItem(badgeId);
                        if (badgeItem) {
                            const icon = badgeItem.icon || '⭐';
                            if (!seenIcons.has(icon)) {
                                seenIcons.add(icon);
                                profileData.badges.push({
                                    icon: badgeItem.image_url || icon,
                                    name: badgeItem.name,
                                    id: badgeId,
                                    color: badgeItem.color
                                });
                            }
                        } else {
                            if (!seenIcons.has('⭐')) {
                                seenIcons.add('⭐');
                                profileData.badges.push({ icon: '⭐', name: 'Badge', id: badgeId });
                            }
                        }
                    } catch {
                        if (!seenIcons.has('⭐')) {
                            seenIcons.add('⭐');
                            profileData.badges.push({ icon: '⭐', name: 'Badge', id: badgeId });
                        }
                    }
                }
            }

            console.log(`[PROFILE] Generating profile image for ${targetUser.tag}...`);

            // Generate profile image using original generator
            let buffer, attachment;

            if (profileData.bg_is_css || profileData.frame_is_css) {
                console.log(`[PROFILE] Generating animated GIF for ${targetUser.tag}...`);
                const { generateAnimatedProfileGif } = require('../services/gifGenerator');
                buffer = await generateAnimatedProfileGif(targetUser, levelData, profileData);
                attachment = new AttachmentBuilder(buffer, { name: 'profile.gif' });
            } else {
                buffer = await generateProfileImage(targetUser, levelData, profileData);
                attachment = new AttachmentBuilder(buffer, { name: 'profile.png' });
            }

            await interaction.editReply({ files: [attachment] });
            console.log(`[PROFILE] Sent profile for ${targetUser.tag}`);

        } catch (error) {
            console.error('[COMMAND: profile] Detailed Error:', error);
            await interaction.editReply(`❌ فشل في استخراج البروفايل: ${error.message}`);
        }
    },
};

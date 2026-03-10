const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const db = require('../../shared/database');

class SlashCommandRegister {
    constructor(client) {
        this.client = client;
    }

    async registerGuildCommands(guildId) {
        try {
            if (!process.env.CLIENT_ID) {
                return console.error('[BOT] CLIENT_ID is missing in .env');
            }

            const customCommands = db.getCustomCommands(guildId);
            const slashCommands = customCommands
                .filter(cmd => cmd.is_slash)
                .map(cmd => {
                    const builder = new SlashCommandBuilder()
                        .setName(cmd.command.toLowerCase().replace(/\s+/g, '-'))
                        .setDescription(cmd.description || 'أمر مخصص');
                    return builder.toJSON();
                });

            // ONLY register Custom Slash Commands for guilds, 
            // Built-in commands should be handled globally by deploy-commands.js
            const allSlash = [...slashCommands];

            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

            // Use applicationGuildCommands for instant update in specific guild
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
                { body: allSlash }
            );
            console.log(`[BOT] Registered ${allSlash.length} slash commands for ${guildId}`);
            return true;
        } catch (error) {
            console.error(`[BOT] Error registering commands for guild ${guildId}:`, error);
            return false;
        }
    }

    async registerGlobalCommands() {
        try {
            if (!process.env.CLIENT_ID) return;

            const builtInSlash = this.client.commands.map(cmd => cmd.data.toJSON());
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

            console.log('[BOT] Registering global slash commands...');
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: builtInSlash }
            );
            console.log('[BOT] Global slash commands registered successfully!');
        } catch (error) {
            console.error('[BOT] Error registering global commands:', error);
        }
    }

    async clearGuildCommands(guildId) {
        try {
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
                { body: [] }
            );
            console.log(`[BOT] Cleared all slash commands for guild ${guildId}`);
            return true;
        } catch (error) {
            console.error(`[BOT] Error clearing commands for guild ${guildId}:`, error);
            return false;
        }
    }

    async getGuildCommands(guildId) {
        try {
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
            const commands = await rest.get(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId)
            );
            return commands;
        } catch (error) {
            console.error(`[BOT] Error fetching commands for guild ${guildId}:`, error);
            return [];
        }
    }
}

module.exports = SlashCommandRegister;

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const clientId = process.env.CLIENT_ID;
const token = process.env.DISCORD_TOKEN;
const guildId = process.env.TEST_GUILD_ID; // أضف هذا في ملف .env

if (!clientId || !token || !guildId) {
    console.error('Missing required environment variables. Please check CLIENT_ID, DISCORD_TOKEN, and TEST_GUILD_ID in .env');
    process.exit(1);
}

const commands = [];

// Load all command files
const commandsPath = path.join(__dirname, 'bot/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if (command && command.data) {
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
        console.warn(`⚠️ Command at ${file} is missing data property`);
    }
}

console.log(`\n📊 Total commands to register: ${commands.length}`);
console.log('📋 Commands list:', commands.map(c => c.name).join(', '));

// Register commands for specific guild (instant update)
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`\n🔄 Started registering ${commands.length} application (/) commands for guild ${guildId}.`);

        // Clear existing commands first
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: [] }
        );
        console.log('✅ Cleared existing guild commands');

        // Register new commands
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log(`✅ Successfully registered ${data.length} application (/) commands for guild!`);
        console.log('🎉 Commands should appear immediately in Discord!');
        
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
})();

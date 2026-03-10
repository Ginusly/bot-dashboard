const path = require('path');
const fs = require('fs');

class CommandLoader {
    constructor(client) {
        this.client = client;
    }

    async loadCommands() {
        this.client.commands.clear();
        const commandsPath = path.join(__dirname, '../commands');
        
        try {
            if (fs.existsSync(commandsPath)) {
                const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
                
                for (const file of commandFiles) {
                    const filePath = path.join(commandsPath, file);
                    try {
                        // Clear cache for hot reloading
                        delete require.cache[require.resolve(filePath)];
                        const command = require(filePath);
                        
                        if (command && command.data && command.execute) {
                            this.client.commands.set(command.data.name, command);
                            console.log(`[BOT] Loaded command: ${command.data.name}`);
                        } else {
                            console.warn(`[BOT] Command at ${file} is missing data or execute!`);
                        }
                    } catch (cmdErr) {
                        console.error(`[BOT] Failed to load command ${file}:`, cmdErr.message);
                    }
                }
                
                console.log(`[BOT] Loaded ${this.client.commands.size} commands`);
                return this.client.commands.size;
            } else {
                console.warn('[BOT] Commands directory not found');
                return 0;
            }
        } catch (e) {
            console.error('[BOT] Error loading commands:', e);
            return 0;
        }
    }

    async reloadCommands() {
        console.log('[BOT] Reloading commands...');
        return await this.loadCommands();
    }

    getCommandCount() {
        return this.client.commands.size;
    }

    getCommandList() {
        return Array.from(this.client.commands.keys());
    }

    getCommand(name) {
        return this.client.commands.get(name);
    }

    hasCommand(name) {
        return this.client.commands.has(name);
    }
}

module.exports = CommandLoader;

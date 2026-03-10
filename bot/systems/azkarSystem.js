const { EmbedBuilder } = require('discord.js');
const db = require('../../shared/database');

class AzkarSystem {
    constructor(client) {
        this.client = client;
        this.azkarMorning = [
            '**أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ**',
            '**اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ**',
            '**أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ ﷺ**',
            '**سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ**',
            '**اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ**',
        ];

        this.azkarEvening = [
            '**أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ**',
            '**اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ**',
            '**أَمْسَيْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ ﷺ**',
            '**أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ**',
            '**بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ**',
        ];
    }

    async sendAzkar(guild, type = 'morning') {
        try {
            const config = db.getAzkarConfig(guild.id);
            if (!config?.channel_id || !config.enabled) {
                return;
            }

            const channel = guild.channels.cache.get(config.channel_id);
            if (!channel) {
                console.warn(`[AZKAR] Channel not found: ${config.channel_id} for guild ${guild.id}`);
                return;
            }

            // Skip if this type is disabled
            if (type === 'morning' && !config.send_morning) return;
            if (type === 'evening' && !config.send_evening) return;

            const azkarList = type === 'morning' ? this.azkarMorning : this.azkarEvening;
            const randomAzkar = azkarList[Math.floor(Math.random() * azkarList.length)];

            const embed = new EmbedBuilder()
                .setTitle(type === 'morning' ? '🌅 أذكار الصباح' : '🌙 أذكار المساء')
                .setDescription(randomAzkar)
                .setColor(type === 'morning' ? '#F59E0B' : '#6366F1')
                .setFooter({ text: 'Umbral Bot — الأذكار' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            console.log(`[AZKAR] Sent ${type} azkar to ${guild.name}`);

        } catch (error) {
            console.error(`[AZKAR] Error sending ${type} azkar:`, error.message);
        }
    }

    async testAzkar(guild) {
        try {
            const config = db.getAzkarConfig(guild.id);
            if (!config?.channel_id) {
                return console.warn(`[AZKAR] No channel configured for guild ${guild.id}`);
            }

            const channel = guild.channels.cache.get(config.channel_id);
            if (!channel) {
                return console.warn(`[AZKAR] Channel not found: ${config.channel_id}`);
            }

            const embed = new EmbedBuilder()
                .setTitle('🧪 تجربة الأذكار')
                .setDescription('هذه رسالة تجريبية للتأكد من أن نظام الأذكار يعمل بشكل صحيح.\n\n**أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ**')
                .setColor('#23a559')
                .setFooter({ text: 'Umbral Bot — رسالة تجريبية' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            console.log(`[AZKAR] Test message sent to ${guild.name}`);

        } catch (error) {
            console.error('[AZKAR] Error sending test message:', error.message);
        }
    }

    getAzkarCount() {
        return {
            morning: this.azkarMorning.length,
            evening: this.azkarEvening.length,
            total: this.azkarMorning.length + this.azkarEvening.length
        };
    }

    getRandomAzkar(type = 'both') {
        if (type === 'morning') {
            return this.azkarMorning[Math.floor(Math.random() * this.azkarMorning.length)];
        } else if (type === 'evening') {
            return this.azkarEvening[Math.floor(Math.random() * this.azkarEvening.length)];
        } else {
            const allAzkar = [...this.azkarMorning, ...this.azkarEvening];
            return allAzkar[Math.floor(Math.random() * allAzkar.length)];
        }
    }
}

module.exports = AzkarSystem;

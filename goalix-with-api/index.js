const { Client, GatewayIntentBits, Partials } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

const userPrefsPath = './user_prefs.json';

if (!fs.existsSync(userPrefsPath)) {
    fs.writeFileSync(userPrefsPath, JSON.stringify({}));
}

client.once('ready', () => {
    console.log(`✅ GOALIX est en ligne en tant que ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === '!matchs') {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
                headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY },
                params: { date: today, timezone: 'Europe/Paris' }
            });

            const matches = response.data.response;
            if (!matches.length) return message.channel.send('Aucun match trouvé pour aujourd'hui ⚽');

            let msg = '🗓️ **Matchs du jour** :\n';
            matches.slice(0, 5).forEach(match => {
                const home = match.teams.home.name;
                const away = match.teams.away.name;
                const time = match.fixture.date.split('T')[1].substring(0, 5);
                msg += `• ${home} vs ${away} – ${time}\n`;
            });

            message.channel.send(msg);
        } catch (err) {
            console.error(err);
            message.channel.send('❌ Erreur lors de la récupération des matchs.');
        }
    }

    if (command === '!notif' && args.length) {
        const club = args.join(' ').toLowerCase();
        const prefs = JSON.parse(fs.readFileSync(userPrefsPath));
        const userId = message.author.id;

        if (!prefs[userId]) prefs[userId] = [];
        if (!prefs[userId].includes(club)) {
            prefs[userId].push(club);
            fs.writeFileSync(userPrefsPath, JSON.stringify(prefs, null, 2));
            message.channel.send(`🔔 Tu recevras des notifs pour **${club}**`);
        } else {
            message.channel.send(`✅ Tu es déjà abonné à **${club}**`);
        }
    }

    if (command === '!stopnotif') {
        const prefs = JSON.parse(fs.readFileSync(userPrefsPath));
        const userId = message.author.id;
        prefs[userId] = [];
        fs.writeFileSync(userPrefsPath, JSON.stringify(prefs, null, 2));
        message.channel.send('🚫 Tu as été désabonné de toutes les notifications.');
    }

    if (command === '!mesclubs') {
        const prefs = JSON.parse(fs.readFileSync(userPrefsPath));
        const userId = message.author.id;
        const clubs = prefs[userId] || [];
        if (clubs.length === 0) {
            message.channel.send('❌ Tu ne suis actuellement aucun club.');
        } else {
            message.channel.send(`📋 Tu suis : ${clubs.map(c => `**${c}**`).join(', ')}`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
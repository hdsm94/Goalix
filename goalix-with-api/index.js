const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`✅ GOALIX est en ligne en tant que ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!matchs') {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
                headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY },
                params: {
                    date: today,
                    timezone: 'Europe/Paris'
                }
            });

            const matchs = response.data.response;
            if (!matchs.length) return message.channel.send('Aucun match trouvé pour aujourd'hui ⚽');

            let msg = '🗓️ **Matchs du jour** :\n';
            matchs.slice(0, 5).forEach(match => {
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
});
client.login(process.env.DISCORD_TOKEN);
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

// Exportamos uma função assíncrona para ser chamada no startup do bot
module.exports = async function deployCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, 'src', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[AVISO] O comando em ${filePath} está faltando a propriedade "data" ou "execute".`);
        }
    }

    const rest = new REST().setToken(process.env.BOT_TOKEN);

    try {
        console.log(`Iniciando a atualização de ${commands.length} comandos de aplicação (/) na guilda.`);

        // A mudança principal está aqui: Routes.applicationGuildCommands
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`✅ Sucesso! ${data.length} comandos foram recarregados na guilda.`);
    } catch (error) {
        console.error('Erro ao recarregar comandos:', error);
    }
};
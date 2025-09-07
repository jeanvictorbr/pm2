// ===============================================
//               IMPORTS E CLIENTS
// ===============================================
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();
const deployCommands = require('../deploy-commands');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Componentes Visuais
const { createMainDashboard, createModulesMenu } = require('./components/mainDashboard');
const { createThemesDashboard, createThemeModal, createPasswordModal, enterPasswordModal } = require('./components/themesDashboard');

const prisma = new PrismaClient();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// ===============================================
//               COMMAND HANDLER
// ===============================================
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[AVISO] O comando em ${filePath} está faltando a propriedade "data" ou "execute".`);
  }
}

// ===============================================
//        MASTER INTERACTION EVENT LISTENER
// ===============================================
client.on('interactionCreate', async interaction => {
  // Rota para comandos de barra (/)
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
      return;
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true });
    }
    return;
  }
  
  // Rota para botões
  if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId === 'open_modules_menu' || customId === 'back_to_modules_menu') {
      const menu = createModulesMenu();
      return interaction.update({ content: '', embeds: menu.embeds, components: menu.components });
    }
    
    if (customId === 'back_to_main_dashboard') {
      const dashboard = createMainDashboard();
      return interaction.update({ embeds: dashboard.embeds, components: dashboard.components });
    }

    if (customId === 'theme_create') {
        const modal = createThemeModal();
        return interaction.showModal(modal);
    }
    // Futuramente, botões de editar e deletar tema aqui...
    return;
  }

  // Rota para menus de seleção
  if (interaction.isStringSelectMenu()) {
    const customId = interaction.customId;
    if (customId === 'select_module') {
      const selectedValue = interaction.values[0];

      if (selectedValue === 'module_general') {
        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guild_id: interaction.guildId },
        });

        if (!guildConfig || !guildConfig.theme_config_password) {
            const modal = createPasswordModal();
            return interaction.showModal(modal);
        } else {
            const modal = enterPasswordModal();
            return interaction.showModal(modal);
        }
      }
      // Futuramente, outros módulos aqui...
    }
    return;
  }

  // Rota para submissão de modais
  if (interaction.isModalSubmit()) {
    const customId = interaction.customId;

    if (customId === 'password_create_modal') {
      const password = interaction.fields.getTextInputValue('password_input');
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.guildConfig.upsert({
          where: { guild_id: interaction.guildId },
          update: { theme_config_password: hashedPassword },
          create: { guild_id: interaction.guildId, theme_config_password: hashedPassword }
      });

      return interaction.reply({ content: '✅ Senha definida com sucesso! Use o menu novamente para acessar o painel de temas.', ephemeral: true });
    }

    if (customId === 'password_enter_modal') {
        const guildConfig = await prisma.guildConfig.findUnique({ where: { guild_id: interaction.guildId } });
        const inputPassword = interaction.fields.getTextInputValue('password_input');
        const isMatch = await bcrypt.compare(inputPassword, guildConfig.theme_config_password);

        if (isMatch) {
            const themes = await prisma.garrisonTheme.findMany({ where: { guild_id: interaction.guildId } });
            const dashboard = createThemesDashboard(themes);
            return interaction.update({ content: '', ...dashboard });
        } else {
            return interaction.reply({ content: '❌ Senha incorreta.', ephemeral: true });
        }
    }

    if (customId === 'theme_create_modal') {
        await interaction.deferUpdate(); // Confirma o recebimento para evitar timeout
        const name = interaction.fields.getTextInputValue('theme_name');
        const nickname = interaction.fields.getTextInputValue('theme_bot_nickname');
        const color = interaction.fields.getTextInputValue('theme_embed_color');
        const banner = interaction.fields.getTextInputValue('theme_banner_url');

        if (!/^#[0-9A-F]{6}$/i.test(color)) {
            return interaction.followUp({ content: '❌ Formato de cor inválido. Use o formato hexadecimal (ex: #FF5733).', ephemeral: true });
        }

        await prisma.garrisonTheme.create({
            data: { name, bot_nickname: nickname || null, embed_color: color, main_panel_banner_url: banner || null, guild_id: interaction.guildId }
        });

        const themes = await prisma.garrisonTheme.findMany({ where: { guild_id: interaction.guildId } });
        const dashboard = createThemesDashboard(themes);
        await interaction.editReply({ content: `✅ Tema "${name}" criado com sucesso!`, ...dashboard });
    }
    return;
  }
});


// ===============================================
//           BOT STARTUP FUNCTION
// ===============================================
async function main() {
  try {
    // Registra os comandos automaticamente ao iniciar
    await deployCommands();

    client.once('ready', () => {
      console.log(`✅ | Logado como ${client.user.tag}!`);
      console.log(`🚀 | PoliceFlow V2 está pronto para operar.`);
    });

    // Faz o login do bot usando o token do arquivo .env
    await client.login(process.env.BOT_TOKEN);
  } catch (error) {
    console.error("Erro ao iniciar o bot:", error);
  }
}

main();
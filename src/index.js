// ===============================================
//               IMPORTS E CLIENTS
// ===============================================
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js'); // Adicionado "Events"
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();
const deployCommands = require('../deploy-commands');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Componentes Visuais (Importando as novas funções que você irá criar no próximo passo)
const { createMainDashboard, createModulesMenu } = require('./components/mainDashboard');
const {
    createThemesDashboard, createThemeModal, createPasswordModal,
    enterPasswordModal, createEditThemeModal, createThemeSelectionMenu,
    createDeleteConfirmation
} = require('./components/themesDashboard'); // <- Garanta que seu arquivo themesDashboard exporte tudo isso

const prisma = new PrismaClient();
const client = new Client({
  intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers ],
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
client.on(Events.InteractionCreate, async interaction => { // Usando Events.InteractionCreate
  // Rota para comandos de barra (/)
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Ocorreu um erro!', ephemeral: true });
    }
    return;
  }
  
  // Rota para botões
  if (interaction.isButton()) {
    const customId = interaction.customId;

    // --- Navegação ---
    if (customId === 'open_modules_menu' || customId === 'back_to_modules_menu') {
        return interaction.update({ content: '', ...createModulesMenu() });
    }
    if (customId === 'back_to_main_dashboard') {
        return interaction.update({ ...createMainDashboard() });
    }
    if (customId === 'cancel_action') {
        return interaction.message.delete();
    }
    
    // --- Lógica de Temas ---
    const themes = await prisma.garrisonTheme.findMany({ where: { guild_id: interaction.guildId }});

    if (customId === 'set_garrison_theme') {
        if (themes.length === 0) return interaction.reply({ content: '❌ Nenhum tema foi criado ainda.', ephemeral: true });
        return interaction.reply({ ...createThemeSelectionMenu(themes, 'select_active_theme', 'Selecione o Tema Ativo'), ephemeral: true });
    }

    if (customId === 'theme_create') {
        return interaction.showModal(createThemeModal());
    }
    if (customId === 'theme_edit') {
        if (themes.length === 0) return interaction.reply({ content: '❌ Nenhum tema para editar.', ephemeral: true });
        return interaction.reply({ ...createThemeSelectionMenu(themes, 'select_theme_to_edit', 'Selecione um tema para editar'), ephemeral: true });
    }
    if (customId === 'theme_delete') {
        if (themes.length === 0) return interaction.reply({ content: '❌ Nenhum tema para deletar.', ephemeral: true });
        return interaction.reply({ ...createThemeSelectionMenu(themes, 'select_theme_to_delete', 'Selecione um tema para deletar'), ephemeral: true });
    }
    
    if (customId.startsWith('theme_delete_confirm_')) {
        const themeId = parseInt(customId.split('_')[3]);
        await prisma.garrisonTheme.delete({ where: { id: themeId }});

        const updatedThemes = await prisma.garrisonTheme.findMany({ where: { guild_id: interaction.guildId } });
        return interaction.update({ content: '🗑️ Tema deletado com sucesso!', ...createThemesDashboard(updatedThemes) });
    }
    return;
  }

  // Rota para menus de seleção
  if (interaction.isStringSelectMenu()) {
    const customId = interaction.customId;
    if (customId === 'select_module') {
      const selectedValue = interaction.values[0];

      if (selectedValue === 'module_general') {
        const guildConfig = await prisma.guildConfig.findUnique({ where: { guild_id: interaction.guildId } });
        if (!guildConfig || !guildConfig.theme_config_password) {
            return interaction.showModal(createPasswordModal());
        } else {
            return interaction.showModal(enterPasswordModal());
        }
      } else {
        // CORREÇÃO DO BUG AQUI
        // Responde para os outros módulos que ainda não estão prontos
        await interaction.update({ content: `O módulo selecionado (${selectedValue}) ainda está em desenvolvimento.`, embeds: [], components: [] });
      }
    }

    const selectedId = parseInt(interaction.values[0]);
    
    if (customId === 'select_theme_to_edit') {
        await interaction.message.delete();
        const theme = await prisma.garrisonTheme.findUnique({ where: { id: selectedId }});
        return interaction.showModal(createEditThemeModal(theme));
    }
    if (customId === 'select_theme_to_delete') {
        await interaction.message.delete();
        const theme = await prisma.garrisonTheme.findUnique({ where: { id: selectedId }});
        return interaction.reply({ ...createDeleteConfirmation(theme), ephemeral: true });
    }
    if (customId === 'select_active_theme') {
        const theme = await prisma.garrisonTheme.findUnique({ where: { id: selectedId }});
        await prisma.guildConfig.update({
            where: { guild_id: interaction.guildId },
            data: { active_theme_id: selectedId }
        });

        if (theme.bot_nickname) {
            try {
                await interaction.guild.members.me.setNickname(theme.bot_nickname);
            } catch (error) {
                return interaction.update({ content: `⚠️ Tema **${theme.name}** definido, mas não foi possível alterar o apelido. Verifique minhas permissões.`, embeds: [], components: [] });
            }
        }
        return interaction.update({ content: `✅ Tema **${theme.name}** definido como ativo!`, embeds: [], components: [] });
    }
    return;
  }

  // Rota para submissão de modais
  if (interaction.isModalSubmit()) {
    const customId = interaction.customId;

    if (customId === 'password_create_modal' || customId === 'password_enter_modal') {
        // ... (seu código de senha, sem alterações)
    }
    if (customId === 'theme_create_modal') {
        // ... (seu código de criação de tema, sem alterações)
    }
    if (customId.startsWith('theme_edit_modal_')) {
        const themeId = parseInt(customId.split('_')[3]);
        await interaction.deferUpdate();
        const name = interaction.fields.getTextInputValue('theme_name');
        const nickname = interaction.fields.getTextInputValue('theme_bot_nickname');
        const color = interaction.fields.getTextInputValue('theme_embed_color');
        const banner = interaction.fields.getTextInputValue('theme_banner_url');
        
        await prisma.garrisonTheme.update({
            where: { id: themeId },
            data: { name, bot_nickname: nickname || null, embed_color: color, main_panel_banner_url: banner || null }
        });

        const themes = await prisma.garrisonTheme.findMany({ where: { guild_id: interaction.guildId } });
        await interaction.editReply({ content: `✅ Tema **${name}** atualizado com sucesso!`, ...createThemesDashboard(themes) });
    }
    return;
  }
});

// ===============================================
//           BOT STARTUP FUNCTION
// ===============================================
async function main() {
  try {
    await deployCommands();
    client.once(Events.ClientReady, () => { // Usando Events.ClientReady
      console.log(`✅ | Logado como ${client.user.tag}!`);
      console.log(`🚀 | PoliceFlow V2 está pronto para operar.`);
    });
    await client.login(process.env.BOT_TOKEN);
  } catch (error) {
    console.error("Erro ao iniciar o bot:", error);
  }
}

main();
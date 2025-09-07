const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

// Painel principal do gerenciamento de temas (após inserir a senha)
function createThemesDashboard(themes) {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2) // Cor Discord "Blurple"
        .setTitle('🎨 Gerenciamento de Temas de Guarnição')
        .setDescription(
            'Aqui você pode criar, editar e deletar os temas visuais do bot.\n\n' +
            '**Temas Atuais:**\n' +
            (themes.length > 0 ? themes.map(t => `• ${t.name}`).join('\n') : 'Nenhum tema criado.')
        )
        .setFooter({ text: 'As alterações são aplicadas imediatamente.' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('theme_create').setLabel('Criar Tema').setStyle(ButtonStyle.Success).setEmoji('➕'),
        new ButtonBuilder().setCustomId('theme_edit').setLabel('Editar Tema').setStyle(ButtonStyle.Primary).setEmoji('✏️'),
        new ButtonBuilder().setCustomId('theme_delete').setLabel('Deletar Tema').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
    );

    const backRow = new ActionRowBuilder().addComponents(
         new ButtonBuilder().setCustomId('back_to_modules_menu').setLabel('Voltar').setStyle(ButtonStyle.Secondary).setEmoji('⬅️'),
    );

    return { embeds: [embed], components: [row, backRow] };
}

// Modal para CRIAR um novo tema
function createThemeModal() {
    return new ModalBuilder()
        .setCustomId('theme_create_modal')
        .setTitle('Criar Novo Tema de Guarnição')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('theme_name').setLabel('Nome do Tema (Ex: LSPD)').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('theme_bot_nickname').setLabel('Apelido do Bot (Opcional)').setStyle(TextInputStyle.Short).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('theme_embed_color').setLabel('Cor da Embed (Hex: #RRGGBB)').setStyle(TextInputStyle.Short).setRequired(true).setValue('#2b2d31')
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('theme_banner_url').setLabel('URL do Banner Principal (Opcional)').setStyle(TextInputStyle.Short).setRequired(false)
            )
        );
}

// Modal para DEFINIR a senha pela primeira vez
function createPasswordModal() {
    return new ModalBuilder()
        .setCustomId('password_create_modal')
        .setTitle('Crie uma Senha de Acesso')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('password_input').setLabel('Senha').setPlaceholder('Digite uma senha forte').setStyle(TextInputStyle.Short).setRequired(true)
            )
        );
}

// Modal para INSERIR a senha existente
function enterPasswordModal() {
     return new ModalBuilder()
        .setCustomId('password_enter_modal')
        .setTitle('Acesso Protegido')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('password_input').setLabel('Senha').setPlaceholder('Digite a senha de acesso').setStyle(TextInputStyle.Short).setRequired(true)
            )
        );
}

module.exports = { createThemesDashboard, createThemeModal, createPasswordModal, enterPasswordModal };
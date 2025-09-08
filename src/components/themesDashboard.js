const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');

// Painel principal do gerenciamento de temas (sem alterações)
function createThemesDashboard(themes) {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
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

// Modal para CRIAR um novo tema (sem alterações)
function createThemeModal() { /* ... código que você já tem ... */ }
function createPasswordModal() { /* ... código que você já tem ... */ }
function enterPasswordModal() { /* ... código que você já tem ... */ }

// ===============================================
//         NOVOS COMPONENTES ADICIONADOS
// ===============================================

// Modal para EDITAR um tema (pré-preenchido)
function createEditThemeModal(theme) {
    return new ModalBuilder()
        .setCustomId(`theme_edit_modal_${theme.id}`) // ID dinâmico
        .setTitle('Editar Tema de Guarnição')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('theme_name').setLabel('Nome do Tema').setStyle(TextInputStyle.Short).setValue(theme.name).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('theme_bot_nickname').setLabel('Apelido do Bot (Opcional)').setStyle(TextInputStyle.Short).setValue(theme.bot_nickname || '').setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('theme_embed_color').setLabel('Cor da Embed (Hex: #RRGGBB)').setStyle(TextInputStyle.Short).setValue(theme.embed_color || '#2b2d31').setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('theme_banner_url').setLabel('URL do Banner Principal (Opcional)').setStyle(TextInputStyle.Short).setValue(theme.main_panel_banner_url || '').setRequired(false)
            )
        );
}

// Menu de seleção para escolher um tema (para editar, deletar ou ativar)
function createThemeSelectionMenu(themes, customId, placeholder) {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(placeholder);
        
    const menu = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder('Selecione um tema...')
        .addOptions(
            themes.map(theme => ({
                label: theme.name,
                description: `Apelido: ${theme.bot_nickname || 'Nenhum'}`,
                value: theme.id.toString(),
            }))
        );

    const row = new ActionRowBuilder().addComponents(menu);
    const backRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cancel_action').setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
    );
    return { embeds: [embed], components: [row, backRow] };
}

// Confirmação antes de deletar um tema
function createDeleteConfirmation(theme) {
    const embed = new EmbedBuilder()
        .setColor(0xED4245) // Vermelho
        .setTitle('Confirmação de Exclusão')
        .setDescription(`Você tem certeza que deseja deletar o tema **${theme.name}**?\n\n**Esta ação é irreversível.**`);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`theme_delete_confirm_${theme.id}`)
            .setLabel('Sim, deletar')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('cancel_action')
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [row] };
}

module.exports = {
    createThemesDashboard,
    createThemeModal,
    createPasswordModal,
    enterPasswordModal,
    createEditThemeModal,
    createThemeSelectionMenu,
    createDeleteConfirmation,
};
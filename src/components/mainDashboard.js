const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

// Função que cria o Painel Principal
function createMainDashboard() {
    const embed = new EmbedBuilder()
        .setColor(0x2b2d31) // Cor padrão elegante
        .setTitle('Painel de Controle Principal | PoliceFlow V2')
        .setDescription('Bem-vindo ao centro de comando. Selecione um módulo abaixo para iniciar a configuração.')
        // .setImage('URL_DO_BANNER_PRINCIPAL_AQUI') // Futuramente virá do DB
        .setFooter({ text: 'PoliceFlow V2 - Sistema de Gestão de Elite' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('open_modules_menu')
                .setLabel('Módulos')
                .setEmoji('⚙️')
                .setStyle(ButtonStyle.Secondary),
            // BOTÃO ADICIONADO AQUI
            new ButtonBuilder()
                .setCustomId('set_garrison_theme')
                .setLabel('Definir Guarnição')
                .setEmoji('🎨')
                .setStyle(ButtonStyle.Primary)
        );

    return { embeds: [embed], components: [row] };
}

// Função que cria o Menu de Módulos (sem alterações)
function createModulesMenu() {
    const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('Seleção de Módulos')
        .setDescription('Escolha qual módulo você deseja configurar. As alterações são salvas automaticamente.');

    const menuRow = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_module')
                .setPlaceholder('Nenhum módulo selecionado')
                .addOptions(
                    { label: 'Configurações Gerais', description: 'Configure temas, cores e a identidade do bot.', value: 'module_general', emoji: '🎨' },
                    { label: 'Alistamento', description: 'Gerencie o sistema de recrutamento de novos oficiais.', value: 'module_enrollment', emoji: '📝' },
                    { label: 'Fardamentos', description: 'Crie e organize os kits de fardas da facção.', value: 'module_uniforms', emoji: '🥋' },
                    { label: 'Promoções (Upamento)', description: 'Configure o fluxo de solicitação de promoções.', value: 'module_promotions', emoji: '📈' }
                )
        );

    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('back_to_main_dashboard')
                .setLabel('Voltar')
                .setEmoji('⬅️')
                .setStyle(ButtonStyle.Secondary)
        );

    return { embeds: [embed], components: [menuRow, actionRow] };
}

module.exports = { createMainDashboard, createModulesMenu };
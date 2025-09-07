const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createMainDashboard } = require('../components/mainDashboard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel_config')
        .setDescription('Abre o painel de configurações principal do PoliceFlow.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Restrito a administradores
    async execute(interaction) {
        // Verifica se o comando foi usado em um servidor
        if (!interaction.inGuild()) {
            await interaction.reply({ content: 'Este comando só pode ser usado em um servidor.', ephemeral: true });
            return;
        }

        const dashboard = createMainDashboard();

        await interaction.reply({
            embeds: dashboard.embeds,
            components: dashboard.components,
            ephemeral: true // Apenas quem usou o comando pode ver
        });
    },
};
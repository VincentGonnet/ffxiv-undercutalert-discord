const { SlashCommandBuilder } = require('discord.js');
import{ Client, ChatInputCommandInteraction } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Reply with a Pong !'),
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        // interaction.guild is the object representing the Guild in which the command was run
        await interaction.reply(`Pong !`);
    },
};
const { SlashCommandBuilder } = require('discord.js');
import{ Client, ChatInputCommandInteraction } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear the bot messages from the DM channel.'),
    async autocomplete(client: Client, interaction: ChatInputCommandInteraction) {
            
    },
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        // Check if interaction is in PM
        if (interaction.guild === null) {
            // delete all messages from the bot
            const messages = await interaction.channel.messages.fetch();
            const botMessages = await messages.filter(message => message.author.id === client.user.id);
            botMessages.forEach(async message => {
                await message.delete();
            });
            await interaction.reply({content: "All messages from the bot have been deleted.", ephemeral: true});
            
        }
    },
};
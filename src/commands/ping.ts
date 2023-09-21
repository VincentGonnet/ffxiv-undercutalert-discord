import{ SlashCommandBuilder, Client, ChatInputCommandInteraction } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Reply with a Pong !'),
    async autocomplete(client: Client, interaction: ChatInputCommandInteraction) {
            
    },
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        // interaction.guild is the object representing the Guild in which the command was run
        await interaction.reply(`Pong !`);
    },
};
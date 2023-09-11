import { AutocompleteInteraction, ChatInputCommandInteraction, Client, Events, SlashCommandBuilder } from 'discord.js';

export default {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction: any) {
        if (!interaction.isChatInputCommand()) return;


        const client = interaction.client;
		const command: {data: SlashCommandBuilder, autocomplete: (client: Client, interaction: AutocompleteInteraction) => {}, execute: (client: Client, interaction: ChatInputCommandInteraction) => {}} = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(client, interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
	},
};
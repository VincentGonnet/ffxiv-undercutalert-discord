import { AutocompleteInteraction, ChatInputCommandInteraction, Client, Events, SlashCommandBuilder } from 'discord.js';

export default {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction: any) {
        if (!interaction.isAutocomplete()) return;


        const client = interaction.client;
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(client, interaction);
		} catch (error) {
			console.error(error);
		}
	},
};
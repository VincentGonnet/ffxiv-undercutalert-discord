import { ButtonInteraction, Client, Events } from 'discord.js';

export default {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction: any) {
        if (!interaction.isButton()) return;

        const client : Client = interaction.client as Client;

        const button : {name: string, execute: (client: Client, interaction: ButtonInteraction) => {}} = interaction.client.buttons.get(interaction.customId);
        if(!button) return;

        try {
            await button.execute(client, interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing the button script !', ephemeral: true});
        }
	},
};
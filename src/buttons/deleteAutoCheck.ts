import { ButtonInteraction, Client } from "discord.js";

export default {
    name: 'delete-auto-check',
    async execute(client: Client, interaction: ButtonInteraction) {
        await interaction.message.delete();
    },
}
const { SlashCommandBuilder } = require('discord.js');
import{ Client, ChatInputCommandInteraction, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } from 'discord.js';
import { Database } from "bun:sqlite";

export default {
    data: new SlashCommandBuilder()
        .setName('register-sale')
        .setDescription('Register a sale'),
    async autocomplete(client: Client, interaction: ChatInputCommandInteraction) {
        return;
    },
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const db: Database = client.db;
        const userId: string = interaction.user.id;

        const query = db.query(`SELECT homeworld FROM users WHERE id = $1`);
        let result  = await query.all({$1: userId});

        let prefWorld: string;

        if (result.length == 0) {
            // TODO: Modal to select homeworld
            const modal : ModalBuilder = new ModalBuilder()
                .setCustomId("homeworld")
                .setTitle("Select your homeworld");
          
            const selectedWorld: TextInputBuilder = new TextInputBuilder()
                .setCustomId("homeworldInput")
                .setLabel("Homeworld")
                .setPlaceholder("Cerberus")
                .setStyle(TextInputStyle.Short);

            const modalActionRow: any = new ActionRowBuilder()
                .addComponents(selectedWorld);

            modal.addComponents(modalActionRow);

            await interaction.showModal(modal);

            prefWorld = "Cerberus";
        } else {
            prefWorld = result[0]["homeworld"] as string;
        }      

        await interaction.followUp({content:`Your home world is ${prefWorld}`, ephemeral: true});
    }
};
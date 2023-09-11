const { SlashCommandBuilder } = require('discord.js');
import{ Client, ChatInputCommandInteraction, SlashCommandStringOption} from 'discord.js';
import { Database } from "bun:sqlite";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('preferences')
        .setDescription('Set your personal preferences.')
        .addStringOption((option: SlashCommandStringOption) => 
            option.setName('datacenter')
                .setDescription("Your character's datacenter.")
                .setRequired(true)
                .addChoices(
                    {name: "Aether", value: "Aether"},
                    {name: "Crystal", value: "Crystal"},
                    {name: "Dynamis", value: "Dynamis"},
                    {name: "Primal", value: "Primal"},
                    {name: "Chaos", value: "Chaos"},
                    {name: "Light", value: "Light"},
                    {name: "Materia", value: "Materia"},
                    {name: "Elemental", value: "Elemental"},
                    {name: "Gaia", value: "Gaia"},
                    {name: "Meteor", value: "Meteor"},
                    {name: "Mana", value: "Mana"}               
                )
            )
            .addStringOption((option: SlashCommandStringOption) => 
            option.setName('world')
                .setDescription("Your character's home world.")
                .setRequired(true)
                .setAutocomplete(true)
            ),
    async autocomplete(client: Client, interaction: ChatInputCommandInteraction) {
        return;
    },
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        // const homeWorld: string = interaction.options.getString('homeworld');
        // const db: Database = client.db;
        // const userId: string = interaction.user.id;    

        // // Insert or replace the user's homeworld
        // await db.run(`INSERT OR REPLACE INTO users (id, homeworld) VALUES (?, ?)`, [userId, homeWorld]);

        // await interaction.reply({content:`Your home world has been set as ${homeWorld}`, ephemeral: true});

    },
};
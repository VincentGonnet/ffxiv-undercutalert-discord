const { SlashCommandBuilder } = require('discord.js');
import{ Client, ChatInputCommandInteraction, SlashCommandStringOption, AutocompleteInteraction} from 'discord.js';
import { Database } from "bun:sqlite";
import { getWorldsByServer } from '../utils/worlds-getter.ts';

export default {
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
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('language')
                    .setDescription("Your preffered language for item names.")
                    .setRequired(true)
                    .addChoices(
                        {name: "English", value: "en"},
                        {name: "Japanese", value: "ja"},
                        {name: "German", value: "de"},
                        {name: "French", value: "fr"}
                    )
            ),
    async autocomplete(client: Client, interaction: AutocompleteInteraction) {
        const focusedOption = interaction.options.getFocused(true);
		let choices: string[];

		if (focusedOption.name === 'world') {
            let datacenter = interaction.options.getString('datacenter');
			choices = await getWorldsByServer(datacenter);
		}

		const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
    },
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const datacenter: string = interaction.options.getString('datacenter');
        const world: string = interaction.options.getString('world');
        const language: string = interaction.options.getString('language');

        const worldList: string[] = await getWorldsByServer(datacenter);
        if (!worldList.includes(world)) {
            await interaction.reply({content: `The world ${world} doesn't exist in the datacenter ${datacenter}.`, ephemeral: true});
            return;
        }

        const db: Database = client.db;
        const userId: string = interaction.user.id;    

        await db.run(`INSERT INTO users (id, datacenter, homeworld, language) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET datacenter = ?, homeworld = ?, language = ?`, [userId, datacenter, world, language, datacenter, world, language]);
        await interaction.reply({content: `Your preferences have been set to ${datacenter} - ${world}, with language : ${language}.`, ephemeral: true});

    },
};
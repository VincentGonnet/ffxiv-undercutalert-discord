const { SlashCommandBuilder } = require('discord.js');
import{ Client, ChatInputCommandInteraction, SlashCommandStringOption, AutocompleteInteraction } from 'discord.js';
import { Database } from "bun:sqlite";

export default {
    data: new SlashCommandBuilder()
        .setName('register-sale')
        .setDescription('Register a sale')
        .addStringOption((option: SlashCommandStringOption) =>
            option
                .setName('item')
                .setDescription('The item you want to register, in your preffered language.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption((option: SlashCommandStringOption) =>
            option
                .setName('retainer')
                .setDescription('The retainer you want to register the sale to.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption((option: SlashCommandStringOption) =>
            option
                .setName('automatic-checks')
                .setDescription('Whether or not you want to automatically check for sales on this item.')
                .setRequired(true)
                .addChoices(
                    {name: "Yes", value: "yes"},
                    {name: "No", value: "no"}
                )
        ),
    async autocomplete(client: Client, interaction: AutocompleteInteraction) {
        const focusedOption = interaction.options.getFocused(true);
		const db: Database = client.db;
        const userId: string = interaction.user.id;

        // TODO : handle case where user has no retainers or no preferences

		if (focusedOption.name === 'retainer') {
            let result : any = await db.query(`SELECT name FROM retainers WHERE user_id = $1`).all({$1: userId});

            const filtered = result.filter(retainer => retainer.name.startsWith(focusedOption.value));
            await interaction.respond(
                filtered.map(retainer => ({ name: retainer.name, value: retainer.name })),
            );
		}

        if (focusedOption.name === 'item') {
            const response = await fetch(`https://xivapi.com/search?string=${focusedOption.value.replaceAll(" ", "%20")}&indexes=item&language=fr&&limit=20&string_algo=wildcard`);
            let jsonResponse = await response.json(); 

            if (jsonResponse.Results.length === 0) return;

            const filtered = jsonResponse.Results.filter(item => item.Name);
            await interaction.respond(
                filtered.map(item => ({ name: item.Name, value: item.ID.toString() })),
            );

        }
    },
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const db: Database = client.db;
        const userId: string = interaction.user.id;

        let query = db.query(`SELECT datacenter, homeworld, language FROM users WHERE id = $1`);
        let result : any = await query.all({$1: userId});
        query.finalize();

        if (result.length === 0) {
            interaction.reply({content: `You need to set your preferences first.\nUse \`/preferences\` to do so.`, ephemeral: true});
            return;
        }

        const userInfos : {datacenter: string, homeworld: string, language: string} = result[0];
        const datacenter : string = userInfos.datacenter;
        const homeworld : string = userInfos.homeworld;
        const language : string = userInfos.language;

        query = db.query(`SELECT name FROM retainers WHERE user_id = $1`);
        result = await query.all({$1: userId});
        query.finalize();

        if (result.length === 0) {
            interaction.reply({content: `You need to add a retainer first.\nUse \`/retainers add\` to do so.`, ephemeral: true});
            return;
        }

        const retainerNames : string[] = result.map((retainer: {name: string}) => retainer.name);

        const itemId : string = interaction.options.getString('item');
        const retainer : string = interaction.options.getString('retainer');
        const automaticChecks : string = interaction.options.getString('automatic-checks');

        // Handle unknown retainer
        if (!retainerNames.includes(retainer)) {
            interaction.reply({content: `Please select a registered retainer`, ephemeral: true});
            return;
        }

        interaction.reply({content: `Retainer: ${retainer}, itemId: ${itemId}, auto: ${automaticChecks}`, ephemeral: true});
    }
};
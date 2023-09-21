import{ SlashCommandBuilder, Client, ChatInputCommandInteraction, SlashCommandStringOption, AutocompleteInteraction, EmbedBuilder } from 'discord.js';
import { Database } from "bun:sqlite";
import { setSaleTimeout } from '../utils/auto-check';
import { getItemName } from '../utils/get-item-name';
import { replyErrorEmbed } from '../utils/error-embed';

export default {
    data: new SlashCommandBuilder()
        .setName('register-sale')
        .setDescription('Register a sale.')
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

		if (focusedOption.name === 'retainer') {
            let result : any = await db.query(`SELECT name FROM retainers WHERE user_id = $1`).all({$1: userId});

            if (result.length === 0) {
                interaction.respond([{name: "No retainers found", value: "No retainers found"}]);
                return;
            }

            const filtered = result.filter(retainer => retainer.name.startsWith(focusedOption.value));
            await interaction.respond(
                filtered.map(retainer => ({ name: retainer.name, value: retainer.name })),
            );
		}

        if (focusedOption.name === 'item') {
            let result : any = await db.query(`SELECT language FROM users WHERE id = $1`).all({$1: userId});

            let language : string = "en";

            if (result.length != 0) {
                language = result[0].language;
            }

            const response = await fetch(`https://xivapi.com/search?string=${focusedOption.value.replaceAll(" ", "%20")}&indexes=item&language=${language}&&limit=20&string_algo=wildcard`);
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

        let result : any = await db.query(`SELECT datacenter, homeworld, language FROM users WHERE id = $1`).all({$1: userId});

        if (result.length === 0) {
            replyErrorEmbed(interaction, "Preferences are not set", "You need to set your preferences first.\nUse `/preferences` to do so.");
            return;
        }

        const userInfos : {datacenter: string, homeworld: string, language: string} = result[0];
        const datacenter : string = userInfos.datacenter;
        const homeworld : string = userInfos.homeworld;
        const language : string = userInfos.language;

        result = await db.query(`SELECT name FROM retainers WHERE user_id = $1`).all({$1: userId});

        if (result.length === 0) {
            replyErrorEmbed(interaction, "No retainers found", "You need to add a retainer first.\nUse `/retainers add` to do so.");
            return;
        }

        const retainerNames : string[] = result.map((retainer: {name: string}) => retainer.name);

        const itemId : string = interaction.options.getString('item');
        const retainer : string = interaction.options.getString('retainer');
        const automaticChecks : string = interaction.options.getString('automatic-checks');

        // Handle unknown retainer
        if (!retainerNames.includes(retainer)) {
            replyErrorEmbed(interaction, "Unknown retainer", "Please select a registered retainer.");
            return;
        }

        // Handle unknown item
        if (isNaN(parseInt(itemId))) {
            replyErrorEmbed(interaction, "Unknown item", "Please select a valid item in the autocomplete list.");
            return;
        }

        await db.query('INSERT INTO sales (user_id, retainer, item_id, automatic_checks) VALUES ($1, $2, $3, $4)')
            .run({$1: userId, $2: retainer, $3: parseInt(itemId), $4: (automaticChecks === "yes") ? 1 : 0});

        if (automaticChecks === "yes") {
            // Restart the interval for this user, with the newly added sale
            const userSales : any = db.query(`SELECT * FROM sales WHERE user_id = $1`).all({$1: userId});
            setSaleTimeout(userSales, client, userId);
        }

        const itemName : string = await getItemName(parseInt(itemId), language);

        let description : string = "Your sale has been registered successfully !\nUse `/check` to start a sale check.";
        description += automaticChecks === "yes" ? "\nYou will be notified if you get undercut, or if your retainer sell this item.\nYou can list your sales with `/list`, and remove them with `/remove-sale`." : "\nYou can list your sales with `/list`, and remove them with `/remove-sale`.";

        const embed = new EmbedBuilder()
            .setTitle(`Sale registered`)
            .setDescription(description)
            .setColor('#76b054')
            .addFields({name: "Item", value: itemName, inline: true}, {name: "Retainer", value: retainer, inline: true});

        interaction.reply({embeds: [embed], ephemeral: false});
    }
};
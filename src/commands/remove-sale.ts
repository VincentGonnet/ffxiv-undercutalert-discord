import { AutocompleteInteraction, EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import{ Client, ChatInputCommandInteraction } from 'discord.js';
import { getItemName } from '../utils/get-item-name';
import Database from 'bun:sqlite';
import { setSaleTimeout } from '../utils/auto-check';
import { replyErrorEmbed } from '../utils/error-embed';

export default {
    data: new SlashCommandBuilder()
        .setName('remove-sale')
        .setDescription('Remove a registered sale.')
        .addStringOption((option: SlashCommandStringOption) =>
            option
                .setName('item')
                .setDescription('The item you want to remove.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption((option: SlashCommandStringOption) =>
            option
                .setName('retainer')
                .setDescription('The retainer you want to remove the sale from.')
                .setRequired(false)
                .setAutocomplete(true)
        ),
    async autocomplete(client: Client, interaction: AutocompleteInteraction) {
        const db: Database = client.db;
        const userId: string = interaction.user.id;

        const focusedOption = interaction.options.getFocused(true);        

        if (focusedOption.name === 'item') {
            const sales : any = db.query(`SELECT * FROM sales WHERE user_id = $1`).all({$1: userId});
            const preferences : any = db.query(`SELECT * FROM users WHERE id = $1`).all({$1: userId});   

            if (sales.length === 0) {
                await interaction.respond([{name: "No registered sales", value: "No registered sales"}]);
                return;
            }

            let language : string = "en";
            if (preferences.length != 0) language = preferences[0].language;

            interface TranslatedSale {
                itemId: number,
                itemName: string
            }

            // transform sales into an array of item names
            const salesString : TranslatedSale[] = await Promise.all(sales.map(async sale => {
                const itemName = await getItemName(sale.item_id, language);
                return {itemId: sale.item_id, itemName: itemName};
            }));

            // filter items by name
            const filtered = salesString.filter(item => item.itemName.startsWith(focusedOption.value));
            await interaction.respond(
                filtered.map(item => ({ name: item.itemName, value: item.itemId.toString() })),
            );
        } else if (focusedOption.name === 'retainer') {
            const sales : any = db.query(`SELECT * FROM sales WHERE user_id = $1`).all({$1: userId});
            // get all retainers from sales
            let retainers : string[] = sales.map(sale => sale.retainer);
            retainers = retainers.filter((retainer, index) => retainers.indexOf(retainer) === index);
            const filtered = retainers.filter(retainer => retainer.startsWith(focusedOption.value));
            await interaction.respond(
                filtered.map(retainer => ({ name: retainer, value: retainer })),
            );
        }
    },
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const db : Database = client.db;
        const userId : string = interaction.user.id;
        const itemId : string = interaction.options.getString("item");

        // Handle unknown item
        if (isNaN(parseInt(itemId))) {
            replyErrorEmbed(interaction, "Unknown item", "Please select a valid item in the autocomplete list.");
            return;
        }

        // Handle unknown sale
        const sales : any = db.query(`SELECT * FROM sales WHERE user_id = $1 AND item_id = $2`).all({$1: userId, $2: parseInt(itemId)});
        if (!sales) {
            replyErrorEmbed(interaction, "Unknown sale", "Please select a valid sale in the autocomplete list.");
            return;
        }

        let retainers : string[] = sales.map(sale => sale.retainer);
        retainers = retainers.filter((retainer, index) => retainers.indexOf(retainer) === index); // remove duplicates
        let retainerString : string = "";
        if (sales.length > 1 && retainers.length > 1) { // If multiple sales for the same item, and multiple retainers for this item
            const retainer : string = interaction.options.getString("retainer");
            if (!retainer) {
                replyErrorEmbed(interaction, "Multiple item ", "Please try this command again with the retainer name.");
                return;
            }

            // Check if retainer is valid
            if (!retainers.includes(retainer)) {
                replyErrorEmbed(interaction, "Unknown retainer", "Please select a valid retainer in the autocomplete list.");
                return;
            }

            db.query(`DELETE FROM sales WHERE rowid in (SELECT rowid FROM sales WHERE user_id = $1 AND item_id = $2 AND retainer = $3 LIMIT 1)`).run({$1: userId, $2: parseInt(itemId), $3: retainer});
            retainerString = retainer;

        } else {
            retainerString = sales[0].retainer;
            db.query(`DELETE FROM sales WHERE rowid in (SELECT rowid FROM sales WHERE user_id = $1 AND item_id = $2 LIMIT 1)`).run({$1: userId, $2: parseInt(itemId)});
        }       

        // Restart the interval for this user, to stop checking the now sold item
        const userSales : any = db.query(`SELECT * FROM sales WHERE user_id = $1`).all({$1: userId});
        setSaleTimeout(userSales, client, userId);

        const preferences : any = db.query(`SELECT * FROM users WHERE id = $1`).all({$1: userId});
        let language : string = "en";
        if (preferences.length != 0) language = preferences[0].language;

        const itemName : string = await getItemName(parseInt(itemId), language);

        const embed : EmbedBuilder = new EmbedBuilder()
            .setTitle("Sale removed")
            .setDescription("Your sale has been removed successfully !\nYou can list your sales with `/list`\nYou can add a new sale with `/register-sale`")
            .setColor("#dd4138")
            .addFields({name: "Item", value: itemName, inline: true}, {name: "Retainer", value: retainerString, inline: true});

        interaction.reply({embeds: [embed], ephemeral: false});
    },
};
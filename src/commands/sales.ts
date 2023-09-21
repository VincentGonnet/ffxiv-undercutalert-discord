import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import{ Client, ChatInputCommandInteraction } from 'discord.js';
import { getItemName } from '../utils/get-item-name';
import { Sale } from '../@types/sales';

export default {
    data: new SlashCommandBuilder()
        .setName('sales')
        .setDescription('List your registered sales.'),
    async autocomplete(client: Client, interaction: ChatInputCommandInteraction) {
            
    },
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const userId = interaction.user.id;
        const db = client.db;

        const sales = await db.query(`SELECT * FROM sales WHERE user_id = $1`).all({$1: userId});

        if (sales.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`No registered sales !`)
                .setDescription("You have no registered sales.\nYou can register a sale with `/register-sale`.")
                .setColor(0x00FF00);
            await interaction.reply({embeds: [embed], ephemeral: true});
            return;
        }

        // get language from user preferences
        const preferences : any = await db.query(`SELECT language FROM users WHERE id = $1`).all({$1: userId});
        let language : string = "en";
        if (preferences.length != 0) {
            language = preferences[0].language;
        }

        const salesByRetainer : Sale[][] = [];
        // filter sales by retainer
        for (const sale of sales) {
            const retainer : string = sale.retainer;
            const retainerSales : Sale[] = salesByRetainer.find(sales => sales[0].retainer === retainer);

            // If retainerSales exist, push the new sale to it, else create it.
            if (retainerSales) {
                retainerSales.push(sale);
            } else {
                salesByRetainer.push([sale]);
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`Registered sales for ${interaction.user.username}`)
            .setColor("#e98640");
            // .setFooter({text: "Items with automatic checks are preceded by a blue dot"});

        for (const retainerSales of salesByRetainer) {
            const retainer = retainerSales[0].retainer;
            const retainerSalesString = await Promise.all(retainerSales.map(async sale => {
                const itemName = await getItemName(sale.item_id, language);
                return `${sale.automatic_checks == 0 ? "🔸" : "🔹"}${itemName}`;
            }));
            embed.addFields({name: retainer, value: retainerSalesString.join('\n')});
        }

        await interaction.reply({embeds: [embed], ephemeral: false});
    },
};
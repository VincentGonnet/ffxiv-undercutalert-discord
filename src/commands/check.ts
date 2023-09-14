import Database from 'bun:sqlite';
import{ Client, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('check')
        .setDescription('Verify if you got undercut for one of your registered items.'),
    async autocomplete(client: Client, interaction: ChatInputCommandInteraction) {
            
    },
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const db: Database = client.db;
        const userId: string = interaction.user.id;

        const sales : any = await db.query(`SELECT * FROM sales WHERE user_id = $1`).all({$1: userId});
        const preferences : any = await db.query(`SELECT * FROM users WHERE id = $1`).all({$1: userId});

        if (sales.length === 0) {
            await interaction.reply({content: "You don't have any registered sales.", ephemeral: true});
            return;
        }

        const homeServer = preferences[0].datacenter;
        const homeWorld = preferences[0].homeworld;
        const language = preferences[0].language;

        const undercuts = [];
        let solds = [];

        const treatedListings = [];
        for (const sale of sales) {
            const itemId : number = sale.item_id;
            const retainerName : string = sale.retainer;

            const apiMarketResponse : any = await fetch(`https://universalis.app/api/v2/${homeWorld}/${itemId}`);
            const jsonMarketResponse : any = await apiMarketResponse.json();

            const listings : any = jsonMarketResponse.listings;

            let bought : boolean = true;
            for (const listing of listings) {
                if (listing.retainerName === retainerName && !treatedListings.includes(listing.listingID)) {
                    treatedListings.push(listing.listingID);
                    bought = false;
                    break;
                }
            }

            if (bought) {
                solds.push(itemId);
            } else if (listings.length > 0 && listings[0].retainerName != retainerName) {
                undercuts.push(itemId);
            }
        }

        const soldsItems = []
        for (const sold of solds) {
            const apiItemResponse : any = await fetch(`https://xivapi.com/item/${sold}`);
            const jsonItemResponse : any = await apiItemResponse.json();

            switch (language) {
                case 'fr':
                    soldsItems.push(jsonItemResponse.Name_fr);
                    break;
                case 'de':
                    soldsItems.push(jsonItemResponse.Name_de);
                    break;
                case 'ja':
                    soldsItems.push(jsonItemResponse.Name_ja);
                    break;
                default:
                    soldsItems.push(jsonItemResponse.Name);
                    break;
            }
            await db.query(`DELETE FROM sales WHERE rowid in (SELECT rowid FROM sales WHERE user_id = $1 AND item_id = $2 LIMIT 1)`).run({$1: userId, $2: sold});
        }

        const items = [];
        for (const undercut of undercuts) {
            const apiItemResponse : any = await fetch(`https://xivapi.com/item/${undercut}`);
            const jsonItemResponse : any = await apiItemResponse.json();

            switch (language) {
                case 'fr':
                    items.push(jsonItemResponse.Name_fr);
                    break;
                case 'de':
                    items.push(jsonItemResponse.Name_de);
                    break;
                case 'ja':
                    items.push(jsonItemResponse.Name_ja);
                    break;
                default:
                    items.push(jsonItemResponse.Name);
                    break;
            }
        }
        
        const responseEmbed = new EmbedBuilder()
            .setTitle('Undercut checkup')
            .setFooter({text: `🛎️ ${homeServer} - ${homeWorld}`})
            .setColor('#e98640');
        
        if (undercuts.length > 0) {
            const itemsList = items.join('\n▫️');
            responseEmbed.addFields({name: 'You got undercut for the following sales', value: `▫️${itemsList}`});
        } else {
            responseEmbed.addFields({name: 'You didn\'t get undercut for any of your sales', value: '🎉'});
        }

        if (solds.length > 0) {
            const soldsList = soldsItems.join('\n▫️');
            responseEmbed.addFields({name: 'The following items have been sold', value: `▫️${soldsList}`});
        }

        await interaction.reply({embeds: [responseEmbed], ephemeral: true});
    },
};
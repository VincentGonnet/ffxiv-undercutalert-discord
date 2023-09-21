import Database from "bun:sqlite";
import { Client, EmbedBuilder } from "discord.js";
import { setSaleTimeout } from "./auto-check";

export async function checkSales(client: Client, db: Database, sales: any, homeServer: string, homeWorld: string, language: string, userId: string, autoCheck: boolean = false) {
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
        } else if (listings.length > 0 && listings[0].retainerName == retainerName && client.treatedSalesIds.includes(listings[0].listingID)) {
            // remove from treated sales
            client.treatedSalesIds.splice(client.treatedSalesIds.indexOf(listings[0].listingID), 1);
        } else if (listings.length > 0 && listings[0].retainerName != retainerName && !(autoCheck && client.treatedSalesIds.includes(listings[0].listingID))) {
            undercuts.push(itemId);
            if (autoCheck) {
                client.treatedSalesIds.push(listings[0].listingID);
            }
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
        
        // Restart the interval for this user, to stop checking the now sold item
        const userSales : any = db.query(`SELECT * FROM sales WHERE user_id = $1`).all({$1: userId});
        setSaleTimeout(userSales, client, userId);
    }

    const items = [];
    for (const undercut of undercuts) {        
        client.treatedSalesIds.push(undercut.listingID);
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
    } else if (!autoCheck) { // if autocheck, no need to put a field if no undercuts
        responseEmbed.addFields({name: 'You didn\'t get undercut for any of your sales', value: '🎉'});
    }

    if (solds.length > 0) {
        const soldsList = soldsItems.join('\n▫️');
        responseEmbed.addFields({name: 'The following items have been sold / is not found', value: `▫️${soldsList}`});
    }

    return (responseEmbed.data != null && responseEmbed.data.fields != null && responseEmbed.data.fields.length > 0) ? responseEmbed : null; // return null if no fields
}
import Database from "bun:sqlite";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client } from "discord.js";
import { checkSales } from "./check-sales";

interface Sale {
    user_id: string,
    retainer: string,
    item_id: number,
    automatic_checks: number
}

export async function setSaleTimeout(userSales : Sale[], client : Client) {
    const db : Database = client.db;
    const userId : string = userSales[0].user_id;

    // If an interval already exists for this user, clear it and delete it from the intervals collection
    if (client.intervals.has(userId)) {
        clearInterval(client.intervals.get(userId));
        client.intervals.delete(userId);
    }

    const preferences : any = await db.query(`SELECT * FROM users WHERE id = $1`).all({$1: userId});

    if (preferences.length === 0) return;

    const homeServer = preferences[0].datacenter;
    const homeWorld = preferences[0].homeworld;
    const language = preferences[0].language;

    client.intervals.set(userId, 
        (setInterval(async () => {
            const responseEmbed = await checkSales(client, db, userSales, homeServer, homeWorld, language, userId, true);

            if (responseEmbed.data.fields.length <= 1 && responseEmbed.data.fields[0].name == "You didn't get undercut for any of your sales") return;

            const deleteButton = new ButtonBuilder()
                .setCustomId('delete-auto-check')
                .setLabel('❌')
                .setStyle(ButtonStyle.Secondary);
            
            const row : any = new ActionRowBuilder().addComponents(deleteButton);

            const user = await client.users.fetch(userId);
            await user.send({embeds: [responseEmbed], components: [row]});
        }, 1*30*1000))
    );
}
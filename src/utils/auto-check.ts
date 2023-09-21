import Database from "bun:sqlite";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client } from "discord.js";
import { checkSales } from "./check-sales";
import { Sale } from "../@types/sales";

export async function setSaleTimeout(userSales : Sale[], client : Client, userId : string) {
    const db : Database = client.db;
    
    // If an interval already exists for this user, clear it and delete it from the intervals collection
    if (client.intervals.has(userId)) {
        clearInterval(client.intervals.get(userId));
        client.intervals.delete(userId);
    }

    // If the user has no sales, return
    if (userSales.length === 0) return;

    const preferences : any = await db.query(`SELECT * FROM users WHERE id = $1`).all({$1: userId});

    if (preferences.length === 0) return;

    const homeServer = preferences[0].datacenter;
    const homeWorld = preferences[0].homeworld;
    const language = preferences[0].language;

    client.intervals.set(userId, 
        (setInterval(async () => {
            const responseEmbed = await checkSales(client, db, userSales, homeServer, homeWorld, language, userId, true);
            if (responseEmbed == null) return;

            const deleteButton = new ButtonBuilder()
                .setCustomId('delete-auto-check')
                .setLabel('❌')
                .setStyle(ButtonStyle.Secondary);
            
            const row : any = new ActionRowBuilder().addComponents(deleteButton);

            const user = await client.users.fetch(userId);
            await user.send({embeds: [responseEmbed], components: [row]});
        }, 5*60*1000))
    );
}
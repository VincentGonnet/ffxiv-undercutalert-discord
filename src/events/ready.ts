import Database from 'bun:sqlite';
import { ActivityType, Client, Events } from 'discord.js';
import { checkSales } from '../utils/check-sales';

export default {
	name: Events.ClientReady,
	once: true,
	async execute(client: Client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		client.user.setPresence({
			status: 'online',
			activities: [{
				name: 'FFXIV Market Board',
				type: ActivityType.Watching
			}],
		});

		const db : Database = client.db;
		const sales : any = db.query(`SELECT * FROM sales`).all();

		interface Sale {
			user_id: string,
			retainer: string,
			item_id: number,
			automatic_checks: number
		}

		if (sales.length === 0) return;

		const salesByUser : Sale[][] = [];

		for (const sale of sales) {
			const userId : string = sale.user_id;
			const userSales : Sale[] = salesByUser.find(sales => sales[0].user_id === userId);

			if (userSales) {
				userSales.push(sale);
			} else {
				salesByUser.push([sale]);
			}
		}

		for (const userSales of salesByUser) {
			const userId : string = userSales[0].user_id;
			const preferences : any = await db.query(`SELECT * FROM users WHERE id = $1`).all({$1: userId});

			if (preferences.length === 0) continue;

			const homeServer = preferences[0].datacenter;
			const homeWorld = preferences[0].homeworld;
			const language = preferences[0].language;

			const responseEmbed = await checkSales(db, userSales, homeServer, homeWorld, language, userId);

			const user = await client.users.fetch(userId);
			await user.send({embeds: [responseEmbed]});
		}
	},
};
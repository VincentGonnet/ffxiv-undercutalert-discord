import Database from 'bun:sqlite';
import { ActivityType, Client, Events } from 'discord.js';
import { setSaleTimeout } from '../utils/auto-check';
import { Sale } from '../@types/sales';

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

		if (sales.length === 0) return;

		const salesByUser : Sale[][] = [];

		for (const sale of sales) {
			const userId : string = sale.user_id;
			const userSales : Sale[] = salesByUser.find(sales => sales[0].user_id === userId);

			// If userSales exist, push the new sale to it, else create it.
			if (userSales) {
				userSales.push(sale);
			} else {
				salesByUser.push([sale]);
			}
		}

		for (const userSales of salesByUser) {
			// For each user, set sales timeouts
			setSaleTimeout(userSales, client);

			await new Promise(resolve => setTimeout(resolve, 1000)); // one sec delay between each user, to avoid spamming the API
		}
	},
};
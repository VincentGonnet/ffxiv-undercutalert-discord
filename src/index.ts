// Require the necessary discord.js classes
import fs from 'node:fs';
import path from 'node:path';
import { Database } from "bun:sqlite";
import { Collection, Client, Events, GatewayIntentBits, ApplicationCommand, SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';

const token = Bun.env.DISCORD_TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const commandsPath = path.join(import.meta.dir, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => (file.endsWith('.js') || file.endsWith('.ts')));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	let command: any = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('default' in command) {
		command = command.default;
	}

	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const eventsPath = path.join(import.meta.dir, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event : any = require(filePath).default;
	if (event.once) {
		client.once(event.name, (...arg) => event.execute(...arg));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}


client.db = new Database('ffxiv.db', { create: true });
const query = client.db.query(`CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	datacenter TEXT,
	homeworld TEXT,
	language TEXT
)`);
await query.run();
await query.finalize();

// create a new 'retainers' table
// primary key is the user id linked to user table
// name is the name of the retainer
// automatic is a boolean to know if the user wants to automatically check for sales on this retainer

const query2 = client.db.query(`CREATE TABLE IF NOT EXISTS retainers (
	user_id TEXT,
	name TEXT,
	automatic INTEGER,
	FOREIGN KEY(user_id) REFERENCES users(id)
)`);
await query2.run();
await query2.finalize();

// create a new 'sales' table
// id is the user id linked to user table
// retainer is the name of the retainer
// item is the item being sold (id)

const query3 = client.db.query(`CREATE TABLE IF NOT EXISTS sales (
	user_id TEXT,
	retainer TEXT,
	item_id INTEGER,
	automatic_checks INTEGER,
	FOREIGN KEY(user_id) REFERENCES users(id),
	FOREIGN KEY(retainer) REFERENCES retainers(name)
)`);
await query3.run();
await query3.finalize();

client.login(token);
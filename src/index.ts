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
	homeworld TEXT
)`);
await query.run();

client.login(token);

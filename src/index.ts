// Require the necessary discord.js classes
import fs from 'node:fs';
import path from 'node:path';
import { Database } from "bun:sqlite";
import { Collection, Client, Events, GatewayIntentBits, ApplicationCommand, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

const token = Bun.env.DISCORD_TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready ! Logged in as ${c.user.tag}`);
});

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
		console.log(command);
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isAutocomplete()) {

		return;
	}

	if (!interaction.isChatInputCommand()) return;
	const command: {data: SlashCommandBuilder, execute: (client: Client, interaction: ChatInputCommandInteraction) => {}} = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(client, interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.db = new Database('ffxiv.db', { create: true });
const query = client.db.query(`CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	datacenter TEXT,
	homeworld TEXT
)`);
await query.run();

client.login(token);

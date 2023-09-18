import Database from 'bun:sqlite';
import{ Client, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { checkSales } from '../utils/check-sales';

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

        const responseEmbed = await checkSales(db, sales, homeServer, homeWorld, language, userId);

        await interaction.reply({embeds: [responseEmbed], ephemeral: true});
    },
};
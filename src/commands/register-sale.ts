const { SlashCommandBuilder } = require('discord.js');
import{ Client, ChatInputCommandInteraction, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } from 'discord.js';
import { Database } from "bun:sqlite";

export default {
    data: new SlashCommandBuilder()
        .setName('register-sale')
        .setDescription('Register a sale'),
    async autocomplete(client: Client, interaction: ChatInputCommandInteraction) {
        return;
    },
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const db: Database = client.db;
        const userId: string = interaction.user.id;

        const query = db.query(`SELECT datacenter, homeworld FROM users WHERE id = $1`);
        let result : any = await query.all({$1: userId});

        if (result.length === 0) {
            interaction.reply({content: `You need to set your preferences first.\nUse \`/preferences\` to do so.`, ephemeral: true});
            return;
        }

        const userInfos : {datacenter: string, homeworld: string} = result[0];

        interaction.reply({content: `Datacenter: ${userInfos.datacenter}, world: ${userInfos.homeworld}`, ephemeral: true});
    }
};
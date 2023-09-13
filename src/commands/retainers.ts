import{ Client, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption, AutocompleteInteraction } from 'discord.js';
import { Database } from "bun:sqlite";

export default {
    data: new SlashCommandBuilder()
        .setName('retainers')
        .setDescription('Register your retainers')
        .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
            subcommand
                .setName('add')
                .setDescription('Add a retainer')
                .addStringOption((option: SlashCommandStringOption) =>
                    option.setName('name')
                        .setDescription('The name of the retainer')
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
            subcommand
                .setName('remove')
                .setDescription('Remove a retainer')
                .addStringOption((option: SlashCommandStringOption) =>
                    option.setName('remove-name')
                        .setDescription('The name of the retainer')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
            subcommand
                .setName('list')
                .setDescription('List your retainers')
        ),
    async autocomplete(client: Client, interaction: AutocompleteInteraction) {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'remove-name') {
            const db: Database = client.db;
            const userId: string = interaction.user.id;

            const query = db.query(`SELECT name FROM retainers WHERE user_id = $1`);
            let result : any = await query.all({$1: userId});

            const filtered = result.filter(retainer => retainer.name.startsWith(focusedOption.value));
            await interaction.respond(
                filtered.map(retainer => ({ name: retainer.name, value: retainer.name })),
            );
        }
    },
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const db: Database = client.db;
        const userId: string = interaction.user.id;

        if (interaction.options.getSubcommand() === 'add') {
            const name: string = interaction.options.getString('name');

            const query = db.query(`INSERT INTO retainers (user_id, name) VALUES ($1, $2)`);
            await query.run({$1: userId, $2: name});

            await interaction.reply({content: `The retainer ${name} has been added.`, ephemeral: true});
            return;
        }

        if (interaction.options.getSubcommand() === 'remove') {
            const name: string = interaction.options.getString('remove-name');

            const query = db.query(`DELETE FROM retainers WHERE user_id = $1 AND name = $2`);
            await query.run({$1: userId, $2: name});

            await interaction.reply({content: `The retainer ${name} has been removed.`, ephemeral: true});
            return;
        }

        if (interaction.options.getSubcommand() === 'list') {
            const query = db.query(`SELECT name FROM retainers WHERE user_id = $1`);
            let result : any = await query.all({$1: userId});

            if (result.length === 0) {
                await interaction.reply({content: `You don't have any retainer registered.`, ephemeral: true});
                return;
            }

            let retainerList : string = '';
            for (const retainer of result) {
                retainerList += `${retainer.name}\n`;
            }

            await interaction.reply({content: `Your retainers are:\n${retainerList}`, ephemeral: true});
            return;
        }
    }
};
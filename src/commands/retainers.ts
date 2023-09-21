import{ Client, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption, AutocompleteInteraction, EmbedBuilder } from 'discord.js';
import { Database } from "bun:sqlite";
import { replyErrorEmbed } from '../utils/error-embed';

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

            let result : any = db.query(`SELECT name FROM retainers WHERE user_id = $1`).all({$1: userId});

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

            const embed = new EmbedBuilder()
                .setTitle(`Retainer added`)
                .setDescription("You successfully added the retainer " + name + ".")
                .setColor('#76b054');
            await interaction.reply({embeds: [embed], ephemeral: true});
            return;
        }

        if (interaction.options.getSubcommand() === 'remove') {
            const name: string = interaction.options.getString('remove-name');

            const query = db.query(`DELETE FROM retainers WHERE user_id = $1 AND name = $2`);
            query.run({$1: userId, $2: name});

            replyErrorEmbed(interaction, "Retainer removed", "The retainer " + name + " has been removed.");
            return;
        }

        if (interaction.options.getSubcommand() === 'list') {
            const query = db.query(`SELECT name FROM retainers WHERE user_id = $1`);
            let result : any = await query.all({$1: userId});

            if (result.length === 0) {
                replyErrorEmbed(interaction, "No retainers found", "You don't have any retainers registered.");
                return;
            }

            let retainerList : string = '';
            for (const retainer of result) {
                retainerList += `▫️${retainer.name}\n`;
            }

            const embed = new EmbedBuilder()
                .setTitle(`Retainer list`)
                .setDescription(`${retainerList}`)
                .setColor('#e98640');

            await interaction.reply({embeds: [embed], ephemeral: true});
            return;
        }
    }
};
import { EmbedBuilder } from "discord.js";

export function replyErrorEmbed(interaction: any, title: string, description: string) {
    interaction.reply(
        {embeds: [
                new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(description)
                    .setColor("#dd4138")
        ],ephemeral: true});
}
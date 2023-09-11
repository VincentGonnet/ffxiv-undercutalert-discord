import { Collection } from "discord.js";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, {data: SlashCommandBuilder, execute: (client: Client, interaction: ChatInputCommandInteraction) => {}}>;
  }
}

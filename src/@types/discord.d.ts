import { Collection } from "discord.js";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, {data: SlashCommandBuilder, autocomplete: (client: Client, interaction: AutocompleteInteraction) => {}, execute: (client: Client, interaction: ChatInputCommandInteraction) => {}}>;
    buttons: Collection<string, {data: MessageButton, execute: (client: Client, interaction: ButtonInteraction) => {}}>;
    db: Database;
    intervals: Collection<string, NodeJS.Timeout>;
    treatedSalesIds: string[]; 
  }
}

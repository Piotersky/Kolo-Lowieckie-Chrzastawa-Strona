const { EmbedBuilder, InteractionType } = require("discord.js");
const { readdirSync } = require("fs");

 module.exports = {
	name: 'interactionCreate',
	execute: async(interaction) => {
  let client = interaction.client;
   if (interaction.type == InteractionType.ApplicationCommand) {
   if(interaction.user.bot) return;

	readdirSync('./bot/commands').forEach(file => {
        const command = require(`../../bot/commands/${file}`);
        if(interaction.commandName.toLowerCase() === command.data.name.toLowerCase()) {
        command.run(client, interaction)
    }
	})
}
  }}

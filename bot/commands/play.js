const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song from YouTube or other sources")
    .addStringOption(option => 
      option.setName('query')
        .setDescription('The song or video to play')
        .setRequired(true)),
    run: async (client, interaction) => {
      interaction.reply(`Not implemented yet! Please provide a song or video query.`);
      
    }
 };

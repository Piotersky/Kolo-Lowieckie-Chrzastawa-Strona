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
      // interaction.reply(`Not implemented yet! Please provide a song or video query.`);
      if (!interaction.guild) return interaction.reply("This command can only be used in a server.");
      const query = interaction.options.getString('query');
      if (!query) return interaction.reply("Please provide a valid search query.");
      interaction.member.voice.channel
        ? interaction.reply(`Searching for: ${query}`)
        : interaction.reply("You need to be in a voice channel to use this command.");
    }
 };

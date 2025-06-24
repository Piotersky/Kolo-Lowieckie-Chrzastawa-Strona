const { Client, Collection, GatewayIntentBits } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const config = require("./strona/config.js");
const { readdirSync } = require("fs")
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

let token = config.token

client.commands = new Collection()

const rest = new REST({ version: '10', timeout: 15000 }).setToken(token);

//command-handler
const commands = [];
readdirSync('./bot/commands').forEach(async file => {
  const command = require(`./bot/commands/${file}`);
  commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command);
})

client.on("ready", async () => {
        try {
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );
        } catch (error) {
            console.error(error);
        }
    console.log(`Bot is online!`);
    require("./strona/server.js")(client);
})

//event-handler
readdirSync('./bot/events').forEach(async file => {
	const event = require(`./bot/events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
})
//

client.login(token)

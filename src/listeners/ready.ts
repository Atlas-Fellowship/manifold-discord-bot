import { Client } from "discord.js";
import { Command } from "../command";
import { registerGuildIfNotExists} from "../db/db";

export default (client: Client, commands: Command[]): void => {
  client.on("ready", async () => {
    if (!client.user || !client.application) {
      return;
    }

    console.log(`Logged in as ${client.user.tag} with ID ${client.user.id}!`);

    client.guilds.cache.forEach(async (guild) => {
      // register commands from passed array of Command
      await client.application?.commands.set(commands, guild.id);

      // register guild
      await registerGuildIfNotExists(guild.id);
    });

    client.user.setActivity("your E-Clips!", { type: "WATCHING" });
  });
};

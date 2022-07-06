import { Client } from "discord.js";
import { Command } from "../command";
import { registerGuildIfNotExists} from "../db/db";

export default (client: Client, commands: Command[]): void => {
  client.on("guildCreate", async (guild) => {
    // register commands from passed array of Command
    await client.application?.commands.set(commands, guild.id);

    // register guild
    await registerGuildIfNotExists(guild.id);
  });
};

import { CommandInteraction, Client, Role, MessageEmbed } from "discord.js";

import { Command } from "../command";
import {
  clearLogChannel,
  setLogChannel,
} from "../db/db";

import { errorMessage, confirmAdminPerms, confirmGuild } from "../utils/confirmPerms";

const Configure: Command = {
  name: "configure",
  description:
    "Moderators can add points to a user, role, or the entire server",
  type: "CHAT_INPUT",
  options: [
    {
      name: "log",
      description:
        'Configure the channel to output transaction logs to. No "channel" option will disable log output.',
      type: "SUB_COMMAND",
      options: [
        {
          name: "channel",
          description: "the channel to output transaction logs to",
          type: "CHANNEL",
          channelTypes: ["GUILD_TEXT"],
        }
      ]
    },
  ],
  execute: async (_client: Client, interaction: CommandInteraction) => {
    const action = "configure settings";

    const guildRet = await confirmGuild(interaction, action);
    if (!guildRet.success) {
      await interaction.reply({ embeds: [guildRet.reply] });
      return;
    }
    const adminRet = await confirmAdminPerms(interaction, action);
    if (!adminRet.success) {
      await interaction.reply({ embeds: [adminRet.reply] });
      return;
    }


    const guildId = guildRet.guild.id;

    if (interaction.options.getSubcommand() === "log") {
      const channel = interaction.options.getChannel("channel");

      if (!channel) {
        await clearLogChannel(guildId);

        const summary = new MessageEmbed()
          .setColor("#0B0056")
          .setTitle("Configuration Updated")
          .setDescription(
            "*No channel supplied.*\n\nLogging has been disabled."
          )
          .setFooter({
            text: "Atlas E-Clips",
            iconURL:
              "https://storage.googleapis.com/image-bucket-atlas-points-bot/logo.png"
          })
          .setTimestamp(new Date());

        await interaction.reply({ embeds: [summary] });
        return;
      }

      await setLogChannel(guildId, channel.id);

      const summary = new MessageEmbed()
        .setColor("#0B0056")
        .setTitle("Configuration Updated")
        .setDescription(`Logs will now be sent to <#${channel.id}>.`)
        .setFooter({
          text: "Atlas E-Clips",
          iconURL:
            "https://storage.googleapis.com/image-bucket-atlas-points-bot/logo.png"
        })
        .setTimestamp(new Date());

      await interaction.reply({ embeds: [summary] });
    }
  }
};

export default Configure;

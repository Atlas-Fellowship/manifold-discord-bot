import { CommandInteraction, Client, Role } from "discord.js";

import { Command } from "../command";
import { getLogChannel } from "../db/db";

import { errorMessage, confirmGuild, confirmAdminPerms } from "../utils/confirmPerms";
import incrementRolePoints from "../utils/incrementRolePoints";
import incrementSingleUserPoints from "../utils/incrementSingleUserPoints";

const Subtract: Command = {
  name: "subtract",
  description:
    "Moderators can subtract points from a user, role, or the entire server",
  type: "CHAT_INPUT",
  options: [
    {
      name: "amount",
      description: "the number of points to subtract",
      type: "INTEGER",
      minValue: 1,
      maxValue: 1024 ** 3,
      required: true
    },
    {
      name: "memo",
      description: "note to attach",
      type: "STRING",
      required: true,
    },
    {
      name: "user",
      description: "the user to target",
      type: "USER"
    },
    {
      name: "role",
      description: "the role to target",
      type: "ROLE"
    },

  ],
  execute: async (_client: Client, interaction: CommandInteraction) => {
    const amount = interaction.options.getInteger("amount");
    const user = interaction.options.getUser("user");
    const role = interaction.options.getRole("role") as Role | null;
    const memo = interaction.options.getString("memo") || "";

    // will never be reached because `required` is true in options[]
    // only for type safety
    if (!amount) {
      await interaction.reply({ embeds: [errorMessage("Must specify an amount")] });
      return;
    }

    const action ="subtract E-Clips directly";

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


    let reply;
    if (role === null) {
      const target = user ?? interaction.user;
      reply = await incrementSingleUserPoints(_client, target.tag, -amount, memo);
    } else if (user === null) {
      reply = await incrementRolePoints(_client, role, -amount, memo);
    } else {
      reply = errorMessage("Can't target a user and role at the same time");
    }


    // log to configured channel
    const logChannelId = await getLogChannel(guildRet.guild.id);
    if (logChannelId) {
      const logChannel = _client.channels.cache.get(logChannelId);
      if (logChannel && logChannel.isText()) {
        logChannel.send({ embeds: [reply] });
      }
    }

    await interaction.reply({ embeds: [reply] });
  }
};

export default Subtract;

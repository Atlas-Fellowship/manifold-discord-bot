import { CommandInteraction, Client, MessageEmbed } from "discord.js";
import { getManifoldUser } from "../db/db";

import { Command } from "../command";
import { confirmGuild, confirmPerms, errorMessage } from "../utils/confirmPerms";

const Balance: Command = {
  name: "balance",
  description: "View points for a user",
  type: "CHAT_INPUT",
  options: [
    {
      name: "user",
      description: "the user to target (admin only)",
      type: "USER"
    }
  ],
  execute: async (_client: Client, interaction: CommandInteraction) => {
    const specifiedUser = interaction.options.getUser("user");
    const interactionUser = interaction.user;

    let guildId;

    if (specifiedUser === null) {
      const confirmRet = await confirmGuild(interaction, "view your E-Clips");
      if (!confirmRet.success) {
        await interaction.reply({ embeds: [confirmRet.reply] });
        return;
      }
      guildId = confirmRet.guild.id;
    } else {
      // need to have perms to view someone else's eclips
      const confirmRet = await confirmPerms(interaction, "view another user's E-Clips");
      if (!confirmRet.success) {
        await interaction.reply({ embeds: [confirmRet.reply] });
        return;
      }
      guildId = confirmRet.guild.id;
    }

    const discordUser = specifiedUser || interactionUser;

    const manifoldUser = await getManifoldUser(discordUser.tag);

    let reply;

    if (manifoldUser === undefined) {
      reply = errorMessage(`Couldn't find corresponding Manifold user for: @${discordUser.tag}.`);
    } else {
      reply = new MessageEmbed()
        .setColor("#0B0056")
        .setTitle(`E-Clip summary for ${manifoldUser.name}`)
        .setThumbnail(manifoldUser.avatarUrl)
        .addFields(
          {
            name: "Total E-Clips",
            value: `${manifoldUser.balance}`,
            inline: true
          }
        )
        .setTimestamp(new Date());
    }

    await interaction.reply({ embeds: [reply] });
  }
};

export default Balance;

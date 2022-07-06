import { CommandInteraction, Client, MessageEmbed } from "discord.js";
import { getRankings } from "../db/db";

import { Command } from "../command";

import { errorMessage, confirmAdminPerms, confirmManifoldUser } from "../utils/confirmPerms";

const Leaderboard: Command = {
  name: "leaderboard",
  description: "Display rankings for the server",
  type: "CHAT_INPUT",
  execute: async (_client: Client, interaction: CommandInteraction) => {
    const confirmRet = await confirmAdminPerms(interaction, "view the leaderboard");
    if (!confirmRet.success) {
      await interaction.reply({ embeds: [confirmRet.reply] });
      return;
    }

    const users  = await getRankings();

    let list = users
      .slice(0, 10)
      .map(
        (user, index) =>
          `${index + 1}) ${user.name} (@${user.username})  — **${Math.round(user.balance)}** E-Clips`
      )
      .join("\n");

    if(users.length > 10) {
        list += `\n\n**Truncated - ${users.length - 10} more**`;
    }

    const guildSummary = new MessageEmbed()
      .setColor("#0B0056")
      .setTitle(`Leaderboard`)
      .setDescription(list)
      .setTimestamp(new Date())
      .setFooter({
        text: "Atlas E-Clips",
        iconURL:
          "https://storage.googleapis.com/image-bucket-atlas-points-bot/logo.png"
      });

    await interaction.reply({ embeds: [guildSummary] });
  }
};

export default Leaderboard;

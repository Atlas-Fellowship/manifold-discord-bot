import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { getUserPoints, subtractUserPoints } from "../db/db";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("subtract")
    .setDescription(
      "Moderators can subtract points from a user, role, or the entire server"
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("the number of points to subtract")
        .setMinValue(0)
        .setRequired(true)
    )
    .addUserOption((option) =>
      option.setName("user").setDescription("the user to target")
    )
    .addRoleOption((option) =>
      option.setName("role").setDescription("the role to target")
    ),
  async execute(interaction: CommandInteraction) {
    const amount = interaction.options.getInteger("amount");
    const user = interaction.options.getUser("user") || interaction.user;

    await subtractUserPoints(interaction.guildId!, user.id, amount!);

    const transactionSummary = new MessageEmbed()
      .setColor("#0B0056")
      .setTitle("Transaction Complete")
      .setAuthor({
        name: `${user.tag}`,
        iconURL: user.avatarURL()!
      })
      .setDescription(
        `${amount} point${amount === 1 ? `` : `s`} removed from <@${
          user.id
        }>'s total!`
      )
      .addFields({
        name: "Total Points",
        value: `${await getUserPoints(interaction.guildId!, user.id)}`,
        inline: true
      })
      .setTimestamp(new Date())
      .setFooter({
        text: "Atlas Points",
        iconURL:
          "https://storage.googleapis.com/image-bucket-atlas-points-bot/logo.png"
      });

    interaction.reply({ embeds: [transactionSummary] });
  }
};

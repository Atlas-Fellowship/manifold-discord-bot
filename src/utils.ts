import {
  BaseCommandInteraction,
  GuildMember,
  MessageEmbed,
  Role,
  User
} from "discord.js";

import {
  incrementUserPoints,
  getUserPoints,
  registerUserIfNotExists
} from "./db/db";

export async function displayErrorMessage(
  interaction: BaseCommandInteraction,
  description: string
) {
  const erorSummary = new MessageEmbed()
    .setColor("#0B0056")
    .setTitle("Error!")
    .setDescription(description)
    .setTimestamp(new Date())
    .setFooter({
      text: "Atlas Points",
      iconURL:
        "https://storage.googleapis.com/image-bucket-atlas-points-bot/logo.png"
    });

  await interaction.reply({ embeds: [erorSummary] });
}

export async function incrementSingleUserPoints(
  interaction: BaseCommandInteraction,
  user: User,
  amount: number
) {
  // first change the user's points
  await incrementUserPoints(interaction.guildId!, user.id, amount);

  const amountMagnitude = Math.abs(amount);
  const changePhrase = amount > 0 ? "added to" : "removed from";

  const transactionSummary = new MessageEmbed()
    .setColor("#0B0056")
    .setTitle("Transaction Complete")
    .setAuthor({
      name: `${user.tag}`,
      iconURL: user.avatarURL()!
    })
    .setDescription(
      `${amountMagnitude} point${
        amountMagnitude === 1 ? "" : "s"
      } ${changePhrase} <@${user.id}>'s total!`
    )
    .addFields({
      name: "New Balance",
      value: `${await getUserPoints(interaction.guildId!, user.id)}`,
      inline: true
    })
    .setTimestamp(new Date())
    .setFooter({
      text: "Atlas Points",
      iconURL:
        "https://storage.googleapis.com/image-bucket-atlas-points-bot/logo.png"
    });
  await interaction.reply({ embeds: [transactionSummary] });
}

// increment all users in role's points (can be negative!)
export async function incrementRolePoints(
  interaction: BaseCommandInteraction,
  role: Role,
  amount: number
) {
  for (const [, guildMember] of role.members) {
    // first change the user's points
    await incrementUserPoints(
      interaction.guildId!,
      guildMember.user.id,
      amount
    );
  }

  const amountMagnitude = Math.abs(amount);
  const changePhrase = amount > 0 ? "added to" : "removed from";

  const usernameList = [];
  for (const [, guildMember] of role.members) {
    usernameList.push(guildMember.user.tag);
  }

  const userListStr = usernameList.map((x, i) => `${i}) ${x}`).join("\n");

  const transactionSummary = new MessageEmbed()
    .setColor("#0B0056")
    .setTitle("Transaction Complete")
    .setDescription(
      `${amountMagnitude} point${
        amountMagnitude === 1 ? "" : "s"
      } ${changePhrase}:\n${userListStr}`
    )
    .setTimestamp(new Date())
    .setFooter({
      text: "Atlas Points",
      iconURL:
        "https://storage.googleapis.com/image-bucket-atlas-points-bot/logo.png"
    });

  await interaction.reply({ embeds: [transactionSummary] });
}
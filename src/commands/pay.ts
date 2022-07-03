import { CommandInteraction, Client, MessageEmbed } from "discord.js";

import { Command } from "../command";
import { getLogChannel, getUserPoints, givePoints } from "../db/db";

import { errorMessage, confirmGuild } from "../utils/displayErrorMessage.util";

const Pay: Command = {
  name: "pay",
  description: "transfer points to another user",
  type: "CHAT_INPUT",
  options: [
    {
      name: "amount",
      description: "the number of E-Clips to pay",
      type: "INTEGER",
      required: true,
      minValue: 1
    },
    {
      name: "recipient",
      description: "the user to pay E-Clips to",
      type: "USER",
      required: true
    },
    {
      name: "memo",
      description: "note to attach alongside payment",
      type: "STRING",
    }
  ],
  execute: async (_client: Client, interaction: CommandInteraction) => {
    const amount = interaction.options.getInteger("amount");
    const donor = interaction.user;
    const recipient = interaction.options.getUser("recipient");
    const memo = interaction.options.getString("memo") || "";

    const confirmRet = await confirmGuild(interaction, "pay E-Clips");
    if (!confirmRet.success) {
      await interaction.reply({ embeds: [confirmRet.reply] });
      return;
    }
    const guild = confirmRet.guild;

    if (amount === null) {
      await interaction.reply({ embeds: [errorMessage("Must specify an amount")] });
      return;
    }


    if (recipient === null) {
      await interaction.reply({ embeds: [errorMessage("Must specify a recipient")] });
      return;
    }

    if (recipient.id === donor.id) {
      await interaction.reply({ embeds: [errorMessage("Cannot pay yourself")] });
      return;
    }

    const roles = await guild.roles.fetch();
    const members = await guild.members.fetch();

    const cohortTags = [
      "June 12-23",
      "July 3-14",
      "July 17-28",
      "August 14-25"
    ];

    // check if both recipient has same time tag as

    // get tag of donor
    let cohortRoleId: null | string = null;
    for (const [, guildMember] of members) {
      if (guildMember.user.id === donor.id) {
        for (const [, role] of guildMember.roles.cache) {
          if (cohortTags.includes(role.name)) {
            cohortRoleId = role.id;
            break;
          }
        }
      }
    }

    // check if recipient has same tag
    let permitted = false;
    if (cohortRoleId !== null) {
      for (const [, guildMember] of members) {
        if (guildMember.user.id === recipient.id) {
          for (const [id] of guildMember.roles.cache) {
            if (id === cohortRoleId) {
              permitted = true;
              break;
            }
          }
        }
      }
    }

    if (!permitted) {
      await interaction.reply({ embeds: [errorMessage("You can only pay E-Clips to people in your cohort!")] });
      return;
    }

    const amountPaid = await givePoints(
      guild.id,
      donor.id,
      recipient.id,
      amount,
    );

    const donorPoints = await getUserPoints(guild.id, donor.id);
    const recipientPoints = await getUserPoints(
      guild.id,
      recipient.id
    );

    const memoString = memo === "" ? "" : `\n\nMemo: **${memo}**`;

    const transactionSummary = new MessageEmbed()
      .setColor("#0B0056")
      .setTitle("Transaction Complete")
      .setAuthor({
        name: `${donor.tag}`,
        iconURL: donor.avatarURL() || donor.defaultAvatarURL
      })
      .setDescription(
        `<@${donor.id}> gave **${amountPaid}** E-Clip${amountPaid === 1 ? "" : "s"
        } to <@${recipient.id
        }>${memoString}`
      )
      .addFields(
        {
          name: `${donor.username}'s New Balance`,
          value: `${donorPoints}`,
          inline: true
        },
        {
          name: `${recipient.username}'s New Balance`,
          value: `${recipientPoints}`,
          inline: true
        }
      )
      .setTimestamp(new Date())
      .setFooter({
        text: "Atlas E-Clips",
        iconURL:
          "https://storage.googleapis.com/image-bucket-atlas-points-bot/logo.png"
      });

    // log to configured channel
    const logChannelId = await getLogChannel(confirmRet.guild.id);
    if (logChannelId) {
      const logChannel = _client.channels.cache.get(logChannelId);
      if (logChannel && logChannel.isText()) {
        logChannel.send({ embeds: [transactionSummary] });
      }
    }


    interaction.reply({ embeds: [transactionSummary] });
  }
};

export default Pay;
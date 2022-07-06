import { CommandInteraction, Client, MessageEmbed } from "discord.js";

import { Command } from "../command";
import { getLogChannel, getManifoldUser, pay } from "../db/db";

import { errorMessage, confirmGuild, confirmManifoldUser } from "../utils/confirmPerms";

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
      required: true,
    }
  ],
  execute: async (_client: Client, interaction: CommandInteraction) => {
    const amount = interaction.options.getInteger("amount");
    const donor = interaction.user;
    const recipient = interaction.options.getUser("recipient");
    const memo = interaction.options.getString("memo") || "";

    const action = "pay E-Clips";

    const guildRet = await confirmGuild(interaction, action);
    if (!guildRet.success) {
      await interaction.reply({ embeds: [guildRet.reply] });
      return;
    }
    const guildId = guildRet.guild.id;

    const manifoldRet = await confirmManifoldUser(interaction);
    if (!manifoldRet.success) {
      await interaction.reply({ embeds: [manifoldRet.reply] });
      return;
    }
    const manifoldDonor = manifoldRet.user;

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

    // check if both recipient has same time tag as
    const manifoldRecipient = await getManifoldUser(recipient.tag);
    if (!manifoldRecipient) {
      const reply = errorMessage(`Couldn't find a linked Manifold account for (${interaction.user.tag}).`);
      await interaction.reply({ embeds: [reply] });
      return;
    }

    const amountPaid = await pay(
      manifoldDonor.id,
      manifoldRecipient.id,
      amount,
    );

    const donorPoints = manifoldDonor.balance - amountPaid;
    const recipientPoints = manifoldRecipient.balance + amountPaid;

    const memoString = memo === "" ? "" : `\n\nMemo: **${memo}**`;

    const transactionSummary = new MessageEmbed()
      .setColor("#0B0056")
      .setTitle("Transaction Complete")
      .setAuthor({
      name: manifoldDonor.name,
      iconURL: manifoldDonor.avatarUrl
      })
      .setDescription(
        `${manifoldDonor.name} (@${manifoldDonor.username}) gave **${amountPaid}** E-Clip${amountPaid === 1 ? "" : "s"
        } to ${manifoldRecipient.name} (@${manifoldRecipient.username})${memoString}`
      )
      .addFields(
        {
          name: `${manifoldDonor.name}'s New Balance`,
          value: `${donorPoints}`,
          inline: true
        },
        {
          name: `${manifoldRecipient.name}'s New Balance`,
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
    const logChannelId = await getLogChannel(guildId);
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

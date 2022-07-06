import { CommandInteraction, User, MessageEmbed, Client } from "discord.js";
import { getManifoldUser, incrementUserBalance, ManifoldUser } from "../db/db";
import { errorMessage } from "./confirmPerms";

export default async function incrementSingleUserPoints(
  client: Client,
  userTag: string,
  amount: number,
  memo: string
): Promise<MessageEmbed> {
  // get corresponding user
  const manifoldUser = await getManifoldUser(userTag);

  if (!manifoldUser) {
    return errorMessage(`Couldn't find corresponding Manifold user for: @${userTag}.`);
  }

  // first change the user's points
  const amountChange = await incrementUserBalance(manifoldUser.id, amount);

  const amountMagnitude = Math.abs(amountChange);
  const changePhrase = amount > 0 ? "added to" : "removed from";

  const memoString = memo === "" ? "" : `\n\nMemo: **${memo}**`;

  const transactionSummary = new MessageEmbed()
    .setColor("#53DD6C")
    .setTitle("E-Clip Transaction Complete")
    .setAuthor({
      name: manifoldUser.name,
      iconURL: manifoldUser.avatarUrl
    })
    .setDescription(
      `**${amountMagnitude}** E-Clip${amountMagnitude === 1 ? "" : "s"
      } ${changePhrase} ${manifoldUser.name}'s balance!${memoString}`
    )
    .addFields({
      name: "New Balance",
      value: `:paperclip: ${manifoldUser.balance + amountChange}`,
      inline: true
    })
    .setTimestamp(new Date())
    .setFooter({
      text: "Atlas E-Clips",
      iconURL:
        "https://storage.googleapis.com/image-bucket-atlas-points-bot/logo.png"
    });


  return transactionSummary;
}

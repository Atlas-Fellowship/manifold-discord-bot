import { CommandInteraction, Role, MessageEmbed, Client } from "discord.js";
import { incrementUserBalance, getManifoldUser, getLogChannel, ManifoldUser } from "../db";
import { errorMessage } from "./confirmPerms";
import { zip } from "./other";

// increment all users in role's points (can be negative!)
export default async function incrementRolePoints(
  client: Client,
  role: Role,
  amount: number,
  memo: string
): Promise<MessageEmbed> {

  // fetch all members for role
  await role.guild.members.fetch();

  // get all users, if can't get all of them then throw an error
  const memberDiscordTags: string[] = [];
  const futureManifoldUsers: Promise<ManifoldUser | undefined>[] = [];
  for (const [, member] of role.members) {
    memberDiscordTags.push(member.user.id);
    futureManifoldUsers.push(getManifoldUser(member.user.tag));
  }

  // get which ones were successful
  const manifoldUsers: ManifoldUser[] = []
  const notFoundTags: string[] = [];
  for (const [i, maybeManifoldUser] of (await Promise.all(futureManifoldUsers)).entries()) {
    if (maybeManifoldUser) {
      manifoldUsers.push(maybeManifoldUser);
    } else {
      notFoundTags.push(memberDiscordTags[i]);
    }
  }

  // throw error if any of the retrievals were false
  if (notFoundTags.length > 0) {
    const tagList = notFoundTags.slice(0, 10).map(x => `⦁ @${x}`).join("\n");
    const truncatedMessage = notFoundTags.length > 10 ? `\n\n**Truncated - ${notFoundTags.length - 10} more**` : "";
    return errorMessage("Couldn't find corresponding Manifold user for:\n" + tagList + truncatedMessage);
  }

  // first increment points for each member in role
  const promises = [];
  for (const u of manifoldUsers) {
    promises.push(incrementUserBalance(u.id, amount));
  }
  const incrementedAmounts = await Promise.all(promises);

  const amountMagnitude = Math.abs(amount);
  const changePhrase = amount > 0 ? "added to" : "removed from";

  let list = manifoldUsers
    .map((user, i) => `⦁ @${user.discordHandle} — New Balance: **${user.balance + incrementedAmounts[i]}** E-Clips`)
    .slice(0, 10)
    .join("\n");

  if (manifoldUsers.length > 10) {
    list += `\n\n**Truncated - ${manifoldUsers.length - 10} more**`;
  }

  const memoString = memo === "" ? "" : `\n\nMemo: **${memo}**`;

  const transactionSummary = new MessageEmbed()
    .setColor(role.color)
    .setTitle("E-Clip Transaction Complete")
    .setDescription(
      `**${amountMagnitude}** E-Clip${amountMagnitude === 1 ? "" : "s"
      } ${changePhrase} members with the role <@&${role.id}>.\n\n${list
      }${memoString}`
    )
    .setTimestamp(new Date())
    .setFooter({
      text: "Atlas E-Clips",
      iconURL:
        "https://storage.googleapis.com/image-bucket-atlas-points-bot/logo.png"
    });

  return transactionSummary;
}

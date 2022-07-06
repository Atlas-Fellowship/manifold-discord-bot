import { CommandInteraction, Guild, GuildMemberRoleManager, MessageEmbed } from "discord.js";
import { getManifoldUser, ManifoldUser } from "../db/db";

export function errorMessage(description: string): MessageEmbed {
  const errorSummary = new MessageEmbed()
    .setColor("#EF5D60")
    .setTitle("Error!")
    .setDescription(description)
    .setTimestamp(new Date())
    .setFooter({
      text: "Atlas E-Clips",
      iconURL:
        "https://storage.googleapis.com/image-bucket-atlas-points-bot/logo.png"
    });

  return errorSummary;
}

type ConfirmResult = {
  success: true,
  guild: Guild,
  user: ManifoldUser
} | {
  success: false,
  reply: MessageEmbed
}


export async function confirmGuild(
  interaction: CommandInteraction,
  action: string
): Promise<ConfirmResult> {
  if (!interaction.guild) {
    return {
      success: false,
      reply: errorMessage(`You can only ${action} in a server.`)
    };
  }

  const manifoldUser = await getManifoldUser(interaction.guild.id);
  if(!manifoldUser) {
    return {
      success: false,
      reply: errorMessage(`Couldn't find a linked Manifold account. Add your discord username in your Manifold profile.`)
    };
  }

  if(!manifoldUser.admin) {
      return {
      success: false,
      reply: errorMessage(`Your manifold account does not have admin permissions.`)
    };
  }

  return {
    success: true,
    guild: interaction.guild,
    user: manifoldUser
  };
}

export async function confirmPerms(
  interaction: CommandInteraction,
  action: string
): Promise<ConfirmResult> {
  if (!interaction.member || !interaction.guild) {
    return {
      success: false,
      reply: errorMessage(`You can only ${action} in a server.`)
    };
  }

  const manifoldUser = await getManifoldUser(interaction.guild.id);
  if(!manifoldUser) {
    return {
      success: false,
      reply: errorMessage(`Couldn't find a linked Manifold account. Add your discord username in your Manifold profile.`)
    };
  }

  if(!manifoldUser.admin) {
      return {
      success: false,
      reply: errorMessage(`Your manifold account does not have admin permissions.`)
    };
  }

  return {
    success: true,
    guild: interaction.guild,
    user: manifoldUser
  };
}

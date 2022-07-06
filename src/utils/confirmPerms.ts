import { CommandInteraction, Guild, GuildMemberRoleManager, MessageEmbed } from "discord.js";
import { getManifoldUser, ManifoldUser } from "../db";

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

type ConfirmGuildResult = {
  success: true,
  guild: Guild,
} | {
  success: false,
  reply: MessageEmbed
}


export async function confirmGuild(
  interaction: CommandInteraction,
  action: string
): Promise<ConfirmGuildResult> {
  if (!interaction.guild) {
    return {
      success: false,
      reply: errorMessage(`You can only ${action} in a server.`)
    };
  }

  return {
    success: true,
    guild: interaction.guild,
  };
}

type ConfirmManifoldResult = {
  success: true,
  user: ManifoldUser,
} | {
  success: false,
  reply: MessageEmbed
}



export async function confirmManifoldUser(
  interaction: CommandInteraction,
): Promise<ConfirmManifoldResult > {

  const manifoldUser = await getManifoldUser(interaction.user.tag);
  if(!manifoldUser) {
    return {
      success: false,
      reply: errorMessage(`Couldn't find a linked Manifold account. Add your discord username (${interaction.user.tag}) in your Manifold profile.`)
    };
  }

  return {
    success: true,
    user: manifoldUser
  };
}

type ConfirmAdminPermsResult = {
  success: true,
  user: ManifoldUser,
} | {
  success: false,
  reply: MessageEmbed
}



export async function confirmAdminPerms(
  interaction: CommandInteraction,
  action: string
): Promise<ConfirmAdminPermsResult> {
  const manifoldUser = await getManifoldUser(interaction.user.tag);
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
    user: manifoldUser
  };
}

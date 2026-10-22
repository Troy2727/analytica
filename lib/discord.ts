import { REST } from "@discordjs/rest";
import { type APIChannel, type APIEmbed, Routes } from "discord-api-types/v10";

/** Send an embed to a Discord user as a direct message from the Analytica bot. */
export async function sendDiscordDm(userId: string, embed: APIEmbed, token: string): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);
  const dm = (await rest.post(Routes.userChannels(), { body: { recipient_id: userId } })) as APIChannel;
  await rest.post(Routes.channelMessages(dm.id), { body: { embeds: [embed] } });
}

import { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export class Debug {
    @Slash("debug", { description: "Developer info about the server." })
    async debug(interaction: CommandInteraction) {
        interaction.reply(
            `userId: ${interaction.user.id}\nchannelId: ${interaction.channelId}\nguildId: ${interaction.guildId}`,
        );
    }
}

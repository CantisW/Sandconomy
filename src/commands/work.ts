import { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";
import { createEmbed } from "../util/botUtils.js";
import { work } from "../util/economyUtil.js";

@Discord()
export class Work {
    @Slash("work", { description: "Work at your job!" })
    async work(interaction: CommandInteraction) {
        work(interaction.user.id)
            .then((e) => {
                return interaction.reply({ embeds: [e] });
            })
            .catch((e) => {
                return interaction.reply({ embeds: [e] });
            });
    }
}

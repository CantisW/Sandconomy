import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { flipCoin } from "../util/economyUtil.js";

@Discord()
@SlashGroup({ name: "gamble", description: "Gamble your life savings away." })
export class Gamble {
    @Slash("flip", { description: "Flip a coin." })
    @SlashGroup("gamble")
    async flip (
        @SlashOption("amount", { description: "The amount to wager." })
        @SlashOption("choice", { description: "[ Heads | Tails ]", type: "STRING"})
        amount: string,
        choice: string,
        interaction: CommandInteraction
    ) {
        if (choice.toLowerCase() !== "heads") {
            if (choice.toLowerCase() !== "tails") return interaction.reply("Please pick between heads or tails.");
        }
        flipCoin(interaction.user.id, amount, choice).then(e => {
            return interaction.reply({ embeds: [e] });
        }).catch(e => {
            return interaction.reply(e);
        })
    }
}
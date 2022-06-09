import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashChoice, SlashGroup, SlashOption } from "discordx";
import { flipCoin, scratch } from "../util/economyUtil.js";

@Discord()
@SlashGroup({ name: "gamble", description: "Gamble your life savings away." })
export class Gamble {
    @Slash("flip", { description: "Flip a coin." })
    @SlashGroup("gamble")
    async flip (
        @SlashOption("amount", { description: "How much to wager. [ string ]" })
        amount: string,
        @SlashChoice("heads", "tails")
        @SlashOption("choice", { description: "[ Heads | Tails ]", type: "STRING"})
        choice: string,
        interaction: CommandInteraction
    ) {
        // if (choice.toLowerCase() !== "heads") {
        //     if (choice.toLowerCase() !== "tails") return interaction.reply("Please pick between heads or tails.");
        // }
        flipCoin(interaction.user.id, amount, choice).then(e => {
            return interaction.reply({ embeds: [e] });
        }).catch(e => {
            return interaction.reply(e);
        })
    }

    @Slash("scratch", { description: "Do some scratchers." })
    @SlashGroup("gamble")
    async scratch (
        @SlashChoice("$5", "$25", "$50", "$100", "$250", "$500")
        @SlashOption("choice", { description: "What scratcher to get (higher value for higher prizes)." })
        choice: string,
        interaction: CommandInteraction
    ) {
        // if (choice.toLowerCase() !== "heads") {
        //     if (choice.toLowerCase() !== "tails") return interaction.reply("Please pick between heads or tails.");
        // }
        scratch(interaction.user.id, choice).then(e => {
            return interaction.reply({ embeds: [e] });
        }).catch(e => {
            return interaction.reply(e);
        })
    }
}
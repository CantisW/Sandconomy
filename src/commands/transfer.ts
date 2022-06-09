import { CommandInteraction, User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { transfer } from "../util/economyUtil.js";

@Discord()
export class Transfer {
    @Slash("transfer", { description: "Transfer some money to another user."})
    async transfer (
        @SlashOption("recepient", { description: "Who? [ @User ]", type: "USER" })
        @SlashOption("amount", { description: "How much? [ number ]", type: "STRING" })
        recepient: User,
        amount: string,
        interaction: CommandInteraction
    ) {
        transfer(interaction.user.id, recepient.id, amount).then(e => {
            return interaction.reply({ embeds: [e] })
        }).catch(e => {
            return interaction.reply(e);
        })
    }
}
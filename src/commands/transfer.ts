import { CommandInteraction, User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { transfer } from "../util/economyUtil.js";

@Discord()
export class Transfer {
    @Slash("transfer", { description: "Transfer some money to another user."})
    async transfer (
        @SlashOption("recepient", { description: "Who? [ @User]", type: "USER" })
        @SlashOption("amount", { description: "How much? [ number ]" })
        recepient: User,
        amount: string,
        interaction: CommandInteraction
    ) {
        const amt = parseFloat(amount);
        if (!amt) return interaction.reply("You can't transfer this!")
        transfer(recepient.id, amt)
    }
}
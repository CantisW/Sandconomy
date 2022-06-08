import { CommandInteraction, User } from "discord.js";
import { Discord, Permission, Slash, SlashGroup, SlashOption } from "discordx";
import { getConfig, returnBotSetting } from "../util/botUtils.js";
import { createRobMessage, rob } from "../util/economyUtil.js";

const { currencyName } = getConfig();
let ownerid = returnBotSetting("ownerId");

if (returnBotSetting("environment") !== "production") {
    ownerid = process.env.OWNERID || "";
}

@Discord()
@SlashGroup({ name: "crime", description: "Do some dirty crime." })
export class Rob {
    @Slash("rob", { description: "Rob money from another user." })
    @SlashGroup("crime")
    async rob(
        @SlashOption("user", { description: "Who? [ @User ]", type: "USER" })
        user: User,
        interaction: CommandInteraction,
    ) {
        rob(interaction.user.id, user.id)
            .then((e) => {
                return interaction.reply({ embeds: [e] });
            })
            .catch((e) => {
                return interaction.reply(e);
            });
    }

    @Permission(false)
    @Permission({ id: ownerid, type: "USER", permission: true })
    @Slash("message", { description: "Add a rob message." })
    @SlashGroup("crime")
    async message(
        @SlashOption("message", { description: "The message.", type: "STRING" })
        @SlashOption("type", { description: "If the rob is a positive or negative message.", type: "BOOLEAN" })
        message: string,
        type: boolean,
        interaction: CommandInteraction,
    ) {
        if (await createRobMessage(message, type)) {
            return interaction.reply("Successfully created rob message.");
        } else {
            return interaction.reply("Something has gone wrong.");
        }
    }
}

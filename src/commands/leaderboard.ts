import {
    ButtonInteraction,
    ColorResolvable,
    CommandInteraction,
    Interaction,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
} from "discord.js";
import { ButtonComponent, Discord, Slash } from "discordx";
import { IAccount } from "../types/types.js";
import { ReturnOrderedUsers } from "../util/accountUtil.js";
import { fetchUsername, getConfig, getPagnationUserIndex, setPagnationUserIndex } from "../util/botUtils.js";
import { formatBalance } from "../util/economyUtil.js";

const backButton = new MessageButton({
    style: "SECONDARY",
    label: "Back",
    emoji: "⬅️",
    customId: "back",
});

const forwardButton = new MessageButton({
    style: "SECONDARY",
    label: "Forward",
    emoji: "➡️",
    customId: "forward",
});

const { currencyName } = getConfig();

@Discord()
export class Leaderboard {
    users: IAccount[];
    length: number;

    @Slash("leaderboard", { description: "View the global leaderboards!" })
    async leaderboard(interaction: CommandInteraction) {
        let to = 9;
        let row = new MessageActionRow();
        let components = false;

        await interaction.deferReply();

        this.users = await ReturnOrderedUsers();
        this.length = this.users.length - 1;

        const embed = new MessageEmbed()
            .setColor("0xf1c40f" as ColorResolvable)
            .setTitle("Global Leaderboard")
            //.setURL('')s
            //.setAuthor('Santeeisweird9')
            .setDescription("The global leaderboard of Elon Musks (pg 1)")
            //.setThumbnail('')
            //.addField('', '', true)
            //.setImage('')
            .setTimestamp()
            .setFooter(`${currencyName}`, ""); // TODO: set url as second arg

        if (this.length > to) {
            components = true;
            row = row.addComponents([forwardButton]);
        } else {
            to = this.length;
        }

        for (let i = 0; i <= to; i++) {
            embed.addFields({
                name: `${await fetchUsername(this.users[i].userid)}`,
                value: `${formatBalance(this.users[i].balance)} (${formatBalance(this.users[i].cash)} in cash)`,
            });
        }

        if (components) {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
            await interaction.editReply({ embeds: [embed] });
        }
    }

    @ButtonComponent("forward")
    async forward(interaction: ButtonInteraction) {
        let to = getPagnationUserIndex(interaction.user.id, "leaderboard");
        let row = new MessageActionRow();

        if (to === 0) setPagnationUserIndex(interaction.user.id, "leaderboard", 10); // assumes that user made a new list if 'to' is 0

        let current = Math.floor((1 + getPagnationUserIndex(interaction.user.id, "leaderboard")) / 10) * 10; // Sets current to where we are right now

        if (this.length > current + 9) {
            setPagnationUserIndex(interaction.user.id, "leaderboard", current + 9); // Where we are going to (if we had 30 items, it would go 0 => 9, then 10 => 19, then...)
            row = row.addComponents([backButton, forwardButton]);
        } else {
            setPagnationUserIndex(interaction.user.id, "leaderboard", this.length);
            row = row.addComponents([backButton]);
        }

        to = getPagnationUserIndex(interaction.user.id, "leaderboard"); // Re-set 'to' to adjust for earlier code

        const embed = new MessageEmbed()
            .setColor("0xf1c40f" as ColorResolvable)
            .setTitle("Global Leaderboard")
            //.setURL('')s
            //.setAuthor('Santeeisweird9')
            .setDescription(`The global leaderboard of Elon Musks (pg ${current - 9 + 1})`)
            //.setThumbnail('')
            //.addField('', '', true)
            //.setImage('')
            .setTimestamp()
            .setFooter(`${currencyName}`, ""); // TODO: set url as second arg

        for (let i = current; i <= to; i++) {
            embed.addFields({
                name: `${await fetchUsername(this.users[i].userid)}`,
                value: `${formatBalance(this.users[i].balance)} (${formatBalance(this.users[i].cash)} in cash)`,
            });
        }
        await interaction.deferUpdate();
        await interaction.editReply({ embeds: [embed], components: [row] });
    }

    @ButtonComponent("back")
    async back(interaction: ButtonInteraction) {
        let to = getPagnationUserIndex(interaction.user.id, "leaderboard");
        let row = new MessageActionRow();

        if (to === 0) return interaction.reply("Don't have more than two leaderboards!"); // this shouldn't normally be possible

        let current = Math.floor((1 + getPagnationUserIndex(interaction.user.id, "leaderboard")) / 10) * 10; // Sets current to where we are right now

        if (current - 10 > 0) {
            setPagnationUserIndex(interaction.user.id, "leaderboard", current - 10); // Where we are going to
            row = row.addComponents([backButton, forwardButton]);
        } else {
            setPagnationUserIndex(interaction.user.id, "leaderboard", 9);
            row = row.addComponents([forwardButton]);
        }

        to = getPagnationUserIndex(interaction.user.id, "leaderboard"); // Re-set 'to' to adjust for earlier code

        const embed = new MessageEmbed()
            .setColor("0xf1c40f" as ColorResolvable)
            .setTitle("Global Leaderboard")
            //.setURL('')s
            //.setAuthor('Santeeisweird9')
            .setDescription(`The global leaderboard of Elon Musks (pg ${current - 9})`)
            //.setThumbnail('')
            //.addField('', '', true)
            //.setImage('')
            .setTimestamp()
            .setFooter(`${currencyName}`, ""); // TODO: set url as second arg

        if (to === 9) {
            current = to;
            to = 0;
        } else {
            current = current - 1;
        }

        for (let i = to; i <= current; i++) {
            embed.addFields({
                name: `${await fetchUsername(this.users[i].userid)}`,
                value: `${formatBalance(this.users[i].balance)} (${formatBalance(this.users[i].cash)} in cash)`,
            });
        }
        await interaction.deferUpdate();
        await interaction.editReply({ embeds: [embed], components: [row] });
    }
}

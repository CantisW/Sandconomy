import { Pagination, PaginationResolver, PaginationType } from "@discordx/pagination";
import {
    CommandInteraction,
    MessageEmbed,
} from "discord.js";
import { Discord, Slash } from "discordx";
import { IAccount } from "../types/types.js";
import { fetchUsername, formatBalance, getConfig, returnOrderedUsers } from "../util/botUtils.js";

const { currencyName } = getConfig();

@Discord()
export class Leaderboard {
    users: IAccount[];
    length: number;

    @Slash("leaderboard", { description: "View the global leaderboards!" })
    async leaderboard(interaction: CommandInteraction) {
        this.users = await returnOrderedUsers();
        this.length = this.users.length; 

        const pageOptions = new PaginationResolver(async (page, pagination) => {
            pagination.maxLength = Math.ceil(this.length / 10);

            const currentPage = pagination.currentPage;

            const embed = new MessageEmbed()
                .setTitle("Leaderboard")
                .setDescription(`The global leaderboard of Elon Musks (pg ${page + 1})`)
                .setTimestamp()
                .setFooter({ text: `${currencyName}`});

            const users = this.users.slice(currentPage * 10, (currentPage * 10) + 10);
            for (let user of users) {
                embed.addField(
                    `${await fetchUsername(user.userid)}`,
                    `${formatBalance(user.balance)} total (${formatBalance(user.cash)} in cash)`
                )
            }
            return embed;
        }, Math.ceil(this.length / 10))

        const pagination = new Pagination(interaction, pageOptions, {
            // onTimeout: () => {
            //   interaction.deleteReply();
            // },
            // time: 5 * 1000,
            type: PaginationType.Button,
          });
      
        await pagination.send();
    }
}

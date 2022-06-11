import { Pagination, PaginationResolver, PaginationType } from "@discordx/pagination";
import { CommandInteraction, MessageEmbed, MessageOptions } from "discord.js";
import { Discord, Permission, Slash, SlashChoice, SlashGroup, SlashOption } from "discordx";
import { IItem } from "../types/types.js";
import { GetAccountInfo } from "../util/accountUtil.js";
import { formatBalance, getConfig, returnBotSetting, returnOrderedItems } from "../util/botUtils.js";
import { buyItem, createItem, getItemInfo, useItem } from "../util/economyUtil.js";

const { currencyName } = getConfig();

let ownerid = returnBotSetting("ownerId");

if (returnBotSetting("environment") !== "production") {
    ownerid = process.env.OWNERID || "";
}

@Discord()
@SlashGroup({ name: "item", description: "Buy some items." })
export class Shop {
    items: IItem[];
    length: number;

    @Slash("list", { description: "Get the list of items." })
    @SlashGroup("item")
    async list (
        interaction: CommandInteraction
    ): Promise<void> {
        this.items = await returnOrderedItems();
        this.length = this.items.length; 

        const pageOptions = new PaginationResolver(async (page, pagination) => {
            pagination.maxLength = Math.ceil(this.length / 10);

            const currentPage = pagination.currentPage;

            const embed = new MessageEmbed()
                .setTitle("Shop")
                .setDescription(`The list of items to waste your money on (pg ${page + 1})`)
                .setTimestamp()
                .setFooter({ text: `${currencyName}`});

            const items = this.items.slice(currentPage * 10, (currentPage * 10) + 10);
            for (let item of items) {
                embed.addField(
                    `${item.name} (ID: ${item.id})`,
                    `${item.description}\nPrice: ${formatBalance(item.price)}`
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

    @Slash("buy", { description: "Buy an item." })
    @SlashGroup("item")
    async buy (
        @SlashOption("id", { description: "The ID of the item you want to buy", type: "NUMBER" })
        id: number,
        interaction: CommandInteraction
    ) {
        buyItem(interaction.user.id, id).then(e => {
            interaction.reply({ embeds: [e] });
        }).catch(e => {
            interaction.reply(e);
        })
    }

    @Slash("inventory", { description: "See your items." })
    @SlashGroup("item")
    async inventory (
        interaction: CommandInteraction
    ) {
        const { inventory } = await GetAccountInfo(interaction.user.id)
        if (!inventory) return interaction.reply("You don't own any items!")
        const length = inventory.length;
        if (length <= 0) return interaction.reply("You don't own any items!")
        const pageOptions = new PaginationResolver(async (page, pagination) => {
            pagination.maxLength = Math.ceil(length / 10);

            const currentPage = pagination.currentPage;

            const embed = new MessageEmbed()
                .setTitle("Items")
                .setDescription(`Your list of items. (pg ${page + 1})`)
                .setTimestamp()
                .setFooter({ text: `${currencyName}`});

            const jobs = inventory.slice(currentPage * 10, (currentPage * 10) + 10);
            for (let item of inventory) {
                const info = await getItemInfo(item.id);
                embed.addField(
                    `${info.name} (ID: ${item.id})`,
                    `${info.description}\n${formatBalance(info.price)}\nQuantity: ${item.quantity}`
                )
            }
            return embed;
        }, Math.ceil(length / 10))

        const pagination = new Pagination(interaction, pageOptions, {
            // onTimeout: () => {
            //   interaction.deleteReply();
            // },
            // time: 5 * 1000,
            type: PaginationType.Button,
          });
      
        await pagination.send();
    }

    @Slash("use", { description: "Use an item." })
    @SlashGroup("item")
    async use (
        @SlashOption("id", { description: "The ID of the item you want to use.", type: "NUMBER" })
        id: number,
        interaction: CommandInteraction
    ) {
        useItem(interaction.user.id, id).then(e => {
            return interaction.reply({ embeds: [e] });
        }).catch(e => {
            return interaction.reply(e);
        })
    }

    @Permission(false)
    @Permission({ id: ownerid, type: "USER", permission: true })
    @Slash("create", { description: "Create a shop item." })
    @SlashGroup("item")
    async create (
        @SlashOption("name", { description: "The name of the item." })
        @SlashOption("description", { description: "The description of the item." })
        @SlashOption("price", { description: "The price of the item." })
        name: string,
        description: string,
        price: string,
        @SlashChoice("mute", "generate")
        @SlashOption("effect", { description: "What the item will do." })
        effect: string,
        @SlashOption("duration", { description: "Item's duration, or interval between getting money.", type: "NUMBER", required: false })
        @SlashOption("amount", { description: "Amount of money.", required: false })
        duration: number,
        amount: string,
        interaction: CommandInteraction
    ) {
        const amt = parseFloat(price);
        const pay = parseFloat(amount)
        if (!amt) return interaction.reply("This is an invalid price!")
        if (amount) {
            if (!pay) return interaction.reply("This is an invalid amount!")
        }
        if (interaction.user.id !== ownerid) return interaction.reply("You have insufficient permissions!");
        createItem(name, description, amt, effect, duration, pay);
        return interaction.reply("Item created!");
    }
}

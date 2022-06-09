import { ColorResolvable, CommandInteraction, MessageEmbed, User } from "discord.js";
import { Discord, Permission, Slash, SlashOption } from "discordx";
import { CheckIfAccountExists, DepositCash, GetAccountInfo, WithdrawCash } from "../util/accountUtil.js";
import { fetchUsername, formatBalance, getConfig } from "../util/botUtils.js";
import { xpUntilNextLevel } from "../util/economyUtil.js";

@Discord()
export class Account {
    @Slash("balance", { description: "Get you or someone else's balance." })
    async balance(
        @SlashOption("bal", { description: "Who? [ @User ]", required: false, type: "USER" })
        bal: User,
        interaction: CommandInteraction,
    ) {
        const { currencyName } = getConfig();
        if (!bal) {
            if (await CheckIfAccountExists(interaction.user.id)) {
                const { balance, cash, bank, xp, level, timesWorked } = await GetAccountInfo(interaction.user.id);
                const embed = new MessageEmbed()
                    .setColor("YELLOW" as ColorResolvable)
                    .setTitle("Your Bank Account Info")
                    //.setURL('')s
                    //.setAuthor('Santeeisweird9')
                    .setDescription("Information about your account.")
                    .addFields(
                        {
                            name: "Account Balance",
                            value: `${formatBalance(balance)}\n${formatBalance(cash)} cash on hand.`,
                        },
                        {
                            name: "Experience",
                            value: `Currently at level ${level} with ${xp} Experience Points\n${
                                (await xpUntilNextLevel(interaction.user.id)) - xp
                            } points until next level`,
                        },
                        {
                            name: "Times Worked",
                            value: `You have worked ${timesWorked} times!`,
                        },
                    )
                    //.setThumbnail('')
                    //.addField('', '', true)
                    //.setImage('')
                    .setTimestamp()
                    .setFooter(`${currencyName}`, ""); // TODO: set url as second arg

                return interaction.reply({ embeds: [embed] });
            }
        }
        if (await CheckIfAccountExists(bal.id)) {
            const { balance, cash, bank, xp, level, timesWorked } = await GetAccountInfo(bal.id);
            const embed = new MessageEmbed()
                .setColor("YELLOW" as ColorResolvable)
                .setTitle(`${await fetchUsername(bal.id)}'s Bank Account Info`)
                //.setURL('')s
                //.setAuthor('Santeeisweird9')
                .setDescription(`Information about ${bal}'s account.`)
                .addFields(
                    {
                        name: "Account Balance",
                        value: `${formatBalance(balance)}\n${formatBalance(cash)} cash on hand.`,
                    },
                    {
                        name: "Experience",
                        value: `Currently at level ${level} with ${xp} Experience Points\n${
                            (await xpUntilNextLevel(bal.id)) - xp
                        } points until next level`,
                    },
                    {
                        name: "Times Worked",
                        value: `${bal} has worked ${timesWorked} times!`,
                    },
                )
                //.setThumbnail('')
                //.addField('', '', true)
                //.setImage('')
                .setTimestamp()
                .setFooter(`${currencyName}`, ""); // TODO: set url as second arg
            return interaction.reply({ embeds: [embed] });
        }
    }

    @Slash("deposit", { description: "Deposit your bank money." })
    async deposit(
        @SlashOption("amount", {
            description: "How much? [ number or leave blank to deposit all ]",
            required: false
        })
        amount: string,
        interaction: CommandInteraction,
    ) {
        if (await CheckIfAccountExists(interaction.user.id)) {
            const { cash } = await GetAccountInfo(interaction.user.id);
            let x = amount;
            if (!amount) x = cash.toString();
            if (await DepositCash(interaction.user.id, amount)) {
                return interaction.reply(`You successfully deposited ${formatBalance(parseFloat(x))} into your bank!`);
            } else {
                return interaction.reply("You can't deposit that!");
            }
        } else {
            return interaction.reply("You don't have an account!");
        }
    }

    @Slash("withdraw", { description: "Withdraw your bank money." })
    async withdraw(
        @SlashOption("amount", {
            description: "How much? [ number or leave blank to deposit all ]",
            required: false
        })
        amount: string,
        interaction: CommandInteraction,
    ) {
        if (await CheckIfAccountExists(interaction.user.id)) {
            const { bank } = await GetAccountInfo(interaction.user.id);
            let x = amount;
            if (!amount) x = bank.toString();
            if (await WithdrawCash(interaction.user.id, amount)) {
                return interaction.reply(`You successfully withdrawn ${formatBalance(parseFloat(x))} from your bank!`);
            } else {
                return interaction.reply("You can't withdraw that!");
            }
        } else {
            return interaction.reply("You don't have an account!");
        }
    }

    @Permission(false)
    @Permission({ id: "301770103224270851", type: "USER", permission: true })
    @Slash("fa", { description: "Force-Account" })
    async fa(
        @SlashOption("user", { description: "Who? [ @User or UserId ]" })
        user: string,
        interaction: CommandInteraction,
    ) {
        if (await CheckIfAccountExists(user)) return interaction.reply(`Successfully created the account ${user}`);
    }
}

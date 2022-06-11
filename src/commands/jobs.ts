import { Pagination, PaginationResolver, PaginationType } from "@discordx/pagination";
import {
    CommandInteraction,
    MessageEmbed,
    User,
} from "discord.js";
import { Discord, Permission, Slash, SlashGroup, SlashOption } from "discordx";
import { IJob } from "../types/types.js";
import { formatBalance, getConfig, getPagnationUserIndex, returnBotSetting, returnOrderedJobs, setPagnationUserIndex } from "../util/botUtils.js";
import {
    createJob,
    createMessage,
    getEmploymentStatus,
    getJob,
    getJobInfo,
    quitJob,
} from "../util/economyUtil.js";

const { currencyName } = getConfig();
let ownerid = returnBotSetting("ownerId");

if (returnBotSetting("environment") !== "production") {
    ownerid = process.env.OWNERID || "";
}

@Discord()
@SlashGroup({ name: "job", description: "Get or create jobs." })
export class Jobs {
    jobs: IJob[];
    length: number;

    @Slash("list", { description: "List all the available jobs." })
    @SlashGroup("job")
    async leaderboard(interaction: CommandInteraction) {
        this.jobs = await returnOrderedJobs();
        this.length = this.jobs.length; 

        const pageOptions = new PaginationResolver(async (page, pagination) => {
            pagination.maxLength = Math.ceil(this.length / 10);

            const currentPage = pagination.currentPage;

            const embed = new MessageEmbed()
                .setTitle("Leaderboard")
                .setDescription(`The global leaderboard of Elon Musks (pg ${page + 1})`)
                .setTimestamp()
                .setFooter({ text: `${currencyName}`});

            const jobs = this.jobs.slice(currentPage * 10, (currentPage * 10) + 10);
            for (let job of jobs) {
                embed.addField(
                    `${job.name} (ID: ${job.id})`,
                    `${job.description}\n${formatBalance(job.amount)}/hr\nLevel required: ${job.minimum_level}`
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

    @Permission(false)
    @Permission({ id: ownerid, type: "USER", permission: true })
    @Slash("create", { description: "Create jobs." })
    @SlashGroup("job")
    async create(
        @SlashOption("name", { description: "The name of the job.", type: "STRING" })
        @SlashOption("description", { description: "What the job does.", type: "STRING" })
        @SlashOption("pay", { description: "How much the job pays per hour." })
        @SlashOption("selectiveness", {
            description: "How selective a job is [ 0 - 20 ]",
            type: "NUMBER",
            required: false,
        })
        @SlashOption("level", { description: "The minimum level needed to apply.", type: "NUMBER", required: false })
        name: string,
        description: string,
        pay: string,
        selectiveness: number,
        level: number,
        interaction: CommandInteraction,
    ) {
        if (interaction.user.id !== ownerid) return interaction.reply("You have insufficient permissions!") // incase permissions breaks again
        const amount = parseFloat(pay);
        if (!amount) return interaction.reply("Input a valid amount!");
        createJob(name, description, amount, selectiveness, level);
        return interaction.reply("Job created!");
    }

    @Slash("apply", { description: "Apply for a job." })
    @SlashGroup("job")
    async apply(
        @SlashOption("id", { description: "The ID of the job.", type: "NUMBER" })
        id: number,
        interaction: CommandInteraction,
    ) {
        id = Math.round(id);
        await getJob(interaction.user.id, id)
            .then(() => {
                return interaction.reply(`You have been hired!`);
            })
            .catch((e) => {
                return interaction.reply(e);
            });
    }

    @Slash("quit", { description: "Quit your job." })
    @SlashGroup("job")
    async quit(interaction: CommandInteraction) {
        if (await quitJob(interaction.user.id)) {
            return interaction.reply("You have successfully left your job.");
        } else {
            return interaction.reply("You don't have a job to leave...unless you mean...");
        }
    }

    @Slash("check", { description: "Check what your job is." })
    @SlashGroup("job")
    async check(
        @SlashOption("user", { description: "Who? [ @User ]", required: false, type: "USER" })
        user: User,
        interaction: CommandInteraction,
    ) {
        if (user) {
            if (await getEmploymentStatus(user.id)) {
                let info = await getJobInfo(user.id);
                return interaction.reply(
                    `This user is currently employed as a ${info.name} earning ${formatBalance(info.amount)}/hr.`,
                );
            } else {
                return interaction.reply("This user is unemployed.");
            }
        }

        if (await getEmploymentStatus(interaction.user.id)) {
            let info = await getJobInfo(interaction.user.id);
            return interaction.reply(
                `You are currently employed as a ${info.name} earning ${formatBalance(info.amount)}/hr.`,
            );
        } else {
            return interaction.reply("You are unemployed.");
        }
    }

    @Permission(false)
    @Permission({ id: ownerid, type: "USER", permission: true })
    @Slash("message", { description: "Add a job work message." })
    @SlashGroup("job")
    async message(
        @SlashOption("id", { description: "The ID of a job.", type: "NUMBER" })
        @SlashOption("message", { description: "The message.", type: "STRING" })
        @SlashOption("type", {
            description: "If the job is a positive or negative message.",
            type: "BOOLEAN",
            required: false,
        })
        id: number,
        message: string,
        type: boolean,
        interaction: CommandInteraction,
    ) {
        if (interaction.user.id !== ownerid) return interaction.reply("You have insufficient permissions!") // incase permissions breaks again
        id = Math.round(id);
        if (await createMessage(id, message, type)) {
            return interaction.reply("Successfully created job message.");
        } else {
            return interaction.reply("This job ID doesn't exist.");
        }
    }
}

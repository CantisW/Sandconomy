import { ButtonInteraction, ColorResolvable, CommandInteraction, MessageActionRow, MessageButton, MessageEmbed, User } from "discord.js";
import { ButtonComponent, Discord, Permission, Slash, SlashGroup, SlashOption } from "discordx";
import { IJob } from "../types/types.js";
import { getConfig, getPagnationUserIndex, returnBotSetting, setPagnationUserIndex } from "../util/botUtils.js";
import { createJob, createMessage, formatBalance, getEmploymentStatus, getJob, getJobInfo, quitJob, returnOrderedJobs } from "../util/economyUtil.js";

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
let ownerid = returnBotSetting("ownerId");

if (returnBotSetting("environment") !== "production") {
    ownerid = process.env.OWNERID || "";
}

@Discord()
@SlashGroup({ name: "job", description: "Get or create jobs." })
export class Jobs {
    jobs: IJob[];
    length: number;

    @Slash("list", { "description": "List all the available jobs." })
    @SlashGroup("job")
    async leaderboard(
        interaction: CommandInteraction
    ) {
        let to = 9;
        let row = new MessageActionRow();
        let components = false;

        await interaction.deferReply();

        this.jobs = await returnOrderedJobs();
        this.length = this.jobs.length - 1;

        const embed = new MessageEmbed()
            .setColor("0xf1c40f" as ColorResolvable)
            .setTitle("Jobs List")
            //.setURL('')s
            //.setAuthor('Santeeisweird9')
            .setDescription("The list of companies looking for employees to exploit (pg 1)")
            //.setThumbnail('')
            //.addField('', '', true)
            //.setImage('')
            .setTimestamp()
            .setFooter(`${currencyName}`, ""); // TODO: set url as second arg
            
        if (this.length > to) {
            components = true
            row = row.addComponents([forwardButton]);
        } else {
            to = this.length;
        }

        for (let i = 0; i <= to ; i++) {
            embed.addFields({
                "name": `${this.jobs[i].name} (ID: ${this.jobs[i].id})`,
                "value": `${this.jobs[i].description}\n${formatBalance(this.jobs[i].amount)}/hr\nLevel required: ${this.jobs[i].minimum_level}`
            })
        }

        if (components) {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
            await interaction.editReply({ embeds: [embed] });
        }
    }



    @ButtonComponent("forward")
    async forward (
        interaction: ButtonInteraction
    ) {
        let to = getPagnationUserIndex(interaction.user.id, "jobs_list");
        let row = new MessageActionRow();

        if (to === 0) setPagnationUserIndex(interaction.user.id, "jobs_list", 10); // assumes that user made a new list if 'to' is 0

        let current = Math.floor((1 + getPagnationUserIndex(interaction.user.id, "jobs_list"))/10) * 10; // Sets current to where we are right now

        if (this.length > current + 9) {
            setPagnationUserIndex(interaction.user.id, "jobs_list", current + 9); // Where we are going to (if we had 30 items, it would go 0 => 9, then 10 => 19, then...)  
            row = row.addComponents([backButton, forwardButton]);      
        } else {
            setPagnationUserIndex(interaction.user.id, "jobs_list", this.length);
            row = row.addComponents([backButton]);
        }

        to = getPagnationUserIndex(interaction.user.id, "jobs_list"); // Re-set 'to' to adjust for earlier code

        const embed = new MessageEmbed()
            .setColor("0xf1c40f" as ColorResolvable)
            .setTitle("Jobs List")
            //.setURL('')s
            //.setAuthor('Santeeisweird9')
            .setDescription(`The list of companies looking for employees to exploit (pg ${(current-9)+1})`)
            //.setThumbnail('')
            //.addField('', '', true)
            //.setImage('')
            .setTimestamp()
            .setFooter(`${currencyName}`, ""); // TODO: set url as second arg

        for (let i = current; i <= to ; i++) {
            embed.addFields({
                "name": `${this.jobs[i].name} (ID: ${this.jobs[i].id})`,
                "value": `${this.jobs[i].description}\n${formatBalance(this.jobs[i].amount)}/hr\nLevel required: ${this.jobs[i].minimum_level}`
            })
        }
        await interaction.deferUpdate();
        await interaction.editReply({ embeds: [embed], components: [row] });
    }

    @ButtonComponent("back")
    async back (
        interaction: ButtonInteraction
    ) {
        let to = getPagnationUserIndex(interaction.user.id, "jobs_list");
        let row = new MessageActionRow();

        if (to === 0) return interaction.reply("Don't have more than two lists!"); // this shouldn't normally be possible

        let current = Math.floor((1 + getPagnationUserIndex(interaction.user.id, "jobs_list"))/10) * 10; // Sets current to where we are right now

        if ( current - 10 > 0) {
            setPagnationUserIndex(interaction.user.id, "jobs_list", current - 10); // Where we are going to 
            row = row.addComponents([backButton, forwardButton]);      
        } else {
            setPagnationUserIndex(interaction.user.id, "jobs_list", 9);
            row = row.addComponents([forwardButton]);
        }

        to = getPagnationUserIndex(interaction.user.id, "jobs_list"); // Re-set 'to' to adjust for earlier code

        const embed = new MessageEmbed()
            .setColor("0xf1c40f" as ColorResolvable)
            .setTitle("Jobs List")
            //.setURL('')s
            //.setAuthor('Santeeisweird9')
            .setDescription(`The list of companies looking for employees to exploit (pg ${current-9})`)
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

        for (let i = to; i <= current ; i++) {
            embed.addFields({
                "name": `${this.jobs[i].name} (ID: ${this.jobs[i].id})`,
                "value": `${this.jobs[i].description}\n${formatBalance(this.jobs[i].amount)}/hr\nLevel required: ${this.jobs[i].minimum_level}`
            })
        }
        await interaction.deferUpdate();
        await interaction.editReply({ embeds: [embed], components: [row] });
    }




    @Slash("create", { "description": "Create jobs." })
    @SlashGroup("job")
    @Permission(false)
    @Permission({ id: ownerid, type: "USER", permission: true })
    async create (
        @SlashOption("name", { "description": "The name of the job.", "type": "STRING" })
        @SlashOption("description", { "description": "What the job does.", "type": "STRING" })
        @SlashOption("pay", { "description": "How much the job pays per hour." })
        @SlashOption("selectiveness", { "description": "How selective a job is [ 0 - 20 ]", "type": "NUMBER", "required": false })
        @SlashOption("level", { "description": "The minimum level needed to apply.", "type": "NUMBER", "required": false })
        name: string,
        description: string,
        pay: string,
        selectiveness: number,
        level: number,
        interaction: CommandInteraction
    ) {
        const amount = parseFloat(pay);
        if (!amount) return interaction.reply("Input a valid amount!");
        createJob(name, description, amount, selectiveness, level)
        return interaction.reply("Job created!")
    }

    @Slash("apply", { "description": "Apply for a job." })
    @SlashGroup("job")
    async apply (
        @SlashOption("id", { "description": "The ID of the job.", "type": "NUMBER" })
        id: number,
        interaction: CommandInteraction
    ) {
        await getJob(interaction.user.id, id).then(() => {
            return interaction.reply(`You have been hired!`)
        }).catch(e => {
            return interaction.reply(e);
        })
    }

    @Slash("quit", { "description": "Quit your job." })
    @SlashGroup("job")
    async quit (
        interaction: CommandInteraction
    ) {
        if(await quitJob(interaction.user.id)) {
            return interaction.reply("You have successfully left your job.");
        } else {
            return interaction.reply("You don't have a job to leave...unless you mean...")
        }
    }

    @Slash("check", { "description": "Check what your job is." })
    @SlashGroup("job")
    async check (
        @SlashOption("user", { "description": "Who? [ @User ]", "required": false, "type":"USER" })
        user: User,
        interaction: CommandInteraction
    ) {
        if (user) {
            if(await getEmploymentStatus(user.id)) {
                let info = await getJobInfo(user.id);
                return interaction.reply(`This user is currently employed as a ${info.name} earning ${formatBalance(info.amount)}/hr.`)
            } else {
                return interaction.reply("This user is unemployed.");
            }
        }

        if(await getEmploymentStatus(interaction.user.id)) {
            let info = await getJobInfo(interaction.user.id);
            return interaction.reply(`You are currently employed as a ${info.name} earning ${formatBalance(info.amount)}/hr.`)
        } else {
            return interaction.reply("You are unemployed.");
        }
    }

    @Slash("message", { "description": "Add a job work message." })
    @SlashGroup("job")
    @Permission(false)
    @Permission({ id: ownerid, type: "USER", permission: true })
    async message (
        @SlashOption("id", { "description": "The ID of a job.", "type": "NUMBER" })
        @SlashOption("message", { "description": "The message.", "type": "STRING" })
        @SlashOption("type", { "description": "If the job is a positive or negative message.", "type": "BOOLEAN", "required": false })
        id: number,
        message: string,
        type: boolean,
        interaction: CommandInteraction
    ) {
        if(await createMessage(id, message, type)) {
            return interaction.reply("Successfully created job message.")
        } else {
            return interaction.reply("This job ID doesn't exist.");
        }
    }
}
import { ColorResolvable, MessageEmbed } from "discord.js";
import fs from "fs";
import { Item } from "../entity/Item.js";
import { Job } from "../entity/Job.js";
import { User } from "../entity/User.js";
import { client } from "../index.js";
import { IAccount, IConfig, IInventoryItem, IItem, IJob, IPagnationArray } from "../types/types.js";
import { GetAccountInfo } from "./accountUtil.js";

const pagnationArray: IPagnationArray[] = [];

/**
 * Returns a specific setting from bot-settings.json.
 */
export const returnBotSetting = (setting: string): string => {
    const settings = fs.readFileSync("./src/data/bot-settings.json", "utf-8");
    const parsedSettings = JSON.parse(settings);
    return settings ? parsedSettings[setting] : "Oops! You picked the wrong setting!";
};

export const getConfig = () => {
    const config = fs.readFileSync("./src/data/settings.json", "utf-8");
    return JSON.parse(config);
};

/**
 * Clear mentioned ids from characters such as <@...>
 */
export const sanitizeId = (id: string) => {
    return id.replace(/[\\<>@#&!]/g, "");
};

/**
 * Gets a username from an ID.
 */

export const fetchUsername = async (id: string) => {
    try {
        const user = await client.users.fetch(id);
        if (user) return user.username;
    } catch {
        return id;
    }
};

/**
 * Sets a specific user's current index for pagnationed things (such as leaderboards).
 */
export const setPagnationUserIndex = (user: string, command: string, index: number) => {
    const obj = { user: user, command: command, index: index };
    if (index === 0) {
        pagnationArray.filter((v) => v !== obj); // remove if index is set to 0
    }
    pagnationArray.forEach((v) => {
        if (v.user === user && v.command === command) {
            v.index = index;
        }
    });
    console.log(pagnationArray);
    return true;
};

/**
 * Returns a specific user's current index for pagnationed things (such as leaderboards). Can also create one.
 */
export const getPagnationUserIndex = (user: string, command: string) => {
    const obj = { user: user, command: command, index: 0 };
    let found = false;
    let index = 0;
    pagnationArray.forEach((v) => {
        if (v.user === user && v.command === command) {
            found = true;
            index = v.index;
        }
    });
    if (found) return index;
    pagnationArray.push(obj);
    return 0;
};

export const createEmbed = (name: string, value: string, color: string, title = "", desc = "") => {
    const { currencyName }: IConfig = getConfig();
    const embed = new MessageEmbed()
        .setColor(color as ColorResolvable)
        .setTitle(title)
        //.setURL('')s
        //.setAuthor('Santeeisweird9')
        .setDescription(desc)
        .addFields({ name: name, value: value })
        //.setThumbnail('')
        //.addField('', '', true)
        //.setImage('')
        .setTimestamp()
        .setFooter(`${currencyName}`, ""); // TODO: set url as second arg
    return embed;
};

/**
 * Format a balance. (10000 => 10,000)
 */
export const formatBalance = (balance: number) => {
    balance = parseBalance(balance);
    return `$${String(balance).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

/**
 * Parse a balance. (19.2712 => 19.27) (-9 => 0)
 */
export const parseBalance = (num: number) => {
    if (num < 0) return 0;
    return Math.round(num * 10 ** 2) / 10 ** 2; // mult by places then round to cut off excess, then go back to decimal
};

export const returnOrderedJobs = async (): Promise<IJob[]> => {
    const job = await Job.createQueryBuilder("job").select("*").orderBy("job.amount", "ASC").getRawMany();
    return job;
};


/**
 * Returns an ordered list of users by balance, excluding 0.
 */
 export const returnOrderedUsers = async (): Promise<IAccount[]> => {
    let bal = await User.createQueryBuilder("user").select("*").getRawMany();
    for (let i = 0; i <= bal.length - 1; i++) {
        await GetAccountInfo(bal[i].userid);
    }
    let user = await User.createQueryBuilder("user")
        .select("*")
        .where("user.balance > 0")
        .orderBy("user.balance", "DESC")
        .getRawMany();

    return user;
};

export const returnOrderedItems = async (): Promise<IItem[]> => {
    let items = await Item.createQueryBuilder("item")
        .select("*")
        .orderBy("item.effect", "ASC")
        .getRawMany();

    return items;
};

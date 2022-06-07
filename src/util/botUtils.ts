import { ColorResolvable, MessageEmbed } from "discord.js";
import fs from "fs";
import { client } from "../index.js";
import { IConfig, IPagnationArray } from "../types/types.js";

const pagnationArray: IPagnationArray[] = [];

/**
 * Returns a specific setting from bot-settings.json.
 */
export const returnBotSetting = (setting: string): string => {
    const settings = fs.readFileSync("./src/data/bot-settings.json", "utf-8");
    const parsedSettings = JSON.parse(settings);
    return settings ? parsedSettings[setting] : "Oops! You picked the wrong setting!"
}

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
}

/**
 * Sets a specific user's current index for pagnationed things (such as leaderboards).
 */
export const setPagnationUserIndex = (user: string, command: string, index: number) => {
    const obj = { user: user, command: command, index: index }
    if (index === 0) {
        pagnationArray.filter((v) => v !== obj); // remove if index is set to 0
    }
    pagnationArray.forEach((v) => {
        if (v.user === user && v.command === command) {
            v.index = index;
        }
    })
    console.log(pagnationArray)
    return true;
}

/**
 * Returns a specific user's current index for pagnationed things (such as leaderboards). Can also create one.
 */
export const getPagnationUserIndex = (user: string, command: string) => {
    const obj = { user: user, command: command, index: 0 }
    let found = false;
    let index = 0;
    pagnationArray.forEach((v) => {
        if (v.user === user && v.command === command) {
            found = true;
            index = v.index;
        }
    })
    if (found) return index;
    pagnationArray.push(obj);
    return 0;
}

export const createEmbed = (name: string, value: string, color: string, title = "", desc = "") => {
    const { currencyName }: IConfig = getConfig();
    const embed = new MessageEmbed()
            .setColor(color as ColorResolvable)
            .setTitle(title)
            //.setURL('')s
            //.setAuthor('Santeeisweird9')
            .setDescription(desc)
            .addFields({ "name": name, "value": value })
            //.setThumbnail('')
            //.addField('', '', true)
            //.setImage('')
            .setTimestamp()
            .setFooter(`${currencyName}`, ""); // TODO: set url as second arg
        return embed;
}
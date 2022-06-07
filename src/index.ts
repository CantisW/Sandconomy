import "reflect-metadata"
import "dotenv/config";

import { Client } from "discordx";
import { Intents, Interaction, Message } from "discord.js";
import { dirname, importx } from "@discordx/importer";
import { returnBotSetting } from "./util/botUtils.js";
import { AppDataSource } from "./data-source.js";

import config from "./data/bot-settings.json" assert { type: "json" };
let { guildId, token } = config;

AppDataSource.initialize()
    .then(() => {
        console.log("Connected to DB!")
    })
    .catch((error) => console.log(error))

if (returnBotSetting("environment") !== "production") {
    token = process.env.TOKEN || "";
    guildId = process.env.GUILDID || "";
}

export const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
    botGuilds: [guildId],
});

client.once("ready", async () => {
    await client.guilds.fetch();
    await client.initApplicationCommands({
        guild: { log: true },
        // global: { log: true },
    });
    await client.initApplicationPermissions(true);
    client.user!.setPresence({ activities: [{ name: `Counter Strike: Global Offensive` }], status: "online" });
    console.log("Ready!");
});

client.on("interactionCreate", (interaction: Interaction) => {
    client.executeInteraction(interaction);
});

client.on("messageCreate", (message: Message) => {
    client.executeCommand(message);
});

const start = async () => {
    await importx(dirname(import.meta.url) + "/{events,commands,api}/**/*.{ts,js}");

    await client.login(token);
};

start();
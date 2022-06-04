import fs from "fs";

/**
 * Returns a specific setting from bot-settings.json.
 */
export const returnBotSetting = (setting: string): string => {
    const settings = fs.readFileSync("./src/data/bot-settings.json", "utf-8");
    const parsedSettings = JSON.parse(settings);
    return settings ? parsedSettings[setting] : "Oops! You picked the wrong setting!"
}
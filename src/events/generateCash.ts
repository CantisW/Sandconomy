import { Client } from "discord.js";
import { Discord, On } from "discordx";
import { User } from "../entity/User.js";
import { getItemInfo } from "../util/economyUtil.js";

@Discord()
export class GenerateCash {
    @On("ready")
    async generateCash (
        client: Client, // Client instance injected here,
    ) {
        setInterval(async () => {
            let users = await User.createQueryBuilder("user").select("*").getRawMany();

            users.forEach(async (v) => {
                const user = await User.findOne({ where: { id: v.id } });
                if (!user!.inventory) return;
                user!.inventory.forEach(async (item) => {
                    const info = await getItemInfo(item.id);
                    if (info.effect === "generate") {
                        user!.cash = user!.cash + info.amount;
                        user!.save();
                    }
                })
            })
            console.log("ran");
        }, 10 * 1000 * 60);
    };   
}

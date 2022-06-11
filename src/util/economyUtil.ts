import { MessageEmbed } from "discord.js";
import { Item } from "../entity/Item.js";
import { Job } from "../entity/Job.js";
import { Message } from "../entity/Message.js";
import { Rob } from "../entity/Rob.js";
import { User } from "../entity/User.js";
import { IConfig } from "../types/types.js";
import { createEmbed, formatBalance, getConfig, parseBalance } from "./botUtils.js";

export const createJob = async (name: string, description: string, amount: number, selectiveness = 20, level = 0) => {
    const job = new Job();
    job.name = name;
    job.description = description;
    job.amount = parseBalance(amount);
    job.selectiveness = selectiveness;
    job.minimum_level = level;
    job.save();
    return true;
};

export const getJob = async (id: string, jobid: number) => {
    return new Promise(async (resolve, reject) => {
        const { workCooldown }: IConfig = getConfig();
        const cooldown = workCooldown * 1000 * 60 * 2;
        const job = await Job.findOne({ where: { id: jobid } });
        const user = await User.findOne({ where: { userid: id } });
        
        if (!job) return reject("This job doesn't exist!");
        if (!user) return reject("You don't have a bank account! Open one with /balance.");

        if (Number(user.last_applied) + cooldown > Date.now())
            return reject(`You need to wait ${workCooldown*2} minutes before applying to another job!`);
        if (user.employed)
            return reject("You wouldn't cheat on your employer, would you? (Pro tip: quit your job first!)");
        if (job.minimum_level > user.level)
            return reject("You don't have enough experience for this job! Try working harder.");
        if (job.selectiveness !== 20) {
            let rnd = Math.floor(Math.random() * 20);
            if (rnd <= job.selectiveness) {
                user.last_job = job;
                user.employed = true;
                user.last_applied = Date.now();
                user.save();
                resolve(true);
            } else {
                user.last_applied = Date.now();
                user.save();
                return reject("You didn't get hired this time around. Oh well...you should reflect on your mistakes.");
            }
        }
        user.last_job = job;
        user.employed = true;
        user.save();
        resolve(true);
    });
};

export const quitJob = async (id: string) => {
    const user = await User.findOne({ where: { userid: id } });
    if (!user) return false;
    if (!user.employed) return false;
    user.employed = false;
    user.save();
    return true;
};

export const getJobInfo = async (id: string) => {
    const user = await User.findOne({ where: { userid: id }, relations: ["last_job"] });
    return user!.last_job;
};

export const getEmploymentStatus = async (id: string) => {
    const user = await User.findOne({ where: { userid: id } });
    if (!user) return false;
    if (!user.employed) return false;
    return true;
};

export const createMessage = async (jobid: number, text: string, type = true) => {
    const job = await Job.findOne({ where: { id: jobid } });
    if (!job) return false;
    const message = new Message();
    message.text = text;
    message.job = job;
    message.type = type;
    message.save();
    return true;
};

export const work = async (id: string): Promise<MessageEmbed> => {
    return new Promise(async (resolve, reject) => {
        const { fine, workCooldown }: IConfig = getConfig();
        const cooldown = workCooldown * 1000 * 60;

        const user = await User.findOne({ where: { userid: id }, relations: ["last_job"] });
        if (!user) return reject("You can't work without a bank account! Create one with /balance.");

        if (Number(user.last_worked) + cooldown > Date.now())
            return reject(`You need to wait ${workCooldown} minutes before working again!`);

        const job = user.last_job;
        if (!job) return reject("You don't have a job!");

        const employed = user.employed;
        if (!employed) return reject("You don't have a job!");

        const messages = await Message.createQueryBuilder("message")
            .leftJoinAndSelect("message.job", "job")
            .where("job.id = :jobId", { jobId: job.id })
            .getMany();
        if (messages.length === 0) return reject("Your employer doesn't seem to need you right now.");

        let rnd = Math.round(Math.random() * messages.length - 1);
        let hours = Math.round(Math.random() * 9);

        if (hours <= 0) hours = 2;
        if (rnd < 0) rnd = 0;

        const selected = messages[rnd];
        const amount = parseBalance(job.amount * hours);

        if (!selected.type) {
            const lost = parseBalance(user.bank * (fine / 100));
            const bal = parseBalance(user.bank * ((100 - fine) / 100));
            user.bank = bal;
            user.last_worked = Date.now();
            user.times_worked = user.times_worked + 1;
            user.save();
            const embed = createEmbed(selected.text, `Amount lost: ${formatBalance(lost)}`, "RED");
            return resolve(embed);
        }

        user.cash = parseBalance(user.cash + amount);
        user.last_worked = Date.now();
        user.experience = user.experience + 1;
        user.times_worked = user.times_worked + 1;

        // handle leveling up

        const nextLevel = await xpUntilNextLevel(id);

        if (user.experience >= nextLevel) {
            user.level = user.level + 1;
            user.experience = 0;
            user.save();
            const embed = createEmbed(
                selected.text,
                `Amount earned: ${formatBalance(amount)} for ${hours} hours of work.\nYou also leveled up to level ${
                    user.level
                }. You should work harder, though.`,
                "GREEN",
            );
            return resolve(embed);
        }
        user.save();
        const embed = createEmbed(
            selected.text,
            `Amount earned: ${formatBalance(amount)} for ${hours} hours of work.`,
            "GREEN",
        );
        return resolve(embed);
    });
};

export const rob = async (id: string, robbed: string): Promise<MessageEmbed> => {
    return new Promise(async (resolve, reject) => {
        if (robbed === id) return reject("As much as you might want to, you cannot rob yourself!");

        const { fine, minRobPercentage, maxRobPercentage, robCooldown }: IConfig = getConfig();
        const cooldown = robCooldown * 1000 * 60;

        const user = await User.findOne({ where: { userid: id } });
        if (!user) return reject("You can't rob without a bank account! Create one with /balance.");

        const robbedUser = await User.findOne({ where: { userid: robbed } });
        if (!robbedUser) return reject("You cannot rob a user that doesn't exist!");

        const messages = await Rob.createQueryBuilder("rob").select("*").getRawMany();

        if (robbedUser.cash <= 0) return reject("Why would you rob a poor person? Heartless.");
        if (messages.length === 0)
            return reject("Uh...not sure what to say here because the idiot dev forgot to put rob messages!");

        if (Number(user.last_robbed) + cooldown > Date.now())
            return reject(`You need to wait ${robCooldown} minutes before robbing again!`);

        let rnd = Math.round(Math.random() * messages.length - 1);
        if (rnd < 0) rnd = 0;
        const selected = messages[rnd];

        const percentage = Math.round(Math.random() * (maxRobPercentage - minRobPercentage) + minRobPercentage) / 100;
        const robbedAmount = parseBalance(robbedUser.cash * percentage);

        if (!selected.type) {
            const lost = parseBalance(user.bank * (fine / 100));
            const bal = parseBalance(user.bank * ((100 - fine) / 100));
            user.bank = bal;
            user.last_robbed = Date.now();
            user.save();
            const embed = createEmbed(
                selected.text,
                `User attempted to robbed: <@${robbed}>\nAmount lost: ${formatBalance(lost)}`,
                "RED",
            );
            return resolve(embed);
        }
        user.cash = parseBalance(user.cash + robbedAmount);
        user.last_robbed = Date.now();
        robbedUser.cash = parseBalance(robbedUser.cash - robbedAmount);
        user.save();
        robbedUser.save();
        const embed = createEmbed(
            selected.text,
            `User robbed: <@${robbed}>\nAmount lost: ${formatBalance(robbedAmount)}`,
            "GREEN",
        );
        resolve(embed);
    });
};

export const createRobMessage = async (text: string, type = true) => {
    const rob = new Rob();
    rob.text = text;
    rob.type = type;
    rob.save();
    return true;
};

export const xpUntilNextLevel = async (id: string) => {
    const { experienceNeededMultiplier } = getConfig();
    const user = await User.findOne({ where: { userid: id } });
    if (!user) return 0;
    return Math.floor(experienceNeededMultiplier * (user.level + 1) ** (1 / 2));
};

export const flipCoin = async (id: string, amt: string, choice: string): Promise<MessageEmbed> => {
    return new Promise(async (resolve, reject) => {
        const user = await User.findOne({ where: { userid: id } });
        if (!user) return reject("You do not have a bank account to gamble with! Open one with /balance.");
        let amount = parseBalance(parseFloat(amt));
        if (!amount) return reject("You can't gamble that!");
        if (user.cash < parseBalance(amount)) return reject("You don't have this much to gamble!")

        const gamble = Math.round(Math.random())

        let num = 0;
        choice === "heads" ? num = 0 : num = 1;

        if (gamble === num) {
            user.cash = user.cash + parseBalance(amount);
            user.save();
            resolve(createEmbed(`You flipped ${choice}!`, `You won ${formatBalance(amount)}!`, "GREEN"));
        } else {
            user.cash = user.cash - parseBalance(amount);
            user.save();
            resolve(createEmbed(`You flipped ${num === 0 ? "tails" : "heads"}!`, `You lost ${formatBalance(amount)}!`, "RED"));
        }
    })
}

export const scratch = (id: string, choice: string): Promise<MessageEmbed> => {
    return new Promise(async (resolve, reject) => {
        const user = await User.findOne({ where: { userid: id } });
        if (!user) return reject("You do not have a bank account to gamble with! Open one with /balance.");

        let amount = parseBalance(parseInt(choice.replace('$', '')));

        if (user.cash < parseBalance(amount)) return reject("You don't have this much to gamble!")

        const highestValue = amount * 100; // if 5, then 500, etc.
        const { scratcherChance } = getConfig();
        const baseProbability = scratcherChance;
        const secondaryProbability = baseProbability * ((amount * 6)/highestValue);
        const jackpotProbability = 1/(highestValue*10); // probability for jackpot! (if 5, then 1/5000)
        const value = Math.random();

        if (value < jackpotProbability) {
            // JACKPOT!
            user.cash = user.cash - parseBalance(amount);
            user.cash = user.cash + parseBalance(highestValue);
            user.save();
            resolve(createEmbed("JACKPOT!", `You won ${formatBalance(highestValue)}! Wow! Losing your entire life savings really paid off!`, "YELLOW"));
        } else if (value < secondaryProbability) {
            // some mid tier prizes
            let mult = Math.round(Math.random() * 20)
            if (mult < 10) mult = 10;
            let money = amount * mult;
            user.cash = user.cash - parseBalance(amount);
            user.cash = user.cash + parseBalance(money);
            user.save();
            resolve(createEmbed("Rare Winner!", `You won ${formatBalance(money)}!`, "GREEN"));
        } else if (value < baseProbability) {
            let mult = Math.round(Math.random() * 10)
            if (mult <= 0) mult = 1;
            let money = (amount/2) * mult;
            user.cash = user.cash - parseBalance(amount);
            user.cash = user.cash + parseBalance(money);
            user.save();
            resolve(createEmbed("Winner!", `You won ${formatBalance(money)}! What a large sum of money!`, "GREEN"));
        } else {
            user.cash = user.cash - parseBalance(amount);
            user.save();
            resolve(createEmbed("Loser!", `You didn't win anything this time. Oh well.`, "RED"));
        }
    })
}

export const transfer = (id: string, receiver: string, amt: string): Promise<MessageEmbed> => {
    return new Promise (async (resolve, reject) => {
        if (receiver === id) return reject("You can't transfer to yourself!");

        const user = await User.findOne({ where: { userid: id } });
        if (!user) return reject("You do not have a bank account to transfer with! Open one with /balance.");
        const recepient = await User.findOne({ where: { userid: receiver } });
        if (!recepient) return reject("This user doesn't have a bank account!");

        let amount = parseBalance(parseFloat(amt));
        if (!amount) return reject("You can't transfer that!");

        if (user.cash < parseBalance(amount) || amount === 0) return reject("You don't have this much to transfer! (Pro tip: you can only transfer cash)")

        user.cash = user.cash - amount;
        recepient.cash = recepient.cash + amount;
        user.save();
        recepient.save();
        resolve(createEmbed("Transaction Successful", `You successfully transferred ${formatBalance(amount)} to <@${receiver}>!`, "ORANGE"))
    })
}

export const createItem = (name: string, description: string, price: number, effect: string, duration: number, amount?: number) => {
    const item = new Item()
    item.name = name;
    item.description = description;
    item.price = price;
    item.effect = effect;
    item.duration = duration ? duration : 0;
    item.amount = amount ? amount : 0;
    item.save()
    return true;
}

export const buyItem = (id: string, itemId: number): Promise<MessageEmbed> => {
    return new Promise(async (resolve, reject) => {
        const user = await User.findOne({ where: { userid: id } });
        if (!user) return reject("You don't have a bank account! Create one with /balance.");
        const item = await Item.findOne({ where: { id: itemId } });
        if (!item) return reject("This item doesn't exist!");
        if (user.cash < item.price) return reject("You cannot afford this item! Get richer!");

        let found = false;
        let foundId = 0;

        const obj = { id: itemId, quantity: 1 }

        if (user.inventory) {
            user.inventory.forEach((inv, i) => {
                if (itemId === inv.id) {
                    found = true;
                    foundId = i;
                }
            })
        } else {
            user.inventory = [];
        }

        if (found) {
            if (item.effect === "generate") return reject("You already own this generator!");
            user.inventory[foundId].quantity = user.inventory[foundId].quantity + 1;
            user.cash = user.cash - item.price;
            user.save();
            return resolve(createEmbed("Item Bought", `You successfully bought 1 ${item.name}!`, "YELLOW"))
        }
        user.inventory.push(obj);
        user.cash = user.cash - item.price;
        user.save();
        resolve(createEmbed("Item Bought", `You successfully bought 1 ${item.name}!`, "YELLOW"))
    })
}

export const getItemInfo = async (id: number) => {
    let obj = { id: 0, name: "", description: "", price: 0, effect: "", duration: 0, amount: 0 };

    const item = await Item.findOne({ where: { id: id } });
    if (!item) return obj;
    const name = item.name;
    const description = item.description;
    const price = item.price;
    const effect = item.effect;
    const duration = item.duration;
    const amount = item.amount;
    obj = { id: item.id, name: name, description: description, price: price, effect: effect, duration: duration, amount: amount };
    return obj;
};

export const useItem = async (id: string, itemId: number): Promise<MessageEmbed> => {
    return new Promise(async (resolve, reject) => {
        const user = await User.findOne({ where: { userid: id } });
        if (!user) return reject("You don't have a bank account! Create one with /balance.");
        const item = await Item.findOne({ where: { id: itemId } });
        if (!item) return reject("This item doesn't exist!");
        if (!user.inventory) return reject("You don't own any items!")

        let found = false;
        let foundId = 0;

        user.inventory.forEach((inv, i) => {
            if (itemId === inv.id) {
                found = true;
                foundId = i;
            }
        })

        if (!found) return reject("You don't own this item!")

        if (user.inventory[foundId].quantity === 1 && item.effect !== "generate") {
            user.inventory = user.inventory.filter(item => item.id !== itemId);
        } else if (item.effect !== "generate") {
            user.inventory[foundId].quantity = user.inventory[foundId].quantity - 1
        } else {
            return reject("Generators are automatically used once bought!")
        }

        switch (item.effect) {
            case "mute":
                break;
        }
        resolve(createEmbed("Item Used", `You have successfully used a ${item.name}!`, "YELLOW"))
    })
};
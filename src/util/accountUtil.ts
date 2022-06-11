import { User } from "../entity/User.js";
import { parseBalance, sanitizeId } from "./botUtils.js";

/**
 * Check if an account exists in the database. If not, create one.
 * @param id
 * @returns boolean
 */
export const CheckIfAccountExists = async (id: string) => {
    const user = await User.findOne({ where: { userid: sanitizeId(id) } });
    if (!user) {
        const user = new User();
        user.userid = sanitizeId(id);
        user.balance = 0;
        user.cash = 0;
        user.bank = 0;
        user.save();
    }
    return true;
};

/**
 * Get info for an account. Designed for use within command files.
 */
export const GetAccountInfo = async (id: string) => {
    const obj = { balance: 0, cash: 0, bank: 0, xp: 0, level: 0, timesWorked: 0, inventory: [] };

    const user = await User.findOne({ where: { userid: sanitizeId(id) } });
    if (!user) return obj;
    const bal = parseBalance(user.cash + user.bank);
    const cash = parseBalance(user.cash);
    const bank = parseBalance(user.bank);
    const xp = user.experience;
    const level = user.level;
    const timesWorked = user.times_worked;
    const inventory = user.inventory;
    const info = { balance: bal, cash: cash, bank: bank, xp: xp, level: level, timesWorked: timesWorked, inventory: inventory };
    user.balance = bal;
    user.save();
    return info;
};

export const DepositCash = async (id: string, amt?: string) => {
    let amount = 0;
    const user = await User.findOne({ where: { userid: id } });
    if (!user) return false;
    const { cash } = await GetAccountInfo(id);
    if (!amt) {
        amount = parseBalance(cash);
    } else {
        amount = parseBalance(parseFloat(amt));
    }
    if (!amount) return false;
    if (parseBalance(amount) > user.cash || amount === 0) return false;
    user.cash = parseBalance(user.cash - amount);
    user.bank = parseBalance(user.bank + amount);
    user.save();
    return true;
};

export const WithdrawCash = async (id: string, amt?: string) => {
    let amount = 0;
    const user = await User.findOne({ where: { userid: id } });
    if (!user) return false;
    const { bank } = await GetAccountInfo(id);
    if (!amt) {
        amount = parseBalance(bank);
    } else {
        amount = parseBalance(parseFloat(amt));
    }
    if (!amount) return false;
    if (amount > user.bank || amount === 0) return false;
    user.cash = parseBalance(user.cash + amount);
    user.bank = parseBalance(user.bank - amount);
    user.save();
    return true;
};
export interface IAccount {
    id: number;
    userid: string;
    balance: number;
    cash: number;
    bank: number;
    last_job: string;
    employed: boolean;
    times_worked: number;
    experience: number;
    level: number;
    last_worked: number;
    last_robbed: number;
    last_applied: number;
    created: Date;
}

export interface IPagnationArray {
    user: string;
    command: string;
    index: number;
}

export interface IJob {
    id: number;
    name: string;
    description: string;
    amount: number;
    selectiveness: number;
    minimum_level: number;
}

export interface IConfig {
    currencyName: string;
    fine: number;
    minRobPercentage: number;
    maxRobPercentage: number;
    workCooldown: number;
    robCooldown: number;
    experienceNeededMultiplier: number;
    scratcherChance: number;
}

export interface IItem {
    id: number;
    name: string;
    description: string;
    price: number;
    effect?: string;
    duration?: number;
    amount?: number;
}

export interface IInventoryItem {
    id: number;
    quantity: number;
}


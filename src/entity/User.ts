import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { IInventoryItem, IItem } from "../types/types.js";
import { Job } from "./Job.js";

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userid: string;

    @Column({ type: "float" })
    balance: number;

    @Column({ type: "float" })
    cash: number;

    @Column({ type: "float" })
    bank: number;

    @ManyToOne(() => Job)
    @JoinColumn()
    last_job: Job;

    @Column({ default: false })
    employed: boolean;

    @Column({ default: 0 })
    times_worked: number;

    @Column({ default: 0 })
    experience: number;

    @Column({ default: 0 })
    level: number;

    @Column({ type: "bigint", default: 0 })
    last_worked: number;

    @Column({ type: "bigint", default: 0 })
    last_robbed: number;

    @Column({ type: "bigint", default: 0 })
    last_applied: number;

    @Column({ type: "simple-json", nullable: true })
    inventory: IInventoryItem[];

    @CreateDateColumn()
    created: Date;
}

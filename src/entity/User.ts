import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
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

    @CreateDateColumn()
    created: Date;
}

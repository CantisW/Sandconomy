import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Item extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column({ type: "float" })
    price: number;
    
    @Column()
    effect: string;

    @Column()
    duration: number;

    @Column({ default: 0 })
    amount: number;
}
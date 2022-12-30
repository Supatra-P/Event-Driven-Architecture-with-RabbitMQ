import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Song {
    @PrimaryGeneratedColumn()
    id: string;

    @Column({unique: true})
    producer_id: number;

    @Column()
    title: string;

    @Column()
    artist: string;

}
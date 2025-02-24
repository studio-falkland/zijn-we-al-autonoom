import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { DestinationDataset } from '../hierarchy.js';

@Entity()
@Unique("aggregate_unique", ["type", "label", "date"])
export default class Aggregate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    type: DestinationDataset;

    @Column('text')
    label: string;

    @Column('real')
    fraction: number;

    @Column('int')
    quantity: number;

    @Column({ type: 'date', nullable: true })
    date?: Date;

    @Column('int', { nullable: true })
    asn: number | null;

    @Column('text', { nullable: true })
    as_organisation?: string;
        
    @Column('text', { nullable: true })
    as_country_code?: string;

    @Column({ type: 'datetime', default: () => 'datetime(\'now\')' })
    created_at: Date;
}
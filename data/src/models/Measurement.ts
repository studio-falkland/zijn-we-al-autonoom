import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import MeasurementError from './MeasurementError.js';
import URL from './URL.js';

@Entity()
export default class Measurement {
    @PrimaryGeneratedColumn()
    id: number;

    /** The URL that is being measured */
    @ManyToOne(() => URL, (url) => url.measurements, { nullable: false })
    @JoinColumn({ name: 'url', referencedColumnName: 'url' })
    url: Relation<URL>;

    /** The type of measurement being carried out */
    @Column('text')
    type: string;

    /** The actual data that is measured */
    @Column('text')
    data: string;

    @Column('text', { nullable: true })
    ip?: string;
    
    @Column('text', { nullable: true })
    domain_name?: string;

    @Column('int', { nullable: true })
    asn?: number;

    @Column('text', { nullable: true })
    as_organisation?: string;

    @Column('text', { nullable: true })
    country_code?: string;

    @OneToOne(() => MeasurementError, { nullable: true })
    @JoinColumn({ name: 'error', referencedColumnName: 'id' })
    error: Relation<MeasurementError> | null;

    @Column({ type: 'datetime', default: () => 'datetime(\'now\')' })
    created_at: Date;
}

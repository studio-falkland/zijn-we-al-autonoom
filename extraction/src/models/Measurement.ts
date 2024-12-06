import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import MeasurementError from './MeasurementError.js';
import URL from './URL.js';

@Entity()
export default class Measurement {
    @PrimaryGeneratedColumn()
    id: number;

    /** The URL that is being measured */
    @ManyToOne(() => URL, (url) => url.measurements, { nullable: false })
    @JoinColumn({ name: 'url', referencedColumnName: 'url',  })
    url: string;

    /** The type of measurement being carried out */
    @Column('text')
    type: string;

    /** The actual data that is measured */
    @Column('text')
    data: string;

    @OneToOne(() => MeasurementError, { nullable: true })
    @JoinColumn({ name: 'error', referencedColumnName: 'id' })
    error: MeasurementError;
        
    @Column({ type: 'datetime', default: () => 'datetime(\'now\')' })
    created_at: Date;
}
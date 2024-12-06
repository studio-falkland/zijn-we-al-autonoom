import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import URL from './URL.js';
import Measurement from './Measurement.js';

@Entity()
export default class MeasurementError {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    error: string;

    @Column('text')
    stack: string;

    @OneToOne(() => Measurement, (measurement) => measurement.error)
    measurement: Measurement;
        
    @Column({ type: 'datetime', default: () => 'datetime(\'now\')' })
    created_at: Date;
}
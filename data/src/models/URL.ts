import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import Organisation from './Organisation.js';
import Measurement from './Measurement.js';

@Entity()
export default class URL {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', unique: true })
    url: string;

    @OneToOne(() => Organisation)
    @JoinColumn({ name: 'organisation', referencedColumnName: 'slug' })
    organisation: string;

    /** Whether the URL is currently reachable and in use */
    @Column({ type: 'boolean', default: true })
    alive: boolean;

    @Column({ type: 'datetime', default: () => 'datetime(\'now\')' })
    created_at: Date;

    @Column({ type: 'datetime', default: () => 'datetime(\'now\')' })
    updated_at: Date;

    @OneToMany(() => Measurement, (measurement) => measurement.url)
    measurements: Measurement[];
}

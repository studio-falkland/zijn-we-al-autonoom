import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Organisation from './Organisation.js';

@Entity()
export default class Dataset {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', unique: true })
    name: string;

    @Column('text')
    source: string;

    @Column('text')
    cacheKey: string;
    
    @Column({ type: 'datetime', default: () => 'datetime(\'now\')' })
    created_at: Date;
    
    @Column({ type: 'datetime', default: () => 'datetime(\'now\')' })
    updated_at: Date;

    @OneToMany(() => Organisation, (organisation) => organisation.dataset)
    organisations: Organisation[];
}
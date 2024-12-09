import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import URL from './URL.js';
import Dataset from './Dataset.js';
import OrganisationClassification from './Classification.js';

@Entity()
export default class Organisation {
    @PrimaryGeneratedColumn()
    id: number;

    /** The full name for the organisation */
    @Column({ type: 'text' })
    name: string;

    /** A unique, navigable slug for the organisation */
    @Column({ type: 'text', unique: true })
    slug: string;

    /** The street address for the organsiation */
    @Column({ type: 'text', nullable: true })
    address: string;

    /** The city in which the organsiation is located */
    @Column({ type: 'text', nullable: true })
    city: string;

    /** The postcode for the organisation */
    @Column({ type: 'text', nullable: true })
    postcode: string;

    /** The latitude for the organisation */
    @Column({ nullable: true, type: 'float' })
    lat: number;

    /** The longitude for the organsiation */
    @Column({ nullable: true, type: 'float' })
    lng: number;

    /** Whether the organisation is active or not */
    @Column({ type: 'boolean', default: true })
    active: boolean;

    @Column({ type: 'datetime', default: () => 'datetime(\'now\')' })
    created_at: Date;

    @Column({ type: 'datetime', default: () => 'datetime(\'now\')' })
    updated_at: Date;

    @OneToOne(() => URL, (url) => url.organisation)
    url: URL;

    @ManyToOne(() => Dataset, (dataset) => dataset.organisations)
    @JoinColumn({ name: 'dataset', referencedColumnName: 'name' })
    dataset: Dataset;

    @OneToMany(() => OrganisationClassification, (classification) => classification.organisation)
    classifications: OrganisationClassification[];
}

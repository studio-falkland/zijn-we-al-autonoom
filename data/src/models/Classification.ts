import { Category, Region, sectors, Sectors } from '../hierarchy.js';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation, Unique } from 'typeorm';
import Organisation from './Organisation.js';

@Entity('organisation_classification')
@Unique(['organisation', 'region', 'category'])
export default class OrganisationClassification {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Organisation, (organisation) => organisation.classifications)
    @JoinColumn({ name: 'organisation', referencedColumnName: 'slug' })
    organisation: Relation<Organisation>;

    /** Whether the organisation addresses a national or local market */
    @Column({
        type: 'simple-enum',
        enum: Region,
    })
    region: Region;

    /** A category for this organisation */
    @Column({
        type: 'simple-enum',
        enum: Category,
    })
    category: Category;

    /** A subcategory for the organisation */
    @Column({
        type: 'simple-enum',
        enum: sectors.flatMap((e) => Object.values(e)),
    })
    sector: Sectors;
}

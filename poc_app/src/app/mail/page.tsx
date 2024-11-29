import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import db from '@/lib/database';
import { groups } from 'd3-array';

export interface Row {
    id: number
    url: string
    type: string
    measurement: string
    category: string
    name: string
}

export default function Mail() {
    const result = db.prepare(`
        SELECT
            measurements.*,
            urls.category,
            organisations.name
        FROM
            measurements
            LEFT JOIN urls ON measurements.url = urls.url
            LEFT JOIN organisations ON organisations.id = urls.organisation_id
        WHERE
            TYPE = 'mx-root'
    `).all() as Row[];

    const categories = groups(result, (r: Row) => r.category);

    return (
       <div className="grid">
            {categories.map(([category, rows]) => {
                const frequencies: Record<string, number> = {};
                rows.forEach((r: Row) => frequencies[r.measurement] = (frequencies[r.measurement] || 0) + 1);
                const modalFrequency = Math.max(...Object.values(frequencies));
                const variationRatio = 1 - (modalFrequency / rows.length);

                return (
                    <Card key={category} className="max-w-[300px]">
                        <CardHeader>{category}</CardHeader>
                        <div>
                            <div className="w-[100px] h-8 border rounded relative">
                                <div
                                    className="h-full bg-orange-400"
                                    style={{ width: (variationRatio * 100).toFixed(0) + '%' }}
                                />
                                <span className="absolute inset-0 text-center">{variationRatio.toFixed(2)}</span>
                            </div>
                        </div>
                        <CardDescription>{JSON.stringify(frequencies)}</CardDescription>
                    </Card>
                )
            })}
       </div>
    );
}

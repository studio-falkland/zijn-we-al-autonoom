import db from '@are-we-dependent/data';

db.setOptions({
    migrations: undefined
});
await db.initialize();

export default db;
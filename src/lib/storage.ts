import { openDB, DBSchema } from 'idb';

interface Route {
    id: string;
    name: string;
    points: [number, number][]; // [lat, lng]
    createdAt: number;
    distance: number; // meters
    type: 'hiking' | 'cycling' | 'car';
}

interface AppDB extends DBSchema {
    routes: {
        key: string;
        value: Route;
        indexes: { 'by-date': number };
    };
}

const DB_NAME = 'rutas-espana-db';

export async function initDB() {
    return openDB<AppDB>(DB_NAME, 1, {
        upgrade(db) {
            const store = db.createObjectStore('routes', { keyPath: 'id' });
            store.createIndex('by-date', 'createdAt');
        },
    });
}

export async function saveRoute(route: Route) {
    const db = await initDB();
    return db.put('routes', route);
}

export async function getRoutes() {
    const db = await initDB();
    return db.getAllFromIndex('routes', 'by-date');
}

export async function deleteRoute(id: string) {
    const db = await initDB();
    return db.delete('routes', id);
}

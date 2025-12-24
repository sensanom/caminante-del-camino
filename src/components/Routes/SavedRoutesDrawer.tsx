'use client';

import { useState, useEffect } from 'react';
import { getRoutes, deleteRoute, saveRoute } from '@/lib/storage';
import { X, Trash, Eye, Map as MapIcon, Upload } from 'lucide-react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { parseGPX, haversineDistance } from '@/lib/geo';

export default function SavedRoutesDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const [routes, setRoutes] = useState<any[]>([]);
    const map = useMap();
    const [activeRouteLayer, setActiveRouteLayer] = useState<L.Polyline | null>(null);

    const loadRoutes = async () => {
        const r = await getRoutes();
        setRoutes(r);
    };

    useEffect(() => {
        if (isOpen) {
            loadRoutes();
        }
    }, [isOpen]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("¿Borrar ruta?")) {
            await deleteRoute(id);
            loadRoutes();
        }
    };

    const handleView = (route: any) => {
        // Remove previous layer if exists
        if (activeRouteLayer) {
            activeRouteLayer.remove();
        }

        const polyline = L.polyline(route.points, { color: 'blue', weight: 5 }).addTo(map);
        map.flyToBounds(polyline.getBounds());
        setActiveRouteLayer(polyline);
        setIsOpen(false);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const points = parseGPX(text);

        if (points.length === 0) {
            alert("No se encontraron puntos en el archivo GPX.");
            return;
        }

        const dist = haversineDistance(points);
        const name = file.name.replace('.gpx', '');

        await saveRoute({
            id: crypto.randomUUID(),
            name,
            points,
            createdAt: Date.now(),
            distance: Math.round(dist),
            type: 'hiking'
        });

        loadRoutes();
        alert("Ruta importada correctamente.");
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-20 right-4 z-[1000] p-3 bg-white dark:bg-black dark:text-white rounded-full shadow-lg"
                title="Mis Rutas"
            >
                <MapIcon size={24} />
            </button>

            {/* Drawer Overlay */}
            <div
                className={`fixed inset-y-0 right-0 z-[2000] w-full sm:w-80 bg-white dark:bg-zinc-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="p-4 flex items-center justify-between border-b dark:border-zinc-800">
                    <h2 className="text-xl font-bold">Mis Rutas</h2>
                    <div className="flex gap-2">
                        <label className="cursor-pointer bg-secondary text-white px-3 py-1 rounded text-sm hover:bg-opacity-90 flex items-center gap-1">
                            <input type="file" accept=".gpx" className="hidden" onChange={handleImport} />
                            <span>Importar GPX</span>
                        </label>
                        <button onClick={() => setIsOpen(false)}><X /></button>
                    </div>
                </div>

                <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
                    {routes.length === 0 ? (
                        <p className="text-gray-500 text-center mt-10">No hay rutas guardadas.</p>
                    ) : (
                        <ul className="space-y-3">
                            {routes.map(route => (
                                <li key={route.id} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg flex flex-col gap-2 cursor-pointer hover:ring-2 ring-primary" onClick={() => handleView(route)}>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold">{route.name}</h3>
                                        <button onClick={(e) => handleDelete(route.id, e)} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash size={16} /></button>
                                    </div>
                                    <div className="text-xs text-gray-500 flex gap-2">
                                        <span>{(route.distance / 1000).toFixed(2)} km</span>
                                        <span>•</span>
                                        <span>{new Date(route.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}

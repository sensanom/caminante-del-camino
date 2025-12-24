'use client';

import { useMap, Marker, Polyline, Popup } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { saveRoute } from '@/lib/storage';
import { LatLng } from 'leaflet';
import { Save, Trash, MapPin } from 'lucide-react';

export default function RouteEditor() {
    const map = useMap();
    const [points, setPoints] = useState<LatLng[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (!isDrawing) return;

        const handleClick = (e: any) => {
            setPoints(prev => [...prev, e.latlng]);
        };

        map.on('click', handleClick);
        return () => {
            map.off('click', handleClick);
        };
    }, [map, isDrawing]);

    const handleSave = async () => {
        const name = prompt("Nombre de la ruta:");
        if (!name) return;

        // Calculate approx distance
        let dist = 0;
        for (let i = 0; i < points.length - 1; i++) {
            dist += points[i].distanceTo(points[i + 1]);
        }

        const routeData = {
            id: crypto.randomUUID(),
            name,
            points: points.map(p => [p.lat, p.lng] as [number, number]),
            createdAt: Date.now(),
            distance: Math.round(dist),
            type: 'hiking' as const // default
        };

        await saveRoute(routeData);
        alert("Ruta guardada!");
        setPoints([]);
        setIsDrawing(false);
    };

    return (
        <>
            {/* Floating Controls */}
            <div className="absolute bottom-20 right-4 z-[1000] flex flex-col gap-2">
                <button
                    onClick={() => setIsDrawing(!isDrawing)}
                    className={`p-3 rounded-full shadow-lg transition-colors ${isDrawing ? 'bg-accent text-white' : 'bg-white dark:bg-black dark:text-white'}`}
                    title={isDrawing ? "Terminar dibujo" : "Crear nueva ruta"}
                >
                    <MapPin size={24} />
                </button>

                {points.length > 0 && (
                    <>
                        <button
                            onClick={handleSave}
                            className="p-3 bg-primary text-white rounded-full shadow-lg"
                            title="Guardar ruta"
                        >
                            <Save size={24} />
                        </button>
                        <button
                            onClick={() => setPoints([])}
                            className="p-3 bg-red-500 text-white rounded-full shadow-lg"
                            title="Borrar dibujo"
                        >
                            <Trash size={24} />
                        </button>
                    </>
                )}
            </div>

            {/* Drawn User Route */}
            {points.length > 0 && (
                <Polyline positions={points} color="red" weight={4} dashArray="5, 10" />
            )}

            {points.map((p, idx) => (
                <Marker key={idx} position={p} opacity={0.6}>
                    {idx === 0 && <Popup>Inicio</Popup>}
                    {idx === points.length - 1 && <Popup>Fin</Popup>}
                </Marker>
            ))}
        </>
    );
}

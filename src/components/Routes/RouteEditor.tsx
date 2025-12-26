'use client';

import { useMap, Marker, Polyline, Popup } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { saveRoute } from '@/lib/storage';
import { LatLng, Icon, DivIcon } from 'leaflet';
import { Save, Trash, MapPin, Route, Pencil } from 'lucide-react';
import { calculateRoute, formatDistance, formatDuration, getRouteColor, RoutingProfile } from '@/lib/routing';

type DrawMode = 'none' | 'auto' | 'manual';

// Custom icons for start and end markers
const createStartIcon = () => new DivIcon({
    html: `<div style="background: #22c55e; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
    </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

const createEndIcon = () => new DivIcon({
    html: `<div style="background: #ef4444; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
    </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

export default function RouteEditor() {
    const map = useMap();
    const [mode, setMode] = useState<DrawMode>('none');
    const [waypoints, setWaypoints] = useState<LatLng[]>([]);
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
    const [distance, setDistance] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [routeType, setRouteType] = useState<'hiking' | 'cycling' | 'car'>('hiking');
    const [isCalculating, setIsCalculating] = useState(false);

    // Handle map clicks based on mode
    useEffect(() => {
        if (mode === 'none') return;

        const handleClick = async (e: any) => {
            const newPoint = e.latlng;

            if (mode === 'auto') {
                // Auto mode: max 2 points (start and end)
                if (waypoints.length >= 2) {
                    // Reset and start new route
                    setWaypoints([newPoint]);
                    setRouteCoordinates([]);
                    setDistance(0);
                    setDuration(0);
                } else {
                    const newWaypoints = [...waypoints, newPoint];
                    setWaypoints(newWaypoints);

                    // Calculate route when we have 2 points
                    if (newWaypoints.length === 2) {
                        setIsCalculating(true);
                        const points: [number, number][] = newWaypoints.map(p => [p.lat, p.lng]);
                        const profile: RoutingProfile = routeType === 'hiking' ? 'foot' : routeType === 'cycling' ? 'bike' : 'car';

                        const result = await calculateRoute(points, profile);

                        if (result.success) {
                            setRouteCoordinates(result.coordinates);
                            setDistance(result.distance);
                            setDuration(result.duration);
                        } else {
                            // Fallback to straight line
                            setRouteCoordinates(points);
                            setDistance(result.distance);
                            alert('No se pudo calcular la ruta automática. Se muestra línea recta.');
                        }
                        setIsCalculating(false);
                    }
                }
            } else if (mode === 'manual') {
                // Manual mode: unlimited points
                const newWaypoints = [...waypoints, newPoint];
                setWaypoints(newWaypoints);

                // Update route coordinates and distance
                const coords: [number, number][] = newWaypoints.map(p => [p.lat, p.lng]);
                setRouteCoordinates(coords);

                // Calculate distance
                let dist = 0;
                for (let i = 0; i < newWaypoints.length - 1; i++) {
                    dist += newWaypoints[i].distanceTo(newWaypoints[i + 1]);
                }
                setDistance(dist);
            }
        };

        map.on('click', handleClick);
        return () => {
            map.off('click', handleClick);
        };
    }, [map, mode, waypoints, routeType]);

    const handleSave = async () => {
        const name = prompt("Nombre de la ruta:");
        if (!name) return;

        const routeData = {
            id: crypto.randomUUID(),
            name,
            points: routeCoordinates,
            createdAt: Date.now(),
            distance: Math.round(distance),
            type: routeType
        };

        await saveRoute(routeData);
        alert("¡Ruta guardada!");
        handleClear();
    };

    const handleClear = () => {
        setWaypoints([]);
        setRouteCoordinates([]);
        setDistance(0);
        setDuration(0);
        setMode('none');
    };

    const toggleMode = (newMode: DrawMode) => {
        if (mode === newMode) {
            handleClear();
        } else {
            setWaypoints([]);
            setRouteCoordinates([]);
            setDistance(0);
            setDuration(0);
            setMode(newMode);
        }
    };

    const routeColor = getRouteColor(routeType);

    return (
        <>
            {/* Floating Controls */}
            <div className="absolute bottom-20 right-4 z-[1000] flex flex-col gap-2">
                {/* Auto Route Button */}
                <button
                    onClick={() => toggleMode('auto')}
                    className={`p-3 rounded-full shadow-lg transition-all ${mode === 'auto'
                            ? 'bg-blue-500 text-white scale-110'
                            : 'bg-white dark:bg-black dark:text-white hover:scale-105'
                        }`}
                    title="Ruta automática (sigue caminos reales)"
                >
                    <Route size={24} />
                </button>

                {/* Manual/Pencil Draw Button */}
                <button
                    onClick={() => toggleMode('manual')}
                    className={`p-3 rounded-full shadow-lg transition-all ${mode === 'manual'
                            ? 'bg-purple-500 text-white scale-110'
                            : 'bg-white dark:bg-black dark:text-white hover:scale-105'
                        }`}
                    title="Dibujo manual (para caminos rurales)"
                >
                    <Pencil size={24} />
                </button>

                {/* Save and Clear buttons - only show when there's a route */}
                {routeCoordinates.length > 0 && (
                    <>
                        <button
                            onClick={handleSave}
                            className="p-3 bg-green-500 text-white rounded-full shadow-lg hover:scale-105 transition-all"
                            title="Guardar ruta"
                        >
                            <Save size={24} />
                        </button>
                        <button
                            onClick={handleClear}
                            className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:scale-105 transition-all"
                            title="Borrar ruta"
                        >
                            <Trash size={24} />
                        </button>
                    </>
                )}
            </div>

            {/* Route Type Selector - show when in drawing mode */}
            {mode !== 'none' && (
                <div className="absolute top-20 left-4 z-[1000] bg-white/95 dark:bg-black/90 backdrop-blur rounded-lg shadow-lg p-3">
                    <div className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Tipo de ruta:</div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setRouteType('hiking')}
                            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${routeType === 'hiking'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            🥾 Senderismo
                        </button>
                        <button
                            onClick={() => setRouteType('cycling')}
                            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${routeType === 'cycling'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            🚴 Ciclismo
                        </button>
                        <button
                            onClick={() => setRouteType('car')}
                            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${routeType === 'car'
                                    ? 'bg-gray-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            🚗 Coche
                        </button>
                    </div>
                </div>
            )}

            {/* Distance Display - show when there's a route */}
            {distance > 0 && (
                <div className="absolute top-4 right-4 z-[1000] bg-white/95 dark:bg-black/90 backdrop-blur rounded-lg shadow-lg p-4">
                    <div className="text-2xl font-bold" style={{ color: routeColor }}>
                        {formatDistance(distance)}
                    </div>
                    {duration > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            ⏱️ {formatDuration(duration)}
                        </div>
                    )}
                    {mode === 'auto' && waypoints.length === 1 && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Haz clic en el destino
                        </div>
                    )}
                </div>
            )}

            {/* Calculating indicator */}
            {isCalculating && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white/95 dark:bg-black/90 backdrop-blur rounded-lg shadow-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <div className="text-sm font-medium">Calculando ruta...</div>
                    </div>
                </div>
            )}

            {/* Route Polyline */}
            {routeCoordinates.length > 0 && (
                <Polyline
                    positions={routeCoordinates}
                    color={routeColor}
                    weight={5}
                    opacity={0.8}
                    dashArray={mode === 'manual' ? '10, 5' : undefined}
                />
            )}

            {/* Start Marker */}
            {waypoints.length > 0 && (
                <Marker position={waypoints[0]} icon={createStartIcon()}>
                    <Popup>
                        <strong>Inicio</strong>
                        <br />
                        {waypoints[0].lat.toFixed(5)}, {waypoints[0].lng.toFixed(5)}
                    </Popup>
                </Marker>
            )}

            {/* End Marker */}
            {waypoints.length > 1 && (
                <Marker position={waypoints[waypoints.length - 1]} icon={createEndIcon()}>
                    <Popup>
                        <strong>Fin</strong>
                        <br />
                        {waypoints[waypoints.length - 1].lat.toFixed(5)}, {waypoints[waypoints.length - 1].lng.toFixed(5)}
                        {distance > 0 && (
                            <>
                                <br />
                                <strong>Distancia:</strong> {formatDistance(distance)}
                            </>
                        )}
                    </Popup>
                </Marker>
            )}

            {/* Intermediate waypoints for manual mode */}
            {mode === 'manual' && waypoints.slice(1, -1).map((point, idx) => (
                <Marker
                    key={idx}
                    position={point}
                    opacity={0.6}
                >
                    <Popup>Punto {idx + 2}</Popup>
                </Marker>
            ))}
        </>
    );
}

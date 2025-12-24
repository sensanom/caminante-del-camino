'use client';

import { useMap, Marker, Popup, LayersControl, LayerGroup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { fetchPOIs, fetchCamperSpots, POI } from '@/lib/overpass';
import L from 'leaflet';
import { useDebounce } from '@/hooks/useDebounce'; // We need this hook

// Icons configuration (using simple emojis or default marker with colors for MVP)
const createIcon = (color: string) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const icons = {
    water: createIcon('blue'),
    camper: createIcon('green'),
    supermarket: createIcon('orange'),
    default: createIcon('grey')
};

export default function POILayers() {
    const map = useMap();
    const [waterPoints, setWaterPoints] = useState<POI[]>([]);
    const [camperSpots, setCamperSpots] = useState<POI[]>([]);
    const [shops, setShops] = useState<POI[]>([]);

    // Debounce fetching on move
    // Simple "on move end" logic

    const refreshPOIs = async () => {
        const bounds = map.getBounds();
        const b = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
        };

        // Safety check: don't fetch if zoom is too low (country level)
        if (map.getZoom() < 12) return;

        // Parallel fetch
        const [water, camper, food] = await Promise.all([
            fetchPOIs(b, 'amenity=drinking_water'),
            fetchCamperSpots(b),
            fetchPOIs(b, 'shop=supermarket')
        ]);

        setWaterPoints(water);
        setCamperSpots(camper);
        setShops(food);
    };

    useEffect(() => {
        map.on('moveend', refreshPOIs);
        return () => {
            map.off('moveend', refreshPOIs);
        };
    }, [map]);

    return (
        <LayersControl position="topright">
            <LayersControl.Overlay checked name="🚐 Áreas Autocaravana">
                <LayerGroup>
                    {camperSpots.map(p => (
                        <Marker key={p.id} position={[p.lat, p.lon]} icon={icons.camper}>
                            <Popup>
                                <b>Área Autocaravana/Camping</b>
                                <br />
                                {p.tags.name || "Sin nombre"}
                            </Popup>
                        </Marker>
                    ))}
                </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay name="💧 Agua Potable">
                <LayerGroup>
                    {waterPoints.map(p => (
                        <Marker key={p.id} position={[p.lat, p.lon]} icon={icons.water}>
                            <Popup>
                                <b>Agua Potable</b>
                                <br />
                                {p.tags.access === 'private' ? '(Privado)' : '(Público)'}
                            </Popup>
                        </Marker>
                    ))}
                </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay name="🛒 Supermercados">
                <LayerGroup>
                    {shops.map(p => (
                        <Marker key={p.id} position={[p.lat, p.lon]} icon={icons.supermarket}>
                            <Popup>
                                <b>{p.tags.name || "Supermercado"}</b>
                                <br />
                                {p.tags.opening_hours}
                            </Popup>
                        </Marker>
                    ))}
                </LayerGroup>
            </LayersControl.Overlay>
        </LayersControl>
    );
}

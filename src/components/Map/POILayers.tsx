'use client';

import { useMap, Marker, Popup, LayersControl } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { fetchPOIs, fetchCamperSpots, POI } from '@/lib/overpass';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

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

// Custom cluster icon creator
const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let size = 'small';

    if (count > 100) {
        size = 'large';
    } else if (count > 20) {
        size = 'medium';
    }

    return L.divIcon({
        html: `<div class="cluster-icon cluster-${size}"><span>${count}</span></div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(40, 40, true),
    });
};

export default function POILayers() {
    const map = useMap();
    const [waterPoints, setWaterPoints] = useState<POI[]>([]);
    const [camperSpots, setCamperSpots] = useState<POI[]>([]);
    const [shops, setShops] = useState<POI[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Lazy loading: only fetch POIs for current viewport
    const refreshPOIs = async () => {
        // Don't fetch if already loading
        if (isLoading) return;

        const bounds = map.getBounds();
        const b = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
        };

        // Safety check: don't fetch if zoom is too low (country level)
        if (map.getZoom() < 12) {
            // Clear markers when zoomed out too far
            setWaterPoints([]);
            setCamperSpots([]);
            setShops([]);
            return;
        }

        setIsLoading(true);

        try {
            // Parallel fetch - no limit, clustering will handle performance
            const [water, camper, food] = await Promise.all([
                fetchPOIs(b, 'amenity=drinking_water'),
                fetchCamperSpots(b),
                fetchPOIs(b, 'shop=supermarket')
            ]);

            // No limit! Clustering handles all markers efficiently
            setWaterPoints(water);
            setCamperSpots(camper);
            setShops(food);
        } catch (error) {
            console.error('Error fetching POIs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initial load
        refreshPOIs();

        // Refresh on map move
        map.on('moveend', refreshPOIs);
        return () => {
            map.off('moveend', refreshPOIs);
        };
    }, [map]);

    return (
        <>
            <LayersControl position="topright">
                <LayersControl.Overlay checked name="🚐 Áreas Autocaravana">
                    <MarkerClusterGroup
                        chunkedLoading
                        iconCreateFunction={createClusterCustomIcon}
                        maxClusterRadius={60}
                        spiderfyOnMaxZoom={true}
                        showCoverageOnHover={false}
                        zoomToBoundsOnClick={true}
                    >
                        {camperSpots.map(p => (
                            <Marker key={p.id} position={[p.lat, p.lon]} icon={icons.camper}>
                                <Popup>
                                    <b>Área Autocaravana/Camping</b>
                                    <br />
                                    {p.tags.name || "Sin nombre"}
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay name="💧 Agua Potable">
                    <MarkerClusterGroup
                        chunkedLoading
                        iconCreateFunction={createClusterCustomIcon}
                        maxClusterRadius={60}
                        spiderfyOnMaxZoom={true}
                        showCoverageOnHover={false}
                        zoomToBoundsOnClick={true}
                    >
                        {waterPoints.map(p => (
                            <Marker key={p.id} position={[p.lat, p.lon]} icon={icons.water}>
                                <Popup>
                                    <b>Agua Potable</b>
                                    <br />
                                    {p.tags.access === 'private' ? '(Privado)' : '(Público)'}
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay name="🛒 Supermercados">
                    <MarkerClusterGroup
                        chunkedLoading
                        iconCreateFunction={createClusterCustomIcon}
                        maxClusterRadius={60}
                        spiderfyOnMaxZoom={true}
                        showCoverageOnHover={false}
                        zoomToBoundsOnClick={true}
                    >
                        {shops.map(p => (
                            <Marker key={p.id} position={[p.lat, p.lon]} icon={icons.supermarket}>
                                <Popup>
                                    <b>{p.tags.name || "Supermercado"}</b>
                                    <br />
                                    {p.tags.opening_hours}
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                </LayersControl.Overlay>
            </LayersControl>

            {/* Loading indicator */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: '70px',
                    right: '10px',
                    zIndex: 1000,
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
                    Cargando POIs...
                </div>
            )}
        </>
    );
}

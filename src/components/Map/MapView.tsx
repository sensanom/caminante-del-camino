'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { useEffect, useState } from 'react';
import { LatLngExpression } from 'leaflet';
import SearchControl from './SearchControl';
import CompassWidget from '../Tools/CompassWidget';
import POILayers from './POILayers';
import RouteEditor from '../Routes/RouteEditor';
import SavedRoutesDrawer from '../Routes/SavedRoutesDrawer';

interface MapViewProps {
    center?: LatLngExpression;
    zoom?: number;
}

// Component to update map center when prop changes
function MapController({ center }: { center: LatLngExpression }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function MapView() {
    const [position, setPosition] = useState<LatLngExpression>([40.4168, -3.7038]); // Madrid default
    const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const newPos: LatLngExpression = [latitude, longitude];
                    setUserLocation(newPos);
                    setPosition(newPos);
                    setCoords({ lat: latitude, lng: longitude });
                },
                (err) => {
                    console.error("Error getting location", err);
                }
            );
        }

        // Delay loading heavy components to prevent blank screen (50ms)
        const timer = setTimeout(() => {
            setMapReady(true);
        }, 50);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{ height: '100dvh', width: '100%' }}>
            <MapContainer
                center={position}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false} // We will add custom controls
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={position} />
                <SearchControl />
                {mapReady && (
                    <>
                        <POILayers />
                        <RouteEditor />
                        <SavedRoutesDrawer />
                    </>
                )}

                {userLocation && (
                    <Marker position={userLocation}>
                        <Popup>
                            Estás aquí
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
            <CompassWidget lat={coords?.lat} lng={coords?.lng} />
        </div>
    );
}

'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

export default function MapvView() {
    const [position, setPosition] = useState<LatLngExpression>([40.4168, -3.7038]);
    const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

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
    }, []);

    // Este efecto se ejecuta SOLO cuando el mapa está 100% listo
    useEffect(() => {
        if (mapInstance) {
            // Opcional: hacer algo al tener el mapa
            setMapReady(true);
        }
    }, [mapInstance]);

    return (
        <div style={{ height: '10v', width: '100%' }}>
            <MapContainer
                center={position}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                whenCreated={setMapInstance} // 👈 ¡Aquí está la clave!
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
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
                        <Popup>Estás aquí</Popup>
                    </Marker>
                )}
            </MapContainer>
            <CompassWidget lat={coords?.lat} lng={coords?.lng} />
        </div>
    );
}

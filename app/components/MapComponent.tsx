'use client';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';
import { Icon } from 'leaflet';
import 'leaflet-rotatedmarker';

// Arregla íconos de Leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Estilos del botón de brújula
const compassButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  zIndex: 1000,
  background: 'white',
  border: '2px solid #ccc',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none',
  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
};

// Componente de brújula
function CompassControl({ onToggle }: { onToggle: (active: boolean) => void }) {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    const newActive = !isActive;
    setIsActive(newActive);
    onToggle(newActive);
  };

  return (
    <div
      style={{
        ...compassButtonStyle,
        border: `2px solid ${isActive ? '#ef4444' : '#ccc'}`,
        color: isActive ? '#ef4444' : '#666',
        fontWeight: 'bold',
      }}
      onClick={handleClick}
    >
      🧭
    </div>
  );
}

// Hook para controlar la orientación
function useOrientation(map: any) {
  const rotationRef = useRef(0);

  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (event.webkitCompassHeading) {
      // iOS
      rotationRef.current = event.webkitCompassHeading;
    } else if (event.alpha !== null) {
      // Android y otros
      let alpha = event.alpha!;
      // Corrección para hacer que el mapa gire correctamente
      rotationRef.current = 360 - alpha;
    }
    if (map) {
      map.setBearing(rotationRef.current);
    }
  };

  const startTracking = () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+
      (DeviceOrientationEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      // Android, etc.
      window.addEventListener('deviceorientation', handleOrientation);
    }
  };

  const stopTracking = () => {
    window.removeEventListener('deviceorientation', handleOrientation);
    if (map) {
      map.setBearing(0); // Vuelve al norte
    }
  };

  return { startTracking, stopTracking };
}

// Componente que maneja el mapa y la brújula
function MapController() {
  const map = useMap();
  const { startTracking, stopTracking } = useOrientation(map);
  const compassActiveRef = useRef(false);

  const toggleCompass = (active: boolean) => {
    compassActiveRef.current = active;
    if (active) {
      startTracking();
    } else {
      stopTracking();
    }
  };

  // Al desmontar, detener el sensor
  useEffect(() => {
    return () => {
      if (compassActiveRef.current) {
        stopTracking();
      }
    };
  }, []);

  return <CompassControl onToggle={toggleCompass} />;
}

export default function MapComponent() {
  return (
    <MapContainer
      center={[40.4168, -3.7038]}
      zoom={6}
      style={{ height: '100vh', width: '100%' }}
      scrollWheelZoom={true}
      dragging={true}
      touchZoom={true}
      doubleClickZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController />
    </MapContainer>
  );
}

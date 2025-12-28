'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { haversineDistance } from '@/lib/geo';

// Componente para dibujar ruta manual
function DrawModeHandler({ points, setPoints }: { points: [number, number][], setPoints: (p: [number, number][]) => void }) {
  const map = useMap();

  useEffect(() => {
    const onClick = (e: any) => {
      setPoints([...points, [e.latlng.lat, e.latlng.lng]]);
    };
    map.on('click', onClick);
    return () => { map.off('click', onClick); };
  }, [map, points, setPoints]);

  return <Polyline positions={points} color="blue" />;
}

// Componente principal
export default function MapView() {
  const [start, setStart] = useState<[number, number] | null>(null);
  const [end, setEnd] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [transportMode, setTransportMode] = useState<'walk' | 'bike' | 'car'>('walk');

  // Calcular distancia entre inicio y fin
  useEffect(() => {
    if (start && end) {
      const dist = haversineDistance(start[0], start[1], end[0], end[1]);
      setDistance(dist);
    } else {
      setDistance(null);
    }
  }, [start, end]);

  // Reset al cambiar de modo
  const toggleDrawMode = () => {
    setDrawMode(!drawMode);
    if (!drawMode) {
      setStart(null);
      setEnd(null);
      setDrawPoints([]);
    }
  };

  const saveRoute = () => {
    const route = drawMode ? drawPoints : (start && end ? [start, end] : []);
    if (route.length > 0) {
      localStorage.setItem('savedRoute', JSON.stringify(route));
      alert('Ruta guardada en el navegador');
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      {/* Barra de control */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          zIndex: 1000,
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          background: 'white',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          maxWidth: '800px',
        }}
      >
        <input
          type="text"
          placeholder="Inicio (clic en mapa)"
          readOnly
          style={{ flex: 2, padding: '8px', fontSize: '14px' }}
        />
        <input
          type="text"
          placeholder="Destino (clic en mapa)"
          readOnly
          style={{ flex: 2, padding: '8px', fontSize: '14px' }}
        />
        <button
          onClick={() => setTransportMode('walk')}
          style={{
            background: transportMode === 'walk' ? '#4CAF50' : '#f1f1f1',
            padding: '6px 10px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        >
          🚶‍♂️
        </button>
        <button
          onClick={() => setTransportMode('bike')}
          style={{
            background: transportMode === 'bike' ? '#2196F3' : '#f1f1f1',
            padding: '6px 10px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        >
          🚲
        </button>
        <button
          onClick={() => setTransportMode('car')}
          style={{
            background: transportMode === 'car' ? '#FF9800' : '#f1f1f1',
            padding: '6px 10px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        >
          🚗
        </button>
        <button
          onClick={toggleDrawMode}
          style={{
            background: drawMode ? '#E91E63' : '#9E9E9E',
            color: 'white',
            padding: '6px 10px',
            fontSize: '14px',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {drawMode ? '⏹ Dibujar' : '✏️ Dibujar'}
        </button>
        <button
          onClick={saveRoute}
          style={{
            background: '#673AB7',
            color: 'white',
            padding: '6px 10px',
            fontSize: '14px',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          💾 Guardar
        </button>
      </div>

      {/* Mostrar distancia */}
      {(distance !== null || drawPoints.length > 1) && (
        <div
          style={{
            position: 'absolute',
            top: '90px',
            left: '10px',
            zIndex: 1000,
            background: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          }}
        >
          Distancia: {(
            drawMode
              ? drawPoints.reduce((total, point, i, arr) => {
                  if (i === 0) return total;
                  return total + haversineDistance(arr[i-1][0], arr[i-1][1], point[0], point[1]);
                }, 0)
              : distance || 0
          ) / 1000).toFixed(2)} km
        </div>
      )}

      {/* Mapa */}
      <MapContainer
        center={[40.4168, -3.7038]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Modo normal: dos marcadores */}
        {!drawMode && start && <Marker position={start} />}
        {!drawMode && end && <Marker position={end} />}
        {/* Modo dibujo: ruta libre */}
        {drawMode && <DrawModeHandler points={drawPoints} setPoints={setDrawPoints} />}
      </MapContainer>
    </div>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const MapComponent = dynamic(() => import('./components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f0f0',
      color: '#333'
    }}>
      Cargando mapa de España...
    </div>
  ),
});

export default function Home() {
  return <MapComponent />;
}

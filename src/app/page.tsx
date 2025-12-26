'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6', // opcional: color de fondo suave
      }}
    >
      Cargando mapa...
    </div>
  ),
});

export default function Home() {
  return (
    <main>
      <MapView />
    </main>
  );
}

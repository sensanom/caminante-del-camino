
'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>Cargando mapa...</div>
});

export default function Home() {
  return (
    <main>
      <MapView />
    </main>
  );
}

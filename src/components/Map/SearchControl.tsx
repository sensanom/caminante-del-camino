'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useMap } from 'react-leaflet';

export default function SearchControl() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const map = useMap();

    const handleSearch = async () => {
        if (!query) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=es&limit=5`);
            const data = await res.json();
            setResults(data);
            setIsOpen(true);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="absolute top-4 left-4 z-[1000] w-64 pointer-events-auto">
            <div className="flex items-center bg-white/90 dark:bg-black/80 backdrop-blur rounded-lg shadow-md overflow-hidden">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Buscar lugar..."
                    className="w-full bg-transparent border-none p-3 text-sm focus:outline-none"
                />
                <button onClick={handleSearch} className="p-3 hover:bg-black/5 dark:hover:bg-white/10 text-primary">
                    <Search size={20} />
                </button>
            </div>

            {isOpen && results.length > 0 && (
                <ul className="mt-2 bg-white/95 dark:bg-black/90 backdrop-blur rounded-lg shadow-lg overflow-hidden text-sm max-h-60 overflow-y-auto">
                    {results.map((item) => (
                        <li
                            key={item.place_id}
                            className="p-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                            onClick={() => {
                                const lat = parseFloat(item.lat);
                                const lon = parseFloat(item.lon);
                                map.flyTo([lat, lon], 14);
                                setIsOpen(false);
                                setResults([]);
                                setQuery(item.display_name.split(',')[0]);
                            }}
                        >
                            <div className="font-medium">{item.display_name.split(',')[0]}</div>
                            <div className="text-xs text-gray-500 truncate">{item.display_name}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

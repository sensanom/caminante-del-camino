/**
 * Routing service using OSRM (Open Source Routing Machine)
 * Provides automatic route calculation following actual roads/paths
 */

export type RoutingProfile = 'foot' | 'bike' | 'car';

export interface RouteResult {
    coordinates: [number, number][]; // [lat, lng] pairs
    distance: number; // meters
    duration: number; // seconds
    success: boolean;
    error?: string;
}

const OSRM_BASE_URL = 'https://router.project-osrm.org';

/**
 * Calculate route between two or more points using OSRM
 * @param points Array of [lat, lng] coordinates
 * @param profile Routing profile: 'foot', 'bike', or 'car'
 * @returns Route result with coordinates and distance
 */
export async function calculateRoute(
    points: [number, number][],
    profile: RoutingProfile = 'foot'
): Promise<RouteResult> {
    if (points.length < 2) {
        return {
            coordinates: points,
            distance: 0,
            duration: 0,
            success: false,
            error: 'Se necesitan al menos 2 puntos para calcular una ruta'
        };
    }

    try {
        // OSRM expects coordinates as lng,lat (opposite of our [lat,lng])
        const coords = points.map(p => `${p[1]},${p[0]}`).join(';');
        
        // Map our profile names to OSRM profile names
        const osrmProfile = profile === 'foot' ? 'foot' : profile === 'bike' ? 'bike' : 'driving';
        
        const url = `${OSRM_BASE_URL}/route/v1/${osrmProfile}/${coords}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`OSRM API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error('No se pudo calcular la ruta');
        }
        
        const route = data.routes[0];
        
        // Convert GeoJSON coordinates [lng, lat] back to our format [lat, lng]
        const coordinates: [number, number][] = route.geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]]
        );
        
        return {
            coordinates,
            distance: route.distance, // meters
            duration: route.duration, // seconds
            success: true
        };
        
    } catch (error) {
        console.error('Error calculating route:', error);
        
        // Fallback: return straight line between points
        return {
            coordinates: points,
            distance: calculateStraightLineDistance(points),
            duration: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

/**
 * Calculate straight-line distance as fallback
 */
function calculateStraightLineDistance(points: [number, number][]): number {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371e3; // Earth radius in meters

    let totalDist = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const lat1 = points[i][0];
        const lon1 = points[i][1];
        const lat2 = points[i + 1][0];
        const lon2 = points[i + 1][1];

        const phi1 = toRad(lat1);
        const phi2 = toRad(lat2);
        const dPhi = toRad(lat2 - lat1);
        const dLambda = toRad(lon2 - lon1);

        const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        totalDist += R * c;
    }
    return totalDist;
}

/**
 * Format distance in human-readable format
 * @param meters Distance in meters
 * @returns Formatted string like "2.5 km" or "350 m"
 */
export function formatDistance(meters: number): string {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
}

/**
 * Format duration in human-readable format
 * @param seconds Duration in seconds
 * @returns Formatted string like "1h 30m" or "45m"
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

/**
 * Get color for route based on type
 */
export function getRouteColor(type: 'hiking' | 'cycling' | 'car'): string {
    switch (type) {
        case 'hiking':
            return '#22c55e'; // green
        case 'cycling':
            return '#3b82f6'; // blue
        case 'car':
            return '#6b7280'; // gray
        default:
            return '#ef4444'; // red (fallback)
    }
}

export interface POI {
    id: number;
    lat: number;
    lon: number;
    type: string;
    tags: Record<string, string>;
}

export async function fetchPOIs(bounds: { north: number; south: number; east: number; west: number }, amenity: string): Promise<POI[]> {
    const query = `
    [out:json][timeout:25];
    (
      node["${amenity}"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      way["${amenity}"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
    );
    out body;
    >;
    out skel qt;
  `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
        });
        const data = await response.json();
        return data.elements.filter((el: any) => el.lat && el.lon);
    } catch (error) {
        console.error("Error fetching POIs", error);
        return [];
    }
}

export async function fetchCamperSpots(bounds: { north: number; south: number; east: number; west: number }) {
    // Specific query for camping/caravan sites
    const query = `
      [out:json][timeout:25];
      (
        node["tourism"="camp_site"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        node["tourism"="caravan_site"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        way["tourism"="camp_site"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        way["tourism"="caravan_site"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      );
      out body;
      >;
      out skel qt;
    `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
        });
        const data = await response.json();
        return data.elements.filter((el: any) => el.lat && el.lon).map((el: any) => ({ ...el, type: 'camper' }));
    } catch (error) {
        console.error("Error fetching Camper spots", error);
        return [];
    }
}

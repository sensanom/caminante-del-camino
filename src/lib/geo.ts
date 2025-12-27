export function parseGPX(gpxContent: string): [number, number][] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, "text/xml");
    const trkpts = xmlDoc.getElementsByTagName("trkpt");
    const points: [number, number][] = [];

    for (let i = 0; i < trkpts.length; i++) {
        const latchar = trkpts[i].getAttribute("lat");
        const lonchar = trkpts[i].getAttribute("lon");
        if (latchar && lonchar) {
            points.push([parseFloat(latchar), parseFloat(lonchar)]);
        }
    }
    return points;
}

export function haversineDistance(coords: [number, number][]) {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371e3; // metres

    let totalDist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        const lat1 = coords[i][0];
        const lon1 = coords[i][1];
        const lat2 = coords[i + 1][0];
        const lon2 = coords[i + 1][1];

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        totalDist += distance;
    }
    return totalDist;
}

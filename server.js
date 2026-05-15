const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { create } = require('xmlbuilder2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/**
 * Resolves a short URL to its full redirect destination
 */
async function resolveUrl(url) {
    if (!url.includes('goo.gl') && !url.includes('maps.app.goo.gl')) {
        return url;
    }
    try {
        const response = await axios.head(url, { maxRedirects: 5 });
        return response.request.res.responseUrl || url;
    } catch (error) {
        console.error('Error resolving URL:', error.message);
        return url;
    }
}

/**
 * Extracts coordinates from a Google Maps URL
 */
function extractCoords(url) {
    const coords = [];
    
    // Pattern 1: Path coordinates /dir/1.23,4.56/7.89,10.11/
    const pathMatches = [...url.matchAll(/\/dir\/(-?\d+\.\d+),(-?\d+\.\d+)|(-?\d+\.\d+),(-?\d+\.\d+)\//g)];
    pathMatches.forEach(match => {
        const lat = parseFloat(match[1] || match[3]);
        const lon = parseFloat(match[2] || match[4]);
        if (!isNaN(lat) && !isNaN(lon)) {
            coords.push({ lat, lon });
        }
    });

    // Pattern 2: !3dLAT!4dLON or !1dLON!2dLAT or !2dLAT!1dLON
    const dataMatches = [...url.matchAll(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)|!2d(-?\d+\.\d+)!1d(-?\d+\.\d+)|!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/g)];
    dataMatches.forEach(match => {
        // match[1]/[2] for 3d/4d, match[3]/[4] for 2d/1d, match[5]/[6] for 1d/2d
        let lat, lon;
        if (match[1]) { lat = parseFloat(match[1]); lon = parseFloat(match[2]); }
        else if (match[3]) { lat = parseFloat(match[3]); lon = parseFloat(match[4]); }
        else if (match[5]) { lat = parseFloat(match[6]); lon = parseFloat(match[5]); }
        
        if (!isNaN(lat) && !isNaN(lon)) {
            coords.push({ lat, lon });
        }
    });

    // Pattern 3: @lat,lng (Fallback for viewport/center)
    if (coords.length < 2) {
        const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (atMatch) {
            coords.push({ lat: parseFloat(atMatch[1]), lon: parseFloat(atMatch[2]) });
        }
    }
    
    // De-duplicate coordinates that are very close to each other
    return coords.filter((c, index, self) => 
        index === self.findIndex((t) => (
            Math.abs(t.lat - c.lat) < 0.0001 && Math.abs(t.lon - c.lon) < 0.0001
        ))
    );
}

app.post('/api/convert', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        console.log('Processing URL:', url);
        const fullUrl = await resolveUrl(url);
        console.log('Resolved URL:', fullUrl);

        const points = extractCoords(fullUrl);
        console.log('Extracted Points:', points);

        if (points.length < 2) {
            return res.status(400).json({ 
                error: 'Could not find enough coordinates in the URL. Please ensure it is a directions link.' 
            });
        }

        // OSRM API expects lon,lat;lon,lat
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${points.map(p => `${p.lon},${p.lat}`).join(';')}?overview=full&geometries=geojson`;
        
        const osrmResponse = await axios.get(osrmUrl);
        const route = osrmResponse.data.routes[0];

        if (!route) {
            return res.status(404).json({ error: 'No route found between these points' });
        }

        // Manual GPX generation using xmlbuilder2
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('gpx', {
                version: '1.1',
                creator: 'MapToGPX',
                xmlns: 'http://www.topografix.com/GPX/1/1'
            })
            .ele('trk')
                .ele('name').txt('Google Maps Route').up()
                .ele('trkseg');

        route.geometry.coordinates.forEach(coord => {
            root.ele('trkpt', { lat: coord[1], lon: coord[0] })
                // .ele('time').txt(new Date().toISOString()).up()
                .up();
        });

        const xml = root.end({ prettyPrint: true });
        
        res.header('Content-Type', 'application/gpx+xml');
        res.attachment('route.gpx');
        res.send(xml);

    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ error: 'Failed to convert route. ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

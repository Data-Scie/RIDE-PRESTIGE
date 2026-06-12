// ============================================================
// Ride Prestige — Distance Calculation Utility
//
// GOOGLE MAPS DISTANCE MATRIX INTEGRATION:
// 1. Add to .env.local:
//    GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY=your_key_here
// 2. Replace the body of `estimateDistance()` below with:
//
//    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`
//      + `?origins=${encodeURIComponent(pickupPostcode)}`
//      + `&destinations=${encodeURIComponent(dropoffPostcode)}`
//      + `&units=imperial`
//      + `&key=${process.env.GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY}`;
//
//    const res = await fetch(url);
//    const data = await res.json();
//    const element = data.rows[0].elements[0];
//    const distanceMiles = element.distance.value / 1609.34;
//    const durationMinutes = element.duration.value / 60;
//    return { distanceMiles, durationMinutes, durationHours: durationMinutes / 60 };
//
// 3. Restart dev server: npm run dev
// ============================================================

export interface DistanceResult {
  distanceMiles: number;
  durationMinutes: number;
  durationHours: number;
}

// Demo lookup table for common Sheffield routes (miles)
const DEMO_DISTANCES: Record<string, number> = {
  'S1-S2': 2.1, 'S1-S3': 1.5, 'S1-S4': 3.2, 'S1-S5': 4.1,
  'S1-S6': 5.0, 'S1-S7': 6.3, 'S1-S10': 2.8, 'S1-S11': 4.5,
  'S1-S17': 8.2, 'S1-S20': 10.0, 'S1-S35': 14.5, 'S1-S60': 12.0,
  'S1-DN1': 18.0, 'S1-LS1': 35.0, 'S1-M1': 38.0, 'S1-DE1': 25.0,
  'S1-B1': 80.0, 'S1-NG1': 45.0, 'S1-YO1': 55.0, 'S1-HU1': 60.0,
  'S1-LN1': 55.0, 'S1-LE1': 60.0, 'S1-CV1': 90.0, 'S1-WF1': 28.0,
  'S1-HD1': 22.0, 'S1-BB1': 65.0, 'S1-HX1': 30.0,
};

function getAreaCode(postcode: string): string {
  const cleaned = postcode.trim().toUpperCase().replace(/\s+/g, '');
  const match = cleaned.match(/^([A-Z]{1,2}[0-9]{1,2})/);
  return match ? match[1] : cleaned.substring(0, 3);
}

// Returns demo distance. Replace with real Google Maps Distance Matrix API call.
export async function estimateDistance(
  pickupPostcode: string,
  dropoffPostcode: string,
): Promise<DistanceResult> {
  const a1 = getAreaCode(pickupPostcode);
  const a2 = getAreaCode(dropoffPostcode);

  const key1 = `${a1}-${a2}`;
  const key2 = `${a2}-${a1}`;

  let miles = DEMO_DISTANCES[key1] ?? DEMO_DISTANCES[key2];

  if (!miles) {
    const seed = (pickupPostcode + dropoffPostcode)
      .split('')
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    miles = Math.max(3, (seed % 45) + 8);
  }

  miles = Math.round(miles * 10) / 10;
  const durationMinutes = Math.round(miles * 2.4 + 5);

  return { distanceMiles: miles, durationMinutes, durationHours: durationMinutes / 60 };
}

export function formatDistance(miles: number): string {
  return `${miles.toFixed(1)} miles`;
}

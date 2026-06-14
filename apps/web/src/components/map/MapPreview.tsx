// ============================================================
// MapPreview — Sheffield demo map (OpenStreetMap, no API key)
//
// GOOGLE MAPS INTEGRATION STEPS:
// 1. Get API key → console.cloud.google.com
//    Enable: Maps JavaScript API + Places API + Distance Matrix API
// 2. Add to .env.local:
//    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
// 3. Install: npm install @googlemaps/js-api-loader
// 4. Replace the <iframe> below with the Google Maps JS API embed
//    See: https://developers.google.com/maps/documentation/javascript
// 5. For distance calculation, update src/lib/distance.ts
//    (see comments in that file for the API call to replace)
// ============================================================

interface MapPreviewProps {
  className?: string;
  style?: React.CSSProperties;
  showOverlay?: boolean;
}

// Sheffield city centre: 53.3811° N, 1.4701° W
const SHEFFIELD_MAP_URL =
  'https://www.openstreetmap.org/export/embed.html' +
  '?bbox=-1.5601%2C53.3511%2C-1.3801%2C53.4111' +
  '&layer=mapnik' +
  '&marker=53.3811%2C-1.4701';

export default function MapPreview({ className = '', style = {}, showOverlay = true }: MapPreviewProps) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* Demo Sheffield map — replace iframe with Google Maps when API key is ready */}
      <iframe
        src={SHEFFIELD_MAP_URL}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          filter: 'grayscale(30%) brightness(0.75) saturate(0.8)',
        }}
        loading="lazy"
        title="Sheffield city centre map"
        referrerPolicy="no-referrer"
      />
      {showOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.55) 100%)',
          }}
        />
      )}
    </div>
  );
}

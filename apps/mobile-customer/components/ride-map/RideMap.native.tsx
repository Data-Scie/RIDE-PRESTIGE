import { StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";

type LatLng = { latitude: number; longitude: number };

type RideMapProps = {
  stops: string[];
  showRoute: boolean;
  driverCoordinate?: LatLng | null;
  pickupCoordinate?: LatLng | null;
  dropoffCoordinate?: LatLng | null;
};

const defaultPickup  = { latitude: 53.3811, longitude: -1.4701, latitudeDelta: 0.043, longitudeDelta: 0.043 };
const defaultDriver  = { latitude: 53.3878, longitude: -1.452 };
const defaultDropoff = { latitude: 53.3997, longitude: -1.4129 };
const stopCoords = [
  { latitude: 53.3908, longitude: -1.4445 },
  { latitude: 53.3942, longitude: -1.4335 },
  { latitude: 53.3868, longitude: -1.4562 },
];
const defaultRoute = [
  { latitude: 53.3811, longitude: -1.4701 },
  { latitude: 53.386, longitude: -1.458 },
  { latitude: 53.3908, longitude: -1.4445 },
  { latitude: 53.395, longitude: -1.431 },
  { latitude: 53.3997, longitude: -1.4129 },
];

// react-native-maps needs a real Google Maps API key embedded natively to render on Android -
// without one it doesn't fail gracefully, it crashes the whole app. Expo Go has its own shared
// dev-only key, which is why this worked there but not in a standalone build. Until a real key
// is configured (android.config.googleMaps.apiKey in app.json), fall back to the same stylised
// route diagram already used on web, instead of risking a crash.
const hasGoogleMapsKey = Boolean(
  (Constants.expoConfig?.android as { config?: { googleMaps?: { apiKey?: string } } } | undefined)
    ?.config?.googleMaps?.apiKey,
);

function RideMapFallback({ stops, showRoute }: RideMapProps) {
  const points = ["Pickup", ...stops.map((stop, index) => stop || `Stop ${index + 1}`), "Drop-off"];
  return (
    <View style={fallbackStyles.map}>
      <View style={[fallbackStyles.road, fallbackStyles.roadOne]} />
      <View style={[fallbackStyles.road, fallbackStyles.roadTwo]} />
      <View style={fallbackStyles.route}>
        {points.map((point, index) => (
          <View key={`${point}-${index}`} style={fallbackStyles.pointRow}>
            <View style={[fallbackStyles.marker, index === points.length - 1 && fallbackStyles.destination]} />
            <Text numberOfLines={1} style={fallbackStyles.label}>{point}</Text>
          </View>
        ))}
      </View>
      {showRoute && <Text style={fallbackStyles.status}>Driver route active</Text>}
    </View>
  );
}

function RideMapLive({ stops, showRoute, driverCoordinate, pickupCoordinate, dropoffCoordinate }: RideMapProps) {
  const { default: MapView, Marker, Polyline, PROVIDER_GOOGLE } = require("react-native-maps");
  const pickup  = pickupCoordinate  ?? defaultPickup;
  const dropoff = dropoffCoordinate ?? defaultDropoff;
  const driver  = driverCoordinate  ?? defaultDriver;

  const routeCoords = pickupCoordinate && dropoffCoordinate
    ? [pickup, driver, dropoff]
    : defaultRoute;

  return (
    <MapView provider={PROVIDER_GOOGLE} style={StyleSheet.absoluteFillObject} initialRegion={{ ...pickup, latitudeDelta: 0.043, longitudeDelta: 0.043 }}>
      <Marker coordinate={pickup} title="Pickup" pinColor="#C9A24A" />
      {stops.map((stop, index) => (
        <Marker
          key={`map-stop-${index}`}
          coordinate={stopCoords[index] || stopCoords[0]}
          title={stop || `Stop ${index + 1}`}
          pinColor="#E0C06F"
        />
      ))}
      <Marker coordinate={dropoff} title="Drop-off" pinColor="#D7B46A" />
      {showRoute && <Marker coordinate={driver} title="Driver" pinColor="#2563EB" />}
      {showRoute && <Polyline coordinates={routeCoords} strokeColor="#C9A24A" strokeWidth={5} />}
    </MapView>
  );
}

export function RideMap(props: RideMapProps) {
  return hasGoogleMapsKey ? <RideMapLive {...props} /> : <RideMapFallback {...props} />;
}

const fallbackStyles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#161815",
    overflow: "hidden",
  },
  road: {
    position: "absolute",
    height: 28,
    width: "140%",
    left: "-20%",
    backgroundColor: "#262A25",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#3B4039",
    transform: [{ rotate: "-12deg" }],
  },
  roadOne: { top: "30%" },
  roadTwo: { top: "66%", transform: [{ rotate: "9deg" }] },
  route: {
    position: "absolute",
    left: 24,
    top: 90,
    gap: 14,
  },
  pointRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  marker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#C9A24A",
    borderWidth: 2,
    borderColor: "#FFE9B0",
  },
  destination: { backgroundColor: "#D7B46A" },
  label: { maxWidth: 220, color: "#F8F3EF", fontSize: 12, fontWeight: "600" },
  status: {
    position: "absolute",
    right: 18,
    top: 72,
    color: "#D7B46A",
    fontSize: 11,
    fontWeight: "700",
  },
});

import { StyleSheet } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

type RideMapProps = {
  stops: string[];
  showRoute: boolean;
};

const pickup = { latitude: 53.3811, longitude: -1.4701, latitudeDelta: 0.043, longitudeDelta: 0.043 };
const driver = { latitude: 53.3878, longitude: -1.452 };
const dropoff = { latitude: 53.3997, longitude: -1.4129 };
const stopCoords = [
  { latitude: 53.3908, longitude: -1.4445 },
  { latitude: 53.3942, longitude: -1.4335 },
  { latitude: 53.3868, longitude: -1.4562 },
];
const route = [
  { latitude: 53.3811, longitude: -1.4701 },
  { latitude: 53.386, longitude: -1.458 },
  { latitude: 53.3908, longitude: -1.4445 },
  { latitude: 53.395, longitude: -1.431 },
  { latitude: 53.3997, longitude: -1.4129 },
];

export function RideMap({ stops, showRoute }: RideMapProps) {
  return (
    <MapView provider={PROVIDER_GOOGLE} style={StyleSheet.absoluteFillObject} initialRegion={pickup}>
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
      <Marker coordinate={driver} title="Driver" pinColor="#2563EB" />
      {showRoute && <Polyline coordinates={route} strokeColor="#C9A24A" strokeWidth={5} />}
    </MapView>
  );
}

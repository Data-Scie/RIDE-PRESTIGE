import { StyleSheet, Text, View } from "react-native";

type LatLng = { latitude: number; longitude: number };

type RideMapProps = {
  stops: string[];
  showRoute: boolean;
  driverCoordinate?: LatLng | null;
  pickupCoordinate?: LatLng | null;
  dropoffCoordinate?: LatLng | null;
};

export function RideMap({ stops, showRoute }: RideMapProps) {
  const points = ["Pickup", ...stops.map((stop, index) => stop || `Stop ${index + 1}`), "Drop-off"];

  return (
    <View style={styles.map}>
      <View style={[styles.road, styles.roadOne]} />
      <View style={[styles.road, styles.roadTwo]} />
      <View style={styles.route}>
        {points.map((point, index) => (
          <View key={`${point}-${index}`} style={styles.pointRow}>
            <View style={[styles.marker, index === points.length - 1 && styles.destination]} />
            <Text numberOfLines={1} style={styles.label}>{point}</Text>
          </View>
        ))}
      </View>
      {showRoute && <Text style={styles.status}>Driver route active</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
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

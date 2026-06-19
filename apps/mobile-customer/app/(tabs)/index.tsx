import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBooking, getBookings, getProfile, updateProfile, submitSupportTicket, cancelBooking, getQuote, trackBooking } from "../../services/api";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { RideMap } from "../../components/ride-map/RideMap";

type Screen =
  | "splash"
  | "home"
  | "searching"
  | "tracking"
  | "bookings"
  | "favourites"
  | "payments"
  | "offers"
  | "account"
  | "support"
  | "terms"
  | "invoice";

type VehicleCategory = "Prestige" | "Minibus" | "Coach" | "Executive XL";
type PanelSize = "collapsed" | "half" | "full";
type ModalType = null | "time" | "vehicle" | "payment" | "profile" | "confirm" | "addFavourite";

const LOGO = require("../../assets/images/brand/ride-prestige-logo.png");
const LOGO_MARK = require("../../assets/images/brand/ride-prestige-mark.png");

const BLACK = "#030303";
const BLACK_2 = "#090A09";
const ROSE_GOLD = "#D7B46A";
const ROSE_GOLD_2 = "#FFE9B0";
const RED = "#C9A24A";
const RED_DARK = "#8D6F22";
const CARD = "#111211";
const CARD_2 = "#171817";
const TEXT = "#F8F3EF";
const MUTED = "#B8B0A4";
const LINE = "#342F24";
const GREEN = "#2ECC71";
const WHITE = "#FFFFFF";

const FONT_REGULAR = Platform.select({ ios: "Avenir Next", android: "sans-serif", default: "System" });
const FONT_LIGHT = Platform.select({ ios: "Avenir Next", android: "sans-serif-light", default: "System" });
const FONT_MEDIUM = Platform.select({ ios: "Avenir Next", android: "sans-serif-medium", default: "System" });

(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.style = [{ fontFamily: FONT_REGULAR }, (Text as any).defaultProps.style];
(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
(TextInput as any).defaultProps.style = [{ fontFamily: FONT_REGULAR }, (TextInput as any).defaultProps.style];

export default function RidePrestigeApp() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [modal, setModal] = useState<ModalType>(null);
  const [panel, setPanel] = useState<PanelSize>("half");
  const [pickupAddress, setPickupAddress] = useState("13 King Street, Sheffield, S3 8LF");
  const [dropoffAddress, setDropoffAddress] = useState("Meadowhall Train Station");
  const [stops, setStops] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCategory>("Prestige");
  const [pickupDate, setPickupDate] = useState("Pickup now");
  const [pickupTime, setPickupTime] = useState("ETA: 3 min");
  const [payment, setPayment] = useState("Apple Pay");
  const [notes, setNotes] = useState("Any special instructions");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [fare, setFare] = useState({ miles: 7.8, minutes: 22, total: 28 });
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (screen === "splash") {
      const timer = setTimeout(() => setScreen("home"), 1700);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Debounced quote fetch whenever pickup/dropoff/vehicle changes
  useEffect(() => {
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(async () => {
      try {
        const q = await getQuote({
          pickupAddress: pickupAddress,
          dropoffAddress: dropoffAddress,
          vehicleCategory: selectedVehicle,
          passengers: 1,
          bookingType: "current",
        });
        setFare({ miles: parseFloat(q.distance), minutes: parseInt(q.duration) || 22, total: q.fareAmount });
      } catch {
        // Keep previous fare estimate if API unavailable
      }
    }, 800);
    return () => { if (quoteTimer.current) clearTimeout(quoteTimer.current); };
  }, [pickupAddress, dropoffAddress, selectedVehicle]);

  const isScheduledBooking = pickupDate !== "Pickup now" || pickupTime !== "ETA: 3 min";

  const addStop = () => {
    if (stops.length >= 3) {
      Alert.alert("Maximum stops", "You can add up to 3 stops in this demo.");
      return;
    }
    setStops([...stops, ""]);
    setPanel("full");
  };

  const updateStop = (index: number, value: string) => {
    setStops(stops.map((s, i) => (i === index ? value : s)));
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const nextPanel = () => {
    if (panel === "full") setPanel("half");
    else if (panel === "half") setPanel("collapsed");
    else setPanel("half");
  };

  const confirmRequest = useCallback(async () => {
    setModal(null);
    setScreen("searching");
    try {
      const booking = await createBooking({
        pickupAddress,
        dropoffAddress,
        passengers: 1,
        vehicleCategory: selectedVehicle,
        bookingType: isScheduledBooking ? "scheduled" : "current",
        date: isScheduledBooking ? pickupDate : undefined,
        time: isScheduledBooking ? pickupTime : undefined,
        notes: notes !== "Any special instructions" ? notes : undefined,
      });
      setActiveBookingId(booking.id);
    } catch {
      // Keep the demo flow usable while the local API is unavailable
    }
  }, [pickupAddress, dropoffAddress, selectedVehicle, isScheduledBooking, pickupDate, pickupTime, notes]);

  if (screen === "splash") return <SplashScreen />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BLACK} />
      <View style={styles.root}>
        {screen === "home" && (
          <HomeBookingScreen
            pickupAddress={pickupAddress}
            setPickupAddress={setPickupAddress}
            dropoffAddress={dropoffAddress}
            setDropoffAddress={setDropoffAddress}
            stops={stops}
            updateStop={updateStop}
            removeStop={removeStop}
            addStop={addStop}
            selectedVehicle={selectedVehicle}
            pickupDate={pickupDate}
            pickupTime={pickupTime}
            isScheduledBooking={isScheduledBooking}
            payment={payment}
            notes={notes}
            setNotes={setNotes}
            fare={fare}
            panel={panel}
            nextPanel={nextPanel}
            setPanel={setPanel}
            setModal={setModal}
            setMenuOpen={setMenuOpen}
          />
        )}

        {screen === "searching" && <SearchingScreen bookingId={activeBookingId} onFound={() => setScreen("tracking")} />}
        {screen === "tracking" && <TrackingScreen bookingId={activeBookingId} go={setScreen} />}
        {screen === "bookings" && <BookingsScreen go={setScreen} />}
        {screen === "favourites" && <FavouritesScreen go={setScreen} onAdd={() => setModal("addFavourite")} />}
        {screen === "payments" && <PaymentsScreen go={setScreen} setPayment={setPayment} payment={payment} />}
        {screen === "offers" && <OffersScreen go={setScreen} />}
        {screen === "account" && <AccountScreen go={setScreen} />}
        {screen === "support" && <SupportScreen go={setScreen} />}
        {screen === "terms" && <TermsScreen go={setScreen} />}
        {screen === "invoice" && <InvoiceScreen go={setScreen} fare={fare} vehicle={selectedVehicle} />}

        <ProfileDrawer
          visible={menuOpen}
          close={() => setMenuOpen(false)}
          go={(target) => { setMenuOpen(false); setScreen(target); }}
        />

        <BookingModals
          modal={modal}
          setModal={setModal}
          pickupDate={pickupDate}
          setPickupDate={setPickupDate}
          pickupTime={pickupTime}
          setPickupTime={setPickupTime}
          selectedVehicle={selectedVehicle}
          setSelectedVehicle={setSelectedVehicle}
          payment={payment}
          setPayment={setPayment}
          fare={fare}
          isScheduledBooking={isScheduledBooking}
          confirmRequest={confirmRequest}
        />
      </View>
    </SafeAreaView>
  );
}

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <StatusBar barStyle="light-content" backgroundColor={BLACK} />
      <Image source={LOGO} style={styles.splashLogo} resizeMode="contain" />
    </View>
  );
}

function HomeBookingScreen({
  pickupAddress,
  setPickupAddress,
  dropoffAddress,
  setDropoffAddress,
  stops,
  updateStop,
  removeStop,
  addStop,
  selectedVehicle,
  pickupDate,
  pickupTime,
  isScheduledBooking,
  payment,
  notes,
  setNotes,
  fare,
  panel,
  nextPanel,
  setPanel,
  setModal,
  setMenuOpen,
}: {
  pickupAddress: string;
  setPickupAddress: (v: string) => void;
  dropoffAddress: string;
  setDropoffAddress: (v: string) => void;
  stops: string[];
  updateStop: (i: number, v: string) => void;
  removeStop: (i: number) => void;
  addStop: () => void;
  selectedVehicle: VehicleCategory;
  pickupDate: string;
  pickupTime: string;
  isScheduledBooking: boolean;
  payment: string;
  notes: string;
  setNotes: (v: string) => void;
  fare: { miles: number; minutes: number; total: number };
  panel: PanelSize;
  nextPanel: () => void;
  setPanel: (v: PanelSize) => void;
  setModal: (v: ModalType) => void;
  setMenuOpen: (v: boolean) => void;
}) {
  const dragY = useRef(new Animated.Value(0)).current;

  const movePanel = (direction: "up" | "down") => {
    if (direction === "down") {
      if (panel === "full") setPanel("half");
      else if (panel === "half") setPanel("collapsed");
    } else {
      if (panel === "collapsed") setPanel("half");
      else if (panel === "half") setPanel("full");
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
        onPanResponderGrant: () => {
          dragY.stopAnimation();
        },
        onPanResponderMove: (_, gesture) => {
          const clamped = Math.max(-95, Math.min(210, gesture.dy));
          dragY.setValue(clamped);
        },
        onPanResponderRelease: (_, gesture) => {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();

          if (gesture.dy > 70 || gesture.vy > 0.85) movePanel("down");
          if (gesture.dy < -70 || gesture.vy < -0.85) movePanel("up");
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
        },
      }),
    [panel, dragY]
  );

  return (
    <View style={styles.screen}>
      <MapArea
        title="Move pin to set pickup"
        subtitle="Natural Google map preview"
        stops={stops}
        showRoute={false}
        expanded={panel === "collapsed"}
      />

      <View style={styles.topBar}>
        <Image source={LOGO_MARK} style={styles.topLogo} resizeMode="contain" />
        <Pressable onPress={() => setMenuOpen(true)} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>☰</Text>
        </Pressable>
      </View>

      <View style={[styles.pinCenter, panel === "collapsed" && styles.pinCenterLarge]}>
        <View style={styles.pinBubble}><Text style={styles.pinBubbleText}>3 min</Text></View>
        <View style={styles.pinStem} />
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.bookingPanel,
          panel === "collapsed" && styles.panelCollapsed,
          panel === "full" && styles.panelFull,
          { transform: [{ translateY: dragY }] },
        ]}
      >
        <Pressable onPress={nextPanel} style={styles.handleTouch}>
          <View style={styles.handle} />
          <Text style={styles.dragHint}>Drag down for full map · drag up for full booking</Text>
        </Pressable>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          {panel !== "collapsed" && <Text style={styles.panelTitle}>Book your ride</Text>}

          <LocationInput label="Pickup" value={pickupAddress} onChange={setPickupAddress} icon="●" />

          {stops.map((stop, index) => (
            <View key={`stop-${index}`} style={styles.stopRow}>
              <View style={styles.stopInputWrap}>
                <LocationInput label={`Stop ${index + 1}`} value={stop} onChange={(v) => updateStop(index, v)} icon="◆" />
              </View>
              <Pressable onPress={() => removeStop(index)} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>×</Text>
              </Pressable>
            </View>
          ))}

          <View style={styles.dropoffRow}>
            <View style={styles.dropoffField}>
              <LocationInput label="Drop-off" value={dropoffAddress} onChange={setDropoffAddress} icon="■" />
            </View>
            <Pressable onPress={addStop} style={styles.addStopButton}>
              <Text style={styles.addStopText}>＋</Text>
            </Pressable>
          </View>

          {panel === "collapsed" ? (
            <Pressable onPress={() => setPanel("half")} style={styles.expandButton}>
              <Text style={styles.expandButtonText}>Open booking panel</Text>
            </Pressable>
          ) : (
            <>
              <ActionRow title="Pickup time" subtitle={`${isScheduledBooking ? "Scheduled booking" : "Pickup now"} · ${pickupDate} · ${pickupTime}`} icon="🕘" onPress={() => setModal("time")} />

              <View style={[styles.scheduleBanner, isScheduledBooking && styles.scheduleBannerActive]}>
                <Text style={styles.scheduleBannerTitle}>{isScheduledBooking ? "Scheduled booking saved" : "Immediate pickup"}</Text>
                <Text style={styles.scheduleBannerText}>
                  {isScheduledBooking
                    ? "Your request will be logged now. A driver will be dispatched in advance of your selected pickup time."
                    : "After payment authorisation, the request goes live and the app starts looking for a driver."}
                </Text>
              </View>

              <ActionRow title="Vehicle type" subtitle={selectedVehicle} icon="🚘" onPress={() => setModal("vehicle")} />
              <ActionRow title="Payment method" subtitle={payment} icon="💳" onPress={() => setModal("payment")} />

              {panel === "full" && (
                <View style={styles.notesBox}>
                  <Text style={styles.inputLabel}>Notes for driver</Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    placeholder="Any special instructions"
                    placeholderTextColor={MUTED}
                    style={styles.notesInput}
                  />
                </View>
              )}

              <View style={styles.fareStrip}>
                <View>
                  <Text style={styles.fareLabel}>Estimated fare</Text>
                  <Text style={styles.fareMeta}>{fare.miles.toFixed(1)} miles · {fare.minutes} min</Text>
                </View>
                <Text style={styles.farePrice}>£{fare.total.toFixed(2)}</Text>
              </View>

              <Pressable onPress={() => setModal("confirm")} style={styles.confirmButton}>
                <Text style={styles.confirmText}>Confirm and Request</Text>
                <Text style={styles.confirmArrow}>→</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function MapArea({ title, subtitle, stops, showRoute, expanded, driverCoordinate }: {
  title: string; subtitle: string; stops: string[]; showRoute: boolean; expanded?: boolean;
  driverCoordinate?: { latitude: number; longitude: number } | null;
}) {
  return (
    <View style={[styles.mapArea, expanded && styles.mapAreaExpanded]}>
      <RideMap stops={stops} showRoute={showRoute} driverCoordinate={driverCoordinate} />
      <LinearGradient colors={["rgba(3,3,3,0.78)", "rgba(3,3,3,0.20)", "transparent"]} style={styles.mapShade} />
      <View style={styles.mapTitleBlock}>
        <Text style={styles.mapSmall}>{subtitle}</Text>
        <Text style={styles.mapTitle}>{title}</Text>
      </View>
      <View style={styles.referBar}><Text style={styles.referText}>REFER A FRIEND, EARN £5 →</Text></View>
    </View>
  );
}

function BookingModals({
  modal,
  setModal,
  pickupDate,
  setPickupDate,
  pickupTime,
  setPickupTime,
  selectedVehicle,
  setSelectedVehicle,
  payment,
  setPayment,
  fare,
  isScheduledBooking,
  confirmRequest,
}: {
  modal: ModalType;
  setModal: (v: ModalType) => void;
  pickupDate: string;
  setPickupDate: (v: string) => void;
  pickupTime: string;
  setPickupTime: (v: string) => void;
  selectedVehicle: VehicleCategory;
  setSelectedVehicle: (v: VehicleCategory) => void;
  payment: string;
  setPayment: (v: string) => void;
  fare: { total: number };
  isScheduledBooking: boolean;
  confirmRequest: () => void;
}) {
  const close = () => setModal(null);
  const dates = ["Pickup now", "Today", "Fri, 8 May", "Sat, 9 May", "Sun, 10 May", "Mon, 11 May"];
  const times = ["ETA: 3 min", "+30 min", "+1 hour", "+2 hours", "08:00", "09:30", "12:00", "15:30", "18:30", "21:00"];
  const vehicles: { name: VehicleCategory; sub: string; price: string }[] = [
    { name: "Prestige", sub: "Executive saloon · 1-4 passengers", price: "Best" },
    { name: "Executive XL", sub: "Premium MPV · 1-7 passengers", price: "+£10" },
    { name: "Minibus", sub: "Private group travel · up to 16", price: "+£24" },
    { name: "Coach", sub: "Large group movement", price: "Quote" },
  ];
  const payments = ["Apple Pay", "Google Pay", "Card ending 4242", "Cash"];

  return (
    <Modal visible={!!modal} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />
        <View style={styles.modalSheet}>
          <View style={styles.handle} />

          {modal === "time" && (
            <>
              <Text style={styles.modalTitle}>Pickup time</Text>
              <Text style={styles.modalSub}>Choose now or schedule for later</Text>
              <View style={styles.dialGrid}>
                <ScrollView style={styles.dialColumn} showsVerticalScrollIndicator={false}>
                  {dates.map((d) => <SheetChoice key={d} title={d} active={pickupDate === d} onPress={() => setPickupDate(d)} />)}
                </ScrollView>
                <ScrollView style={styles.dialColumn} showsVerticalScrollIndicator={false}>
                  {times.map((t) => <SheetChoice key={t} title={t} active={pickupTime === t} onPress={() => setPickupTime(t)} />)}
                </ScrollView>
              </View>
              <Pressable style={styles.sheetMainButton} onPress={close}><Text style={styles.sheetMainText}>Confirm time</Text></Pressable>
            </>
          )}

          {modal === "vehicle" && (
            <>
              <Text style={styles.modalTitle}>Vehicle type</Text>
              <Text style={styles.modalSub}>Choose the right vehicle for your journey</Text>
              {vehicles.map((v) => (
                <Pressable key={v.name} onPress={() => setSelectedVehicle(v.name)} style={[styles.vehicleOption, selectedVehicle === v.name && styles.vehicleOptionActive]}>
                  <View style={styles.vehicleIcon}><Text style={styles.vehicleIconText}>🚘</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleOptionTitle}>{v.name}</Text>
                    <Text style={styles.vehicleOptionSub}>{v.sub}</Text>
                  </View>
                  <Text style={styles.vehicleOptionPrice}>{v.price}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.sheetMainButton} onPress={close}><Text style={styles.sheetMainText}>Confirm vehicle</Text></Pressable>
            </>
          )}

          {modal === "payment" && (
            <>
              <Text style={styles.modalTitle}>Payment method</Text>
              <Text style={styles.modalSub}>{isScheduledBooking ? "For scheduled bookings, payment is authorised now and the journey is held for the selected time." : "Payment is held first, then confirmed when the ride is accepted."}</Text>
              {payments.map((p) => <SheetChoice key={p} title={p} active={payment === p} onPress={() => setPayment(p)} />)}
              <Pressable style={styles.sheetMainButton} onPress={close}><Text style={styles.sheetMainText}>Done</Text></Pressable>
            </>
          )}

          {modal === "confirm" && (
            <>
              <Text style={styles.modalTitle}>Confirm request</Text>
              <Text style={styles.modalSub}>Estimated fare: £{fare.total.toFixed(2)}. {isScheduledBooking ? "This scheduled booking will be logged now and dispatched before the pickup time." : "Payment will be authorised, then your app will look for a driver."}</Text>
              <View style={styles.confirmSummary}>
                <Text style={styles.confirmSummaryText}>✓ Route selected</Text>
                <Text style={styles.confirmSummaryText}>✓ Time selected</Text>
                <Text style={styles.confirmSummaryText}>✓ Vehicle selected</Text>
                <Text style={styles.confirmSummaryText}>✓ Payment ready</Text>
              </View>
              <Pressable style={styles.sheetMainButton} onPress={confirmRequest}><Text style={styles.sheetMainText}>Authorise payment and request</Text></Pressable>
            </>
          )}

          {modal === "addFavourite" && (
            <>
              <Text style={styles.modalTitle}>Add favourite</Text>
              <Text style={styles.modalSub}>Save a frequent pickup, drop-off or stop</Text>
              <DarkInput label="Label" value="Airport" />
              <DarkInput label="Address" value="Manchester Airport Terminal 2" />
              <Pressable style={styles.sheetMainButton} onPress={() => { close(); Alert.alert("Saved", "Favourite location added."); }}><Text style={styles.sheetMainText}>Save favourite</Text></Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function SearchingScreen({ bookingId, onFound }: { bookingId: string | null; onFound: () => void }) {
  useEffect(() => {
    if (!bookingId) {
      // No real booking yet (demo mode) — auto-advance after 2.6s
      const t = setTimeout(onFound, 2600);
      return () => clearTimeout(t);
    }
    // Poll until a driver is assigned
    const interval = setInterval(async () => {
      try {
        const data = await trackBooking(bookingId);
        const activeStatuses = ["driver_assigned", "vehicle_assigned", "driver_accepted", "on_route", "arrived_pickup", "passenger_onboard", "in_progress"];
        if (data.status && activeStatuses.includes(data.status)) {
          clearInterval(interval);
          onFound();
        }
      } catch {
        // Keep polling
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [bookingId, onFound]);

  return (
    <View style={styles.screen}>
      <MapArea title="Finding your driver" subtitle="Booking confirmed" stops={[]} showRoute={false} expanded />
      <View style={styles.searchingCard}>
        <View style={styles.spinner} />
        <Text style={styles.searchingTitle}>Looking for a nearby driver</Text>
        <Text style={styles.searchingSub}>Your request is being matched with the best available operator. Scheduled journeys are held and dispatched before pickup time.</Text>
      </View>
    </View>
  );
}

const STATUS_STEPS = [
  { key: "driver_assigned",    label: "Driver assigned" },
  { key: "vehicle_assigned",   label: "Vehicle assigned" },
  { key: "driver_accepted",    label: "Driver accepted" },
  { key: "on_route",           label: "On the way" },
  { key: "arrived_pickup",     label: "Arrived at pickup" },
  { key: "passenger_onboard",  label: "Passenger onboard" },
  { key: "in_progress",        label: "Trip in progress" },
  { key: "completed",          label: "Completed" },
];

function TrackingScreen({ bookingId, go }: { bookingId: string | null; go: (s: Screen) => void }) {
  const [tracking, setTracking] = useState<{
    status: string;
    driverName?: string;
    driverPhone?: string;
    driverLat?: number | null;
    driverLng?: number | null;
  }>({ status: "driver_assigned" });

  useEffect(() => {
    if (!bookingId) return;
    const fetchTracking = async () => {
      try {
        const data = await trackBooking(bookingId);
        setTracking({
          status: data.status,
          driverName: data.driverName,
          driverPhone: data.driverPhone,
        });
      } catch {
        // Keep last known state
      }
    };
    fetchTracking();
    const interval = setInterval(fetchTracking, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === tracking.status);
  const driverCoordinate = null; // Real coords come once Google Maps is wired

  const statusLabel = STATUS_STEPS.find(s => s.key === tracking.status)?.label ?? tracking.status.replace(/_/g, " ");

  return (
    <View style={styles.screen}>
      <MapArea
        title={statusLabel}
        subtitle={tracking.driverName ? `Driver: ${tracking.driverName}` : "Waiting for driver"}
        stops={[]}
        showRoute={tracking.status !== "driver_assigned"}
        driverCoordinate={driverCoordinate}
        expanded
      />
      <View style={styles.trackingSheet}>
        <View style={styles.handle} />
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}><Text style={styles.driverAvatarText}>{tracking.driverName ? tracking.driverName.slice(0, 2).toUpperCase() : "RP"}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{tracking.driverName ?? "Awaiting driver assignment"}</Text>
            <Text style={styles.driverSub}>{tracking.driverPhone ? `📞 ${tracking.driverPhone}` : "Driver will be assigned shortly"}</Text>
          </View>
        </View>
        {STATUS_STEPS.map((s, i) => (
          <View key={s.key} style={styles.statusRow}>
            <View style={[styles.statusDot, i <= currentStepIndex && styles.statusDotActive]} />
            <Text style={[styles.statusText, i <= currentStepIndex && styles.statusTextActive]}>{s.label}</Text>
          </View>
        ))}
        {tracking.status === "completed" && (
          <Pressable style={[styles.sheetMainButton, { marginTop: 12 }]} onPress={() => go("bookings")}>
            <Text style={styles.sheetMainText}>View receipt</Text>
          </Pressable>
        )}
        <Pressable style={styles.secondaryDarkButton} onPress={() => go("home")}><Text style={styles.secondaryDarkText}>Back to home</Text></Pressable>
      </View>
    </View>
  );
}

function ProfileDrawer({ visible, close, go }: { visible: boolean; close: () => void; go: (s: Screen) => void }) {
  const items: { title: string; sub: string; screen: Screen; icon: string }[] = [
    { title: "My bookings", sub: "Upcoming and past rides", screen: "bookings", icon: "📋" },
    { title: "Favourites", sub: "Home, work and saved stops", screen: "favourites", icon: "★" },
    { title: "Payments", sub: "Cards, Apple Pay, receipts", screen: "payments", icon: "💳" },
    { title: "Offers", sub: "Promotions and discounts", screen: "offers", icon: "🎁" },
    { title: "Account", sub: "Personal details", screen: "account", icon: "👤" },
    { title: "Support", sub: "Help and complaints", screen: "support", icon: "💬" },
    { title: "Terms & Conditions", sub: "Policies and privacy", screen: "terms", icon: "📄" },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.drawerBackdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />
        <View style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <Image source={LOGO_MARK} style={styles.drawerLogo} resizeMode="contain" />
            <View style={{ flex: 1 }}><Text style={styles.drawerName}>Ride Prestige</Text><Text style={styles.drawerSub}>Premium customer account</Text></View>
          </View>
          {items.map((item) => (
            <Pressable key={item.title} style={styles.drawerItem} onPress={() => go(item.screen)}>
              <Text style={styles.drawerIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}><Text style={styles.drawerItemTitle}>{item.title}</Text><Text style={styles.drawerItemSub}>{item.sub}</Text></View>
              <Text style={styles.drawerChevron}>→</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function BookingsScreen({ go }: { go: (s: Screen) => void }) {
  const [bookings, setBookings] = useState<Array<{ id: string; bookingRef: string; status: string; pickupPostcode: string; dropoffPostcode: string; createdAt: string; fareAmount?: number }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getBookings().then(setBookings).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCancel = (id: string) => {
    Alert.alert("Cancel booking", "Are you sure you want to cancel this booking?", [
      { text: "No", style: "cancel" },
      { text: "Cancel booking", style: "destructive", onPress: async () => {
        try {
          await cancelBooking(id);
          setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
        } catch { Alert.alert("Error", "Could not cancel booking."); }
      }},
    ]);
  };

  if (loading) return <Page title="My bookings" go={go}><Text style={{ color: "#888", textAlign: "center", marginTop: 40 }}>Loading…</Text></Page>;
  if (bookings.length === 0) return <Page title="My bookings" go={go}><Text style={{ color: "#888", textAlign: "center", marginTop: 40 }}>No bookings yet</Text></Page>;
  return (
    <Page title="My bookings" go={go}>
      {bookings.map((b) => (
        <View key={b.id} style={styles.listCard}>
          <Text style={styles.listPill}>{b.status.replace(/_/g, " ")}</Text>
          <Text style={styles.listTitle}>{b.pickupPostcode} → {b.dropoffPostcode}</Text>
          <Text style={styles.listSub}>{new Date(b.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <Text style={styles.listPrice}>{b.fareAmount ? `£${b.fareAmount}` : "—"}</Text>
            {b.status === "pending" && (
              <Pressable onPress={() => handleCancel(b.id)}>
                <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </Page>
  );
}

function FavouritesScreen({ go, onAdd }: { go: (s: Screen) => void; onAdd: () => void }) {
  const favs = ["Home · 12 Oak Avenue", "Work · City Centre Office", "Airport · Manchester T2"];
  return <Page title="Favourites" go={go} action="Add" onAction={onAdd}>{favs.map((f) => <View key={f} style={styles.listCard}><Text style={styles.listTitle}>{f}</Text><Text style={styles.listSub}>Tap to use as pickup, stop or drop-off</Text></View>)}</Page>;
}

function PaymentsScreen({ go, payment, setPayment }: { go: (s: Screen) => void; payment: string; setPayment: (v: string) => void }) {
  const items = ["Apple Pay", "Google Pay", "Card ending 4242", "Cash"];
  return <Page title="Payments" go={go}>{items.map((p) => <Pressable key={p} style={styles.listCard} onPress={() => setPayment(p)}><Text style={styles.listTitle}>{p}</Text><Text style={styles.listSub}>{payment === p ? "Default payment method" : "Tap to set as default"}</Text></Pressable>)}</Page>;
}

function OffersScreen({ go }: { go: (s: Screen) => void }) {
  return <Page title="Offers" go={go}><View style={styles.offerBig}><Text style={styles.offerValue}>15%</Text><Text style={styles.offerTitle}>Scheduled booking offer</Text><Text style={styles.offerSub}>Book ahead and save on selected journeys this week.</Text></View><View style={styles.listCard}><Text style={styles.listTitle}>Refer a friend</Text><Text style={styles.listSub}>Earn £5 when your friend completes a first ride.</Text></View></Page>;
}

function AccountScreen({ go }: { go: (s: Screen) => void }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then(p => { setFullName(p.fullName); setPhone(p.phone); setEmail(p.email); })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ fullName, phone });
      Alert.alert("Saved", "Profile updated.");
    } catch { Alert.alert("Error", "Could not save profile."); }
    finally { setSaving(false); }
  };

  return (
    <Page title="Account" go={go}>
      <DarkInput label="Full name" value={fullName} onChange={setFullName} />
      <DarkInput label="Phone" value={phone} onChange={setPhone} />
      <DarkInput label="Email" value={email} editable={false} />
      <Pressable style={[styles.confirmButton, { opacity: saving ? 0.6 : 1 }]} onPress={save} disabled={saving}>
        <Text style={styles.confirmText}>{saving ? "Saving…" : "Save changes"}</Text>
        <Text style={styles.confirmArrow}>→</Text>
      </Pressable>
    </Page>
  );
}

function SupportScreen({ go }: { go: (s: Screen) => void }) {
  const [bookingRef, setBookingRef] = useState("");
  const [topic, setTopic] = useState("Booking support");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!topic.trim() || !message.trim()) { Alert.alert("Required", "Please enter a topic and message."); return; }
    setSubmitting(true);
    try {
      await submitSupportTicket({ bookingRef: bookingRef || undefined, topic, message });
      Alert.alert("Submitted", "Your support ticket has been created. We'll be in touch shortly.");
      setBookingRef(""); setTopic("Booking support"); setMessage("");
    } catch { Alert.alert("Error", "Could not submit ticket. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <Page title="Support" go={go}>
      <DarkInput label="Booking reference (optional)" value={bookingRef} onChange={setBookingRef} placeholder="e.g. RP-2026-0001" />
      <DarkInput label="Topic" value={topic} onChange={setTopic} />
      <DarkInput label="Message" value={message} onChange={setMessage} placeholder="Describe your issue…" />
      <Pressable style={[styles.confirmButton, { opacity: submitting ? 0.6 : 1 }]} onPress={submit} disabled={submitting}>
        <Text style={styles.confirmText}>{submitting ? "Submitting…" : "Submit ticket"}</Text>
        <Text style={styles.confirmArrow}>→</Text>
      </Pressable>
    </Page>
  );
}

function TermsScreen({ go }: { go: (s: Screen) => void }) {
  return <Page title="Terms & Conditions" go={go}><View style={styles.termsPaper}><Image source={LOGO} style={styles.termsLogo} resizeMode="contain" /><Text style={styles.termsHeading}>Ride Prestige Terms</Text><Text style={styles.termsText}>Attach your final legal document here. This screen is prepared for booking terms, cancellation policy, refund policy, payment authorisation and privacy information.</Text><Text style={styles.termsText}>Customers should accept these terms before completing payment and ride request.</Text></View></Page>;
}

function InvoiceScreen({ go, fare, vehicle }: { go: (s: Screen) => void; fare: { total: number }; vehicle: VehicleCategory }) {
  return <Page title="Invoice" go={go}><View style={styles.invoicePaper}><Image source={LOGO} style={styles.invoiceLogo} resizeMode="contain" /><Text style={styles.invoiceTitle}>INVOICE</Text><Line label="Booking" value="RP-2049" /><Line label="Vehicle" value={vehicle} /><Line label="Route" value="Sheffield → Meadowhall" /><Line label="Total paid" value={`£${fare.total.toFixed(2)}`} big /></View></Page>;
}

function Page({ title, go, children, action, onAction }: { title: string; go: (s: Screen) => void; children: React.ReactNode; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" backgroundColor={BLACK} />
      <View style={styles.pageHeader}>
        <Pressable onPress={() => go("home")} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.pageTitle}>{title}</Text>
        {action ? <Pressable onPress={onAction}><Text style={styles.pageAction}>{action}</Text></Pressable> : <View style={{ width: 48 }} />}
      </View>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>{children}</ScrollView>
    </View>
  );
}

function LocationInput({ label, value, onChange, icon }: { label: string; value: string; onChange: (v: string) => void; icon: string }) {
  return (
    <View style={styles.locationInput}>
      <Text style={styles.locationIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput value={value} onChangeText={onChange} placeholder={label} placeholderTextColor={MUTED} style={styles.locationTextInput} />
      </View>
    </View>
  );
}

function ActionRow({ title, subtitle, icon, onPress }: { title: string; subtitle: string; icon: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.actionRow}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <View style={{ flex: 1 }}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSub}>{subtitle}</Text></View>
      <Text style={styles.actionArrow}>→</Text>
    </Pressable>
  );
}

function SheetChoice({ title, active, onPress }: { title: string; active?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.sheetChoice, active && styles.sheetChoiceActive]}><Text style={[styles.sheetChoiceText, active && styles.sheetChoiceTextActive]}>{title}</Text><Text style={styles.sheetChoiceTick}>{active ? "✓" : ""}</Text></Pressable>;
}

function DarkInput({ label, value, onChange, editable = true, placeholder }: { label: string; value: string; onChange?: (v: string) => void; editable?: boolean; placeholder?: string }) {
  return <View style={styles.darkInput}><Text style={styles.inputLabel}>{label}</Text><TextInput value={value} onChangeText={onChange} editable={editable && !!onChange} placeholderTextColor={MUTED} placeholder={placeholder} style={[styles.darkTextInput, (!onChange || !editable) && { opacity: 0.5 }]} /></View>;
}

function Line({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return <View style={styles.line}><Text style={styles.lineLabel}>{label}</Text><Text style={[styles.lineValue, big && styles.lineValueBig]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BLACK },
  root: { flex: 1, backgroundColor: BLACK },
  screen: { flex: 1, backgroundColor: BLACK },
  splash: { flex: 1, backgroundColor: BLACK, alignItems: "center", justifyContent: "center" },
  splashLogo: { width: 190, height: 190 },
  mapArea: { height: "75%", backgroundColor: "#111111", overflow: "hidden" },
  mapAreaExpanded: { height: "100%" },
  mapShade: { position: "absolute", left: 0, right: 0, top: 0, height: 170 },
  mapTitleBlock: { position: "absolute", top: 74, left: 18, right: 18 },
  mapSmall: { color: ROSE_GOLD_2, fontSize: 11, fontFamily: FONT_MEDIUM, fontWeight: "600", letterSpacing: 1.2, textTransform: "uppercase" },
  mapTitle: { color: WHITE, fontSize: 22, fontFamily: FONT_MEDIUM, fontWeight: "600", marginTop: 4 },
  topBar: { position: "absolute", top: 18, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topLogo: { width: 38, height: 38, borderRadius: 9 },
  profileButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(3,3,3,0.86)", borderWidth: 1, borderColor: LINE, alignItems: "center", justifyContent: "center" },
  profileButtonText: { color: ROSE_GOLD, fontSize: 22, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  pinCenter: { position: "absolute", top: "30%", alignSelf: "center", alignItems: "center" },
  pinCenterLarge: { top: "43%" },
  pinBubble: { width: 64, height: 64, borderRadius: 32, backgroundColor: WHITE, borderWidth: 5, borderColor: RED, alignItems: "center", justifyContent: "center", shadowColor: BLACK, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  pinBubbleText: { color: BLACK, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  pinStem: { width: 3, height: 26, backgroundColor: RED, borderRadius: 3 },
  referBar: { position: "absolute", left: 0, right: 0, bottom: 0, height: 34, backgroundColor: ROSE_GOLD, alignItems: "center", justifyContent: "center" },
  referText: { color: WHITE, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 12 },
  bookingPanel: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "66%", minHeight: 150, backgroundColor: BLACK_2, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 14, paddingBottom: 10, borderWidth: 1, borderColor: "rgba(215,180,106,0.16)", shadowColor: ROSE_GOLD, shadowOpacity: 0.16, shadowRadius: 28, elevation: 14 },
  panelCollapsed: { maxHeight: 162 },
  panelFull: { maxHeight: "90%" },
  handleTouch: { alignItems: "center", paddingTop: 12, paddingBottom: 10 },
  handle: { width: 58, height: 5, borderRadius: 99, backgroundColor: "#3C4441", alignSelf: "center" },
  dragHint: { color: MUTED, fontSize: 10, fontFamily: FONT_MEDIUM, fontWeight: "600", marginTop: 7, textAlign: "center" },
  panelContent: { paddingBottom: 24 },
  panelTitle: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 23, marginBottom: 12 },
  locationInput: { minHeight: 58, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", marginBottom: 8 },
  locationIcon: { color: RED, fontSize: 14, width: 24, textAlign: "center" },
  inputLabel: { color: MUTED, fontSize: 11, fontFamily: FONT_MEDIUM, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 },
  locationTextInput: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 14, padding: 0 },
  stopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stopInputWrap: { flex: 1 },
  removeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#2B2415", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  removeButtonText: { color: RED, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 22 },
  dropoffRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dropoffField: { flex: 1 },
  addStopButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: CARD_2, borderWidth: 1, borderColor: ROSE_GOLD, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  addStopText: { color: ROSE_GOLD, fontSize: 22, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  expandButton: { marginTop: 8, height: 46, borderRadius: 15, backgroundColor: ROSE_GOLD, alignItems: "center", justifyContent: "center" },
  expandButtonText: { color: WHITE, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  actionRow: { minHeight: 56, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 10 },
  actionIcon: { fontSize: 18, width: 36 },
  actionTitle: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 14 },
  actionSub: { color: MUTED, marginTop: 3, fontFamily: FONT_REGULAR, fontWeight: "600", fontSize: 12 },
  actionArrow: { color: ROSE_GOLD, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 18 },
  notesBox: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE, padding: 12, marginTop: 10 },
  notesInput: { color: TEXT, minHeight: 70, textAlignVertical: "top" },
  fareStrip: { marginTop: 12, borderRadius: 18, borderWidth: 1, borderColor: LINE, backgroundColor: CARD, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fareLabel: { color: MUTED, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 12, textTransform: "uppercase" },
  fareMeta: { color: TEXT, fontFamily: FONT_REGULAR, fontWeight: "600", marginTop: 4 },
  farePrice: { color: ROSE_GOLD, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 22 },
  confirmButton: { height: 56, borderRadius: 18, backgroundColor: RED, marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
  confirmText: { color: BLACK, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 15 },
  confirmArrow: { color: BLACK, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 22 },

  scheduleBanner: { marginTop: 10, borderRadius: 18, borderWidth: 1, borderColor: LINE, backgroundColor: "rgba(215,180,106,0.08)", padding: 14 },
  scheduleBannerActive: { borderColor: ROSE_GOLD, backgroundColor: "rgba(215,180,106,0.14)" },
  scheduleBannerTitle: { color: ROSE_GOLD_2, fontFamily: FONT_MEDIUM, fontWeight: "800", fontSize: 13, letterSpacing: 0.3 },
  scheduleBannerText: { color: MUTED, fontFamily: FONT_REGULAR, fontWeight: "600", fontSize: 12, lineHeight: 18, marginTop: 5 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: BLACK_2, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, paddingBottom: 34, borderWidth: 1, borderColor: LINE, maxHeight: "88%" },
  modalTitle: { color: TEXT, fontSize: 22, fontFamily: FONT_MEDIUM, fontWeight: "600", textAlign: "center", marginTop: 16 },
  modalSub: { color: MUTED, textAlign: "center", marginTop: 7, lineHeight: 20, marginBottom: 16 },
  dialGrid: { flexDirection: "row", gap: 10, height: 260 },
  dialColumn: { flex: 1, backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: LINE, padding: 8 },
  sheetChoice: { minHeight: 50, borderRadius: 14, paddingHorizontal: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetChoiceActive: { backgroundColor: "#2A2314", borderWidth: 1, borderColor: RED },
  sheetChoiceText: { color: MUTED, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  sheetChoiceTextActive: { color: TEXT },
  sheetChoiceTick: { color: ROSE_GOLD, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  sheetMainButton: { height: 56, borderRadius: 18, backgroundColor: ROSE_GOLD, alignItems: "center", justifyContent: "center", marginTop: 14 },
  sheetMainText: { color: BLACK, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 15 },
  vehicleOption: { flexDirection: "row", alignItems: "center", backgroundColor: CARD, borderWidth: 1, borderColor: LINE, borderRadius: 18, padding: 13, marginBottom: 10 },
  vehicleOptionActive: { borderColor: RED, backgroundColor: "#2A2314" },
  vehicleIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: BLACK, alignItems: "center", justifyContent: "center", marginRight: 12 },
  vehicleIconText: { fontSize: 20 },
  vehicleOptionTitle: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 15 },
  vehicleOptionSub: { color: MUTED, marginTop: 4, fontFamily: FONT_REGULAR, fontWeight: "600", fontSize: 12 },
  vehicleOptionPrice: { color: ROSE_GOLD, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  confirmSummary: { backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: LINE, padding: 14 },
  confirmSummaryText: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600", marginVertical: 4 },
  searchingCard: { position: "absolute", left: 16, right: 16, bottom: 28, borderRadius: 24, backgroundColor: BLACK_2, borderWidth: 1, borderColor: LINE, padding: 22, alignItems: "center" },
  spinner: { width: 48, height: 48, borderRadius: 24, borderWidth: 5, borderColor: "#2D3432", borderTopColor: RED, marginBottom: 16 },
  searchingTitle: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 20 },
  searchingSub: { color: MUTED, textAlign: "center", lineHeight: 20, marginTop: 8 },
  trackingSheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: BLACK_2, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 16, paddingBottom: 32, borderTopWidth: 1, borderColor: LINE },
  driverCard: { flexDirection: "row", alignItems: "center", backgroundColor: CARD, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: LINE, marginVertical: 14 },
  driverAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: ROSE_GOLD, alignItems: "center", justifyContent: "center", marginRight: 12 },
  driverAvatarText: { color: BLACK, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  driverName: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  driverSub: { color: MUTED, fontFamily: FONT_REGULAR, fontWeight: "600", marginTop: 3 },
  callButton: { backgroundColor: RED, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  callText: { color: WHITE, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  statusRow: { flexDirection: "row", alignItems: "center", minHeight: 38 },
  statusDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: LINE, marginRight: 10 },
  statusDotActive: { backgroundColor: RED, borderColor: RED },
  statusText: { color: MUTED, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  statusTextActive: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  secondaryDarkButton: { height: 50, borderRadius: 16, backgroundColor: CARD, alignItems: "center", justifyContent: "center", marginTop: 12 },
  secondaryDarkText: { color: ROSE_GOLD, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  drawerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "flex-end" },
  drawer: { width: "82%", height: "100%", backgroundColor: BLACK_2, borderLeftWidth: 1, borderColor: LINE, paddingTop: 58, paddingHorizontal: 16 },
  drawerHeader: { flexDirection: "row", alignItems: "center", paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: LINE, marginBottom: 12 },
  drawerLogo: { width: 42, height: 42, borderRadius: 10, marginRight: 12 },
  drawerName: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 18 },
  drawerSub: { color: MUTED, fontFamily: FONT_REGULAR, fontWeight: "600", marginTop: 3 },
  drawerItem: { minHeight: 68, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: LINE },
  drawerIcon: { width: 34, fontSize: 19 },
  drawerItemTitle: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  drawerItemSub: { color: MUTED, fontSize: 12, marginTop: 3 },
  drawerChevron: { color: ROSE_GOLD, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 18 },
  page: { flex: 1, backgroundColor: BLACK },
  pageHeader: { height: 96, paddingHorizontal: 16, paddingTop: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: LINE },
  backButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  backText: { color: TEXT, fontSize: 38, marginTop: -4 },
  pageTitle: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 18 },
  pageAction: { color: ROSE_GOLD, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  pageContent: { padding: 16, paddingBottom: 40 },
  listCard: { backgroundColor: CARD, borderWidth: 1, borderColor: LINE, borderRadius: 20, padding: 16, marginBottom: 12 },
  listPill: { color: RED, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 12, textTransform: "uppercase" },
  listTitle: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 16, marginTop: 6 },
  listSub: { color: MUTED, fontFamily: FONT_REGULAR, fontWeight: "600", marginTop: 5 },
  listPrice: { color: ROSE_GOLD, fontFamily: FONT_MEDIUM, fontWeight: "600", marginTop: 12 },
  offerBig: { backgroundColor: RED, borderRadius: 26, padding: 22, marginBottom: 14 },
  offerValue: { color: WHITE, fontSize: 42, fontFamily: FONT_MEDIUM, fontWeight: "600" },
  offerTitle: { color: WHITE, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 20 },
  offerSub: { color: "#FFE4EA", marginTop: 7, lineHeight: 20 },
  darkInput: { backgroundColor: CARD, borderWidth: 1, borderColor: LINE, borderRadius: 18, padding: 14, marginBottom: 12 },
  darkTextInput: { color: TEXT, fontFamily: FONT_MEDIUM, fontWeight: "600", padding: 0 },
  termsPaper: { backgroundColor: WHITE, borderRadius: 6, padding: 20, minHeight: 520 },
  termsLogo: { width: 86, height: 65, alignSelf: "center" },
  termsHeading: { color: BLACK, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 22, marginTop: 12 },
  termsText: { color: "#222", lineHeight: 22, marginTop: 14 },
  invoicePaper: { backgroundColor: WHITE, borderRadius: 18, padding: 20 },
  invoiceLogo: { width: 100, height: 64, alignSelf: "center" },
  invoiceTitle: { color: BLACK, fontFamily: FONT_MEDIUM, fontWeight: "600", fontSize: 26, textAlign: "center", marginBottom: 20 },
  line: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EEE", paddingVertical: 12 },
  lineLabel: { color: "#555", fontFamily: FONT_MEDIUM, fontWeight: "600" },
  lineValue: { color: BLACK, fontFamily: FONT_MEDIUM, fontWeight: "600", flex: 1, textAlign: "right" },
  lineValueBig: { color: RED, fontSize: 22 },
});

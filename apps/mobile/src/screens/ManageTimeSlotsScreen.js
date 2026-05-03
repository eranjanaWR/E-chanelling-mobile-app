import React, { useCallback, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DAY_SHORT = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const ManageTimeSlotsScreen = ({ route, navigation }) => {
  const { centerId, centerName } = route.params;

  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({ title: centerName });
  }, [navigation, centerName]);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/doctors/my-profile");
      const center = res.data.doctor?.medicalCenters?.find((c) => c._id === centerId);
      setTimeSlots(center?.timeSlots ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load time slots");
    } finally {
      setLoading(false);
    }
  }, [centerId]);

  useFocusEffect(
    useCallback(() => {
      loadSlots();
    }, [loadSlots])
  );

  const handleAdd = async () => {
    if (!startTime.trim() || !endTime.trim()) {
      setError("Enter both start and end time");
      return;
    }
    setAdding(true);
    setError("");
    try {
      const res = await api.post(`/doctors/medical-centers/${centerId}/time-slots`, {
        day: selectedDay,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
      });
      const center = res.data.doctor?.medicalCenters?.find((c) => c._id === centerId);
      setTimeSlots(center?.timeSlots ?? []);
      setStartTime("");
      setEndTime("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add slot");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (slotId, label) => {
    Alert.alert("Remove Slot", `Delete "${label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await api.delete(
              `/doctors/medical-centers/${centerId}/time-slots/${slotId}`
            );
            const center = res.data.doctor?.medicalCenters?.find((c) => c._id === centerId);
            setTimeSlots(center?.timeSlots ?? []);
          } catch (err) {
            setError(err?.response?.data?.message || "Delete failed");
          }
        },
      },
    ]);
  };

  // Group slots by day in DAYS order
  const slotsByDay = DAYS.reduce((acc, day) => {
    const group = timeSlots.filter((s) => s.day === day);
    if (group.length) acc[day] = group;
    return acc;
  }, {});

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* ── Existing slots ── */}
        <Text style={styles.sectionTitle}>Current Time Slots</Text>

        {Object.keys(slotsByDay).length === 0 ? (
          <Text style={styles.emptyText}>No time slots added yet.</Text>
        ) : (
          Object.entries(slotsByDay).map(([day, slots]) => (
            <View key={day} style={styles.dayGroup}>
              <Text style={styles.dayLabel}>{day}</Text>
              {slots.map((slot) => {
                const label = `${slot.startTime} – ${slot.endTime}`;
                return (
                  <View key={slot._id} style={styles.slotRow}>
                    <Text style={styles.slotTime}>{label}</Text>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(slot._id, `${day} ${label}`)}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))
        )}

        <View style={styles.divider} />

        {/* ── Add slot form ── */}
        <Text style={styles.sectionTitle}>Add Time Slot</Text>

        <Text style={styles.label}>Day</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayPicker}
        >
          {DAYS.map((d) => (
            <Pressable
              key={d}
              style={[styles.dayBtn, selectedDay === d && styles.dayBtnActive]}
              onPress={() => setSelectedDay(d)}
            >
              <Text style={selectedDay === d ? styles.dayBtnTextActive : styles.dayBtnText}>
                {DAY_SHORT[d]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.label}>Start Time</Text>
            <TextInput
              style={styles.input}
              placeholder="09:00"
              value={startTime}
              onChangeText={setStartTime}
              maxLength={5}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={styles.timeField}>
            <Text style={styles.label}>End Time</Text>
            <TextInput
              style={styles.input}
              placeholder="12:00"
              value={endTime}
              onChangeText={setEndTime}
              maxLength={5}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        <Text style={styles.hint}>24-hour format  ·  e.g. 09:00, 13:30, 17:00</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.btn, adding && styles.btnDisabled]}
          onPress={handleAdd}
          disabled={adding}
        >
          <Text style={styles.btnText}>{adding ? "Adding…" : `Add Slot on ${selectedDay}`}</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 12 },
  emptyText: { color: "#9ca3af", textAlign: "center", marginBottom: 8 },

  dayGroup: { marginBottom: 12 },
  dayLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  slotTime: { flex: 1, fontSize: 15, color: "#111827", fontWeight: "500" },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { color: "#ef4444", fontWeight: "700", fontSize: 12 },

  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 20 },

  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 4 },

  dayPicker: { marginBottom: 16 },
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  dayBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
  dayBtnText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  dayBtnTextActive: { fontSize: 13, fontWeight: "600", color: "#fff" },

  timeRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  timeField: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    letterSpacing: 1,
  },

  hint: { fontSize: 12, color: "#9ca3af", marginBottom: 8 },
  errorText: { color: "#ef4444", fontSize: 13, marginBottom: 8 },

  btn: {
    backgroundColor: "#111827",
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});

export default ManageTimeSlotsScreen;

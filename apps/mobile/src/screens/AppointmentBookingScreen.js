import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import api from "../services/api";
import { scheduleAppointmentReminders } from "../services/notifications";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateOption = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const AppointmentBookingScreen = ({ route, navigation }) => {
  const { doctor } = route.params || {};
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [nextQueueNumber, setNextQueueNumber] = useState(null);
  const [loadingQueueNumber, setLoadingQueueNumber] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const dateOptions = useMemo(() => {
    if (!selectedDay) return [];
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetIndex = dayNames.indexOf(selectedDay.toLowerCase());
    if (targetIndex === -1) return [];

    const options = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (let i = 0; i < 45 && options.length < 6; i += 1) {
      const candidate = new Date(cursor);
      candidate.setDate(cursor.getDate() + i);
      if (candidate.getDay() === targetIndex) {
        const iso = candidate.toISOString().slice(0, 10);
        options.push(iso);
      }
    }

    return options;
  }, [selectedDay]);

  const availableSlots = useMemo(() => {
    if (!doctor) return [];
    const slots = [];

    if (Array.isArray(doctor.medicalCenters)) {
      doctor.medicalCenters.forEach((center) => {
        (center.timeSlots || []).forEach((slot) => {
          slots.push({
            centerName: center.name,
            centerLocation: center.location || "",
            consultationFee: center.consultationFee ?? null,
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        });
      });
    }

    if (!slots.length && Array.isArray(doctor.availability)) {
      doctor.availability.forEach((item) => {
        (item.slots || []).forEach((slotText) => {
          slots.push({ day: item.day, label: slotText });
        });
      });
    }

    return slots;
  }, [doctor]);

  useEffect(() => {
    const fetchQueue = async () => {
      setNextQueueNumber(null);
      if (!doctor?._id) return;
      const trimmedDate = appointmentDate.trim();
      if (!trimmedDate) return;
      const parsedDate = new Date(trimmedDate);
      if (Number.isNaN(parsedDate.getTime())) return;

      setLoadingQueueNumber(true);
      try {
        const res = await api.get("/appointments/next-queue", {
          params: {
            doctorId: doctor._id,
            appointmentDate: parsedDate.toISOString(),
          },
        });
        setNextQueueNumber(res.data.queueNumber);
      } catch (err) {
        setNextQueueNumber(null);
      } finally {
        setLoadingQueueNumber(false);
      }
    };

    fetchQueue();
  }, [appointmentDate, doctor]);

  const handleBook = async () => {
    setError("");
    setSuccess("");

    if (!doctor?._id) {
      setError("Doctor details are missing");
      return;
    }

    if (!appointmentDate.trim() || !timeSlot.trim()) {
      setError("Date and time slot are required");
      return;
    }

    const parsedDate = new Date(appointmentDate.trim());
    if (Number.isNaN(parsedDate.getTime())) {
      setError("Enter a valid date (YYYY-MM-DD)");
      return;
    }

    try {
      const res = await api.post("/appointments", {
        doctorId: doctor._id,
        appointmentDate: parsedDate.toISOString(),
        timeSlot: timeSlot.trim(),
      });
      await scheduleAppointmentReminders(parsedDate, doctor?.name);
      setAppointmentDate("");
      setTimeSlot("");
      setNextQueueNumber(null);
      navigation.navigate("Payment", {
        appointmentId: res.data.appointment._id,
        doctor,
        appointmentDate: appointmentDate.trim(),
        timeSlot: timeSlot.trim(),
        consultationFee: selectedCenter?.consultationFee ?? null,
        centerName: selectedCenter?.name ?? null,
        centerLocation: selectedCenter?.location ?? null,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to book appointment");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book appointment</Text>
      <Text style={styles.subtitle}>{doctor?.name}</Text>

      {doctor?.createdAt ? (
        <Text style={styles.metaText}>
          Doctor added on {formatDate(doctor.createdAt)}
        </Text>
      ) : null}
      {doctor?.availabilityDate ? (
        <Text style={styles.metaText}>
          Available from {doctor.availabilityDate}
        </Text>
      ) : null}

      {availableSlots.length > 0 ? (
        <View style={styles.slotSection}>
          <Text style={styles.sectionTitle}>Available Slots</Text>
          <FlatList
            data={availableSlots}
            keyExtractor={(_, index) => `${index}-${_.centerName || _.day}-${_.startTime || _.label}`}
            renderItem={({ item }) => {
              const label = item.label
                ? `${item.day} · ${item.label}`
                : `${item.day} · ${item.startTime} - ${item.endTime}`;
              const subtitle = item.centerName
                ? item.centerLocation
                  ? `${item.centerName} · ${item.centerLocation}`
                  : item.centerName
                : "";
              return (
                <Pressable
                  style={[styles.slotButton, timeSlot === label && styles.slotButtonActive]}
                  onPress={() => {
                    const newDay = item.day || "";
                    if (newDay !== selectedDay) {
                      setAppointmentDate("");
                    }
                    setTimeSlot(label);
                    setSelectedDay(newDay);
                    setShowDateOptions(true);
                    setSelectedCenter(
                      item.centerName
                        ? { name: item.centerName, location: item.centerLocation, consultationFee: item.consultationFee }
                        : null
                    );
                  }}
                >
                  <View>
                    <Text style={[styles.slotText, timeSlot === label && styles.slotTextActive]}>{label}</Text>
                    {subtitle ? <Text style={[styles.slotSubtitle, timeSlot === label && styles.slotSubtitleActive]}>{subtitle}</Text> : null}
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      ) : (
        <Text style={styles.hintText}>No time slots available for this doctor yet.</Text>
      )}

      {selectedDay ? (
        <View style={styles.selectorBlock}>
          <Text style={styles.sectionTitle}>Select {selectedDay} Date</Text>
          <Pressable
            style={styles.selector}
            onPress={() => setShowDateOptions((prev) => !prev)}
          >
            <Text style={appointmentDate ? styles.selectorText : styles.selectorPlaceholder}>
              {appointmentDate ? formatDateOption(appointmentDate) : `Choose a ${selectedDay}`}
            </Text>
            <Text style={styles.chevron}>{showDateOptions ? "▲" : "▼"}</Text>
          </Pressable>

          {showDateOptions && (
            <View style={styles.dropdown}>
              {dateOptions.map((date) => (
                <Pressable
                  key={date}
                  style={[
                    styles.dropdownItem,
                    appointmentDate === date && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setAppointmentDate(date);
                    setShowDateOptions(false);
                  }}
                >
                  <Text style={appointmentDate === date ? styles.dropdownTextActive : styles.dropdownText}>
                    {formatDateOption(date)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {loadingQueueNumber ? (
        <View style={styles.queueRow}>
          <ActivityIndicator size="small" color="#111827" />
          <Text style={styles.queueLoadingText}>Checking queue number...</Text>
        </View>
      ) : nextQueueNumber !== null ? (
        <Text style={styles.queueText}>Next queue number: {nextQueueNumber}</Text>
      ) : (
        <Text style={styles.metaText}>Queue number will be assigned automatically.</Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={handleBook}>
        <Text style={styles.primaryButtonText}>Confirm Booking</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    color: "#6b7280",
  },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  metaText: {
    color: "#6b7280",
    marginBottom: 12,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  selectorBlock: {
    marginBottom: 12,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#ffffff",
  },
  selectorText: { fontSize: 15, color: "#111827" },
  selectorPlaceholder: { fontSize: 15, color: "#9ca3af" },
  chevron: { fontSize: 12, color: "#6b7280" },
  dropdown: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    marginTop: 6,
    overflow: "hidden",
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  dropdownItemActive: { backgroundColor: "#111827" },
  dropdownText: { fontSize: 15, color: "#111827" },
  dropdownTextActive: { fontSize: 15, color: "#ffffff", fontWeight: "600" },
  slotSection: {
    marginBottom: 16,
  },
  slotButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  slotButtonActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  slotText: {
    fontWeight: "600",
    color: "#111827",
  },
  slotTextActive: {
    color: "#ffffff",
  },
  slotSubtitle: {
    marginTop: 4,
    color: "#6b7280",
    fontSize: 13,
  },
  slotSubtitleActive: {
    color: "#d1d5db",
  },
  hintText: {
    color: "#6b7280",
    marginBottom: 12,
  },
  queueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  queueLoadingText: {
    color: "#6b7280",
    marginLeft: 10,
  },
  queueText: {
    color: "#111827",
    marginBottom: 12,
    fontWeight: "700",
  },
  error: {
    color: "#ef4444",
    marginBottom: 8,
  },
  success: {
    color: "#10b981",
    marginBottom: 8,
  },
});

export default AppointmentBookingScreen;

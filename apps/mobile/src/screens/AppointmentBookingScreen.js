import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toIsoDate = (date) => date.toISOString().slice(0, 10);

const getUpcomingDatesForDay = (dayName, count = 8) => {
  if (!dayName) return [];
  const targetIndex = WEEKDAYS.indexOf(dayName);
  if (targetIndex < 0) return [];

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const offset = (targetIndex - start.getDay() + 7) % 7;
  const firstDate = new Date(start);
  firstDate.setDate(start.getDate() + offset);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() + index * 7);
    return {
      value: toIsoDate(date),
      label: date.toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
  });
};

const extractDayFromLabel = (label) => {
  if (!label) return "";
  const day = label.split("·")[0]?.trim();
  return WEEKDAYS.includes(day) ? day : "";
};

const getAvailabilityLabel = (doctor) => {
  if (!doctor) return "";
  if (doctor.availabilityStatus === "available" && doctor.availabilityDate) {
    const today = toIsoDate(new Date());
    return doctor.availabilityDate === today
      ? "Available today"
      : `Available on ${doctor.availabilityDate}`;
  }
  if (doctor.availabilityStatus === "unavailable") {
    return "Unavailable";
  }
  return "";
};

const AppointmentBookingScreen = ({ route, navigation }) => {
  const { doctor } = route.params || {};
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [nextQueueNumber, setNextQueueNumber] = useState(null);
  const [loadingQueueNumber, setLoadingQueueNumber] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const availableSlots = useMemo(() => {
    if (!doctor) return [];
    const slots = [];

    if (Array.isArray(doctor.medicalCenters)) {
      doctor.medicalCenters.forEach((center) => {
        (center.timeSlots || []).forEach((slot) => {
          slots.push({
            centerName: center.name,
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

  const dateOptions = useMemo(() => getUpcomingDatesForDay(selectedDay), [selectedDay]);

  const handleTimeSlotChange = (value) => {
    setTimeSlot(value);
    const inferredDay = extractDayFromLabel(value);
    if (inferredDay) {
      setSelectedDay(inferredDay);
      setAppointmentDate("");
      setShowDateOptions(true);
    }
  };

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
      await api.post("/appointments", {
        doctorId: doctor._id,
        appointmentDate: parsedDate.toISOString(),
        timeSlot: timeSlot.trim(),
      });
      await scheduleAppointmentReminders(parsedDate, doctor?.name);
      setSuccess("Appointment booked successfully");
      setAppointmentDate("");
      setTimeSlot("");
      setNextQueueNumber(null);
      navigation.navigate("Dashboard");
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
      {getAvailabilityLabel(doctor) ? (
        <Text style={styles.metaText}>{getAvailabilityLabel(doctor)}</Text>
      ) : null}

      <Pressable
        style={styles.input}
        onPress={() => {
          if (dateOptions.length) {
            setShowDateOptions((prev) => !prev);
          }
        }}
      >
        <Text style={appointmentDate ? styles.inputText : styles.placeholderText}>
          {appointmentDate || "Select date"}
        </Text>
      </Pressable>
      {selectedDay && dateOptions.length > 0 ? (
        <View style={styles.dropdown}>
          {showDateOptions ? (
            <FlatList
              data={dateOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => {
                    setAppointmentDate(item.value);
                    setShowDateOptions(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{item.label}</Text>
                </Pressable>
              )}
            />
          ) : (
            <Text style={styles.hintText}>Tap to pick a {selectedDay} date.</Text>
          )}
        </View>
      ) : (
        <Text style={styles.hintText}>Select a time slot to see dates.</Text>
      )}
      <TextInput
        style={styles.input}
        placeholder="Time slot (e.g. 09:00 AM)"
        value={timeSlot}
        onChangeText={handleTimeSlotChange}
      />

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
              const subtitle = item.centerName ? item.centerName : "";
              return (
                <Pressable
                  style={styles.slotButton}
                  onPress={() => {
                    setTimeSlot(label);
                    setSelectedDay(item.day);
                    setAppointmentDate("");
                    setShowDateOptions(true);
                  }}
                >
                  <View>
                    <Text style={styles.slotText}>{label}</Text>
                    {subtitle ? <Text style={styles.slotSubtitle}>{subtitle}</Text> : null}
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      ) : (
        <Text style={styles.hintText}>No time slots available for this doctor yet.</Text>
      )}

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
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  inputText: {
    color: "#111827",
  },
  placeholderText: {
    color: "#9ca3af",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dropdownText: {
    color: "#111827",
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
  slotText: {
    fontWeight: "600",
    color: "#111827",
  },
  slotSubtitle: {
    marginTop: 4,
    color: "#6b7280",
    fontSize: 13,
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

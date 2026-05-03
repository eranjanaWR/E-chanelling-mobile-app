import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import api from "../services/api";
import { scheduleAppointmentReminders } from "../services/notifications";

const AppointmentBookingScreen = ({ route, navigation }) => {
  const { doctor } = route.params || {};
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      navigation.navigate("Dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to book appointment");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book appointment</Text>
      <Text style={styles.subtitle}>{doctor?.name}</Text>

      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={appointmentDate}
        onChangeText={setAppointmentDate}
      />
      <TextInput
        style={styles.input}
        placeholder="Time slot (e.g. 09:00 AM)"
        value={timeSlot}
        onChangeText={setTimeSlot}
      />

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

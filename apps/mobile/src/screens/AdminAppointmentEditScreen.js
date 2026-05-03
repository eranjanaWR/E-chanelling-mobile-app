import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import api from "../services/api";

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const AdminAppointmentEditScreen = ({ navigation, route }) => {
  const { appointment } = route.params;
  const initialDate = useMemo(() => toDateInput(appointment.appointmentDate), [appointment]);
  const [appointmentDate, setAppointmentDate] = useState(initialDate);
  const [timeSlot, setTimeSlot] = useState(appointment.timeSlot || "");
  const [status, setStatus] = useState(appointment.status || "pending");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setError("");
    if (!appointmentDate) {
      setError("Enter a valid date (YYYY-MM-DD)");
      return;
    }

    try {
      setIsSaving(true);
      await api.put(`/appointments/${appointment._id}`, {
        appointmentDate,
        timeSlot,
        status,
      });
      Alert.alert("Saved", "Appointment updated", [{ text: "OK" }]);
      navigation.goBack();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update appointment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Appointment</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Doctor: {appointment.doctor?.name || "Doctor"}</Text>
        <Text style={styles.infoText}>Patient: {appointment.patient?.name || "Patient"}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Appointment date (YYYY-MM-DD)"
        value={appointmentDate}
        onChangeText={setAppointmentDate}
      />
      <TextInput
        style={styles.input}
        placeholder="Time slot (e.g. 09:30-10:00)"
        value={timeSlot}
        onChangeText={setTimeSlot}
      />
      <TextInput
        style={styles.input}
        placeholder="Status (pending/confirmed/cancelled)"
        value={status}
        onChangeText={setStatus}
      />

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
        <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save"}</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 12,
  },
  saveButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  error: {
    color: "#ef4444",
    marginBottom: 12,
  },
});

export default AdminAppointmentEditScreen;

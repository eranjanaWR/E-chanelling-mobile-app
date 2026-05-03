import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import api from "../services/api";

const AdminAppointmentCreateScreen = ({ navigation }) => {
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    setError("");

    if (!patientId || !doctorId || !appointmentDate || !timeSlot) {
      setError("Patient ID, Doctor ID, Date, and Time Slot are required");
      return;
    }

    if (patientId.trim().length !== 24 || doctorId.trim().length !== 24) {
      setError("Patient ID and Doctor ID must be 24-character IDs");
      return;
    }

    try {
      setIsSaving(true);
      await api.post("/appointments/admin", {
        patientId: patientId.trim(),
        doctorId: doctorId.trim(),
        appointmentDate,
        timeSlot,
        status,
      });
      Alert.alert("Created", "Appointment created", [{ text: "OK" }]);
      navigation.goBack();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create appointment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Appointment</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Patient ID"
        value={patientId}
        onChangeText={setPatientId}
      />
      <TextInput
        style={styles.input}
        placeholder="Doctor ID"
        value={doctorId}
        onChangeText={setDoctorId}
      />
      <Text style={styles.helperText}>Use the Mongo ID shown in Users and Doctors lists.</Text>
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

      <Pressable style={styles.saveButton} onPress={handleCreate} disabled={isSaving}>
        <Text style={styles.saveButtonText}>{isSaving ? "Creating..." : "Create"}</Text>
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
  helperText: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 12,
  },
});

export default AdminAppointmentCreateScreen;

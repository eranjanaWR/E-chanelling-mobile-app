import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import api from "../services/api";

const DoctorSearchScreen = ({ navigation }) => {
  const [specialty, setSpecialty] = useState("");
  const [day, setDay] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setError("");
    try {
      const response = await api.get("/doctors", {
        params: {
          specialty: specialty.trim() || undefined,
          day: day.trim() || undefined,
        },
      });
      setDoctors(response.data.doctors || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load doctors");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a doctor</Text>

      <TextInput
        style={styles.input}
        placeholder="Specialty (e.g. Cardiology)"
        value={specialty}
        onChangeText={setSpecialty}
      />
      <TextInput
        style={styles.input}
        placeholder="Availability day (e.g. Monday)"
        value={day}
        onChangeText={setDay}
      />

      <Pressable style={styles.primaryButton} onPress={handleSearch}>
        <Text style={styles.primaryButtonText}>Search</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{item.specialty}</Text>
            <Pressable
              style={styles.cardButton}
              onPress={() => navigation.navigate("AppointmentBooking", { doctor: item })}
            >
              <Text style={styles.cardButtonText}>Book</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No doctors found yet.</Text>}
      />
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
    marginBottom: 12,
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
  },
  primaryButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: "#6b7280",
    marginTop: 4,
  },
  cardButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 12,
  },
  cardButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  error: {
    color: "#ef4444",
    marginTop: 8,
  },
  emptyText: {
    marginTop: 16,
    textAlign: "center",
    color: "#6b7280",
  },
});

export default DoctorSearchScreen;

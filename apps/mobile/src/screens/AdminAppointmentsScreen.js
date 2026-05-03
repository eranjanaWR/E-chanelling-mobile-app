import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

const AdminAppointmentsScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);

  const loadAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get("/appointments");
      setAppointments(response.data?.appointments || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  const handleDelete = (appointmentId) => {
    Alert.alert("Delete appointment", "This will remove the appointment permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setError("");
            await api.delete(`/appointments/${appointmentId}`);
            setAppointments((prev) => prev.filter((item) => item._id !== appointmentId));
          } catch (err) {
            setError(err?.response?.data?.message || "Failed to delete appointment");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={styles.createButton}
        onPress={() => navigation.navigate("AdminAppointmentCreate")}
      >
        <Text style={styles.createButtonText}>Create appointment</Text>
      </Pressable>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.doctor?.name || "Doctor"}</Text>
            <Text style={styles.cardMeta}>Specialty: {item.doctor?.specialty || "N/A"}</Text>
            <Text style={styles.cardMeta}>Patient: {item.patient?.name || "N/A"}</Text>
            <Text style={styles.cardMeta}>Email: {item.patient?.email || "N/A"}</Text>
            <Text style={styles.cardMeta}>
              {item.appointmentDate} · {item.timeSlot}
            </Text>
            <Text style={styles.cardMeta}>Status: {item.status}</Text>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionButton, styles.editButton]}
                onPress={() => navigation.navigate("AdminAppointmentEdit", { appointment: item })}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item._id)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No appointments found yet.</Text>}
        contentContainerStyle={appointments.length ? null : styles.emptyContainer}
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
  createButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 16,
  },
  createButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
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
  cardMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#2563eb",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  error: {
    color: "#ef4444",
    marginBottom: 12,
  },
});

export default AdminAppointmentsScreen;

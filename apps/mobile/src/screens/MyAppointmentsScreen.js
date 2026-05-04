import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
};

const MyAppointmentsScreen = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/appointments");
      setAppointments(response.data?.appointments || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  const handleComplete = async (appointmentId) => {
    setUpdatingId(appointmentId);
    setError("");
    try {
      await api.patch(`/appointments/${appointmentId}/complete`);
      await loadAppointments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to complete appointment");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const dateLabel = formatDate(item.appointmentDate);
          const isDoctor = user?.role === "doctor";
          const title = isDoctor
            ? item.patient?.name || "Patient"
            : item.doctor?.name || "Doctor";
          const subtitle = isDoctor
            ? item.patient?.email || ""
            : item.doctor?.specialty || "";

          const isCompleted = item.status === "completed";
          const canComplete = isDoctor && !isCompleted && item.status !== "cancelled";

          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{title}</Text>
              {subtitle ? <Text style={styles.cardMeta}>{subtitle}</Text> : null}
              <Text style={styles.cardMeta}>Date: {dateLabel || "N/A"}</Text>
              <Text style={styles.cardMeta}>Time: {item.timeSlot || "N/A"}</Text>
              <Text style={styles.cardMeta}>Status: {item.status || "pending"}</Text>
              {canComplete ? (
                <Pressable
                  style={[styles.completeButton, updatingId === item._id && styles.btnDisabled]}
                  onPress={() => handleComplete(item._id)}
                  disabled={updatingId === item._id}
                >
                  <Text style={styles.completeButtonText}>
                    {updatingId === item._id ? "Completing..." : "Mark Completed"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No appointments found.</Text>}
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
  completeButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  completeButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default MyAppointmentsScreen;

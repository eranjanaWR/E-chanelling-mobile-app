import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const AdminDashboardScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctorCount, setDoctorCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [doctorResponse, appointmentResponse] = await Promise.all([
          api.get("/doctors"),
          api.get("/appointments"),
        ]);

        const doctors = doctorResponse.data?.doctors || [];
        const appointments = appointmentResponse.data?.appointments || [];

        setDoctorCount(doctors.length);
        setAppointmentCount(appointments.length);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load admin dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Overview of current activity</Text>

      {isLoading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Doctors</Text>
              <Text style={styles.statValue}>{doctorCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Appointments</Text>
              <Text style={styles.statValue}>{appointmentCount}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionButton}
              onPress={() => navigation.navigate("AdminUsers")}
            >
              <Text style={styles.actionButtonText}>Users</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => navigation.navigate("AdminDoctors")}
            >
              <Text style={styles.actionButtonText}>Doctors</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => navigation.navigate("AdminAppointments")}
            >
              <Text style={styles.actionButtonText}>Appointments</Text>
            </Pressable>
          </View>

          <Pressable style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </>
      )}
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
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  loadingCard: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionButtonText: {
    fontWeight: "600",
    color: "#111827",
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
  },
  logoutButton: {
    paddingVertical: 12,
  },
  logoutButtonText: {
    textAlign: "center",
    color: "#ef4444",
    fontWeight: "600",
  },
  error: {
    color: "#ef4444",
    marginBottom: 12,
  },
});

export default AdminDashboardScreen;

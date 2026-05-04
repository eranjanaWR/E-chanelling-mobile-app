import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const DashboardScreen = ({ navigation, route }) => {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [appointmentError, setAppointmentError] = useState("");
  const [paidAppointmentIds, setPaidAppointmentIds] = useState(new Set());
  const [paymentSuccess, setPaymentSuccess] = useState("");

  const loadAppointments = useCallback(async () => {
    if (user?.role !== "patient") return;
    setAppointmentError("");
    try {
      const response = await api.get("/appointments");
      setAppointments(response.data?.appointments || []);
    } catch (err) {
      setAppointmentError(err?.response?.data?.message || "Failed to load appointments");
    }
  }, [user?.role]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
      const paidId = route?.params?.paidAppointmentId;
      if (paidId) {
        setPaidAppointmentIds((prev) => new Set(prev).add(paidId));
        setPaymentSuccess("Payment successfully completed.");
        navigation.setParams({ paidAppointmentId: undefined });
      }
    }, [loadAppointments])
  );

  const goToProfile = () => {
    if (user?.role === "doctor") {
      navigation.navigate("DoctorProfile");
    } else {
      navigation.navigate("PatientProfile");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>{user?.name || "User"}</Text>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("DoctorSearch")}>
        <Text style={styles.primaryButtonText}>Search Doctors</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={goToProfile}>
        <Text style={styles.secondaryButtonText}>Manage Profile</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("MyAppointments")}
      >
        <Text style={styles.secondaryButtonText}>My Appointments</Text>
      </Pressable>

      {user?.role === "patient" && (
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("ViewMedicineStrip")}>
          <Text style={styles.secondaryButtonText}>View Medicine Strip</Text>
        </Pressable>
      )}

      {user?.role === "patient" ? (
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payments</Text>
          {paymentSuccess ? <Text style={styles.successText}>{paymentSuccess}</Text> : null}
          {appointmentError ? (
            <Text style={styles.errorText}>{appointmentError}</Text>
          ) : null}
          {appointments
            .filter((appointment) => appointment.status === "completed" && appointment.amount)
            .map((appointment) => (
              <View style={styles.paymentCard} key={appointment._id}>
                <Text style={styles.paymentTitle}>
                  {appointment.doctor?.name || "Doctor"}
                </Text>
                <Text style={styles.paymentMeta}>Amount: Rs. {appointment.amount}</Text>
                {paidAppointmentIds.has(appointment._id) ? (
                  <Text style={styles.paidText}>Paid</Text>
                ) : (
                  <Pressable
                    style={styles.payButton}
                    onPress={() =>
                      navigation.navigate("Payment", {
                        amount: appointment.amount,
                        doctorName: appointment.doctor?.name,
                        appointmentId: appointment._id,
                      })
                    }
                  >
                    <Text style={styles.payButtonText}>Pay</Text>
                  </Pressable>
                )}
              </View>
            ))}
          {!appointmentError &&
          !appointments.some(
            (appointment) => appointment.status === "completed" && appointment.amount
          ) ? (
            <Text style={styles.emptyText}>No pending payments.</Text>
          ) : null}
        </View>
      ) : null}

      {user?.role === "doctor" && (
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("PatientList")}>
          <Text style={styles.secondaryButtonText}>Medicine Strip</Text>
        </Pressable>
      )}

      <Pressable style={styles.ghostButton} onPress={logout}>
        <Text style={styles.ghostButtonText}>Logout</Text>
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
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  secondaryButtonText: {
    textAlign: "center",
    fontWeight: "600",
  },
  ghostButton: {
    paddingVertical: 12,
  },
  ghostButtonText: {
    textAlign: "center",
    color: "#ef4444",
  },
  paymentSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  paymentCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  paymentTitle: {
    fontWeight: "700",
  },
  paymentMeta: {
    color: "#6b7280",
    marginTop: 4,
  },
  payButton: {
    marginTop: 8,
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingVertical: 10,
  },
  payButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  emptyText: {
    color: "#6b7280",
    marginTop: 4,
  },
  errorText: {
    color: "#ef4444",
    marginBottom: 6,
  },
  successText: {
    color: "#16a34a",
    marginBottom: 6,
    fontWeight: "600",
  },
  paidText: {
    marginTop: 8,
    color: "#16a34a",
    fontWeight: "600",
  },
});

export default DashboardScreen;

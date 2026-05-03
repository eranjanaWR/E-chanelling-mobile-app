import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

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
});

export default DashboardScreen;

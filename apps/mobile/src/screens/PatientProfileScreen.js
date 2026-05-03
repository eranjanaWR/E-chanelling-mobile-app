import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const PatientProfileScreen = () => {
  const { refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [message, setMessage] = useState("");

  const loadProfile = useCallback(async () => {
    setMessage("");
    try {
      const response = await api.get("/profile");
      const profile = response.data.user || {};
      setName(profile.name || "");
      setContactNumber(profile.contactNumber || "");
      setMedicalHistory(profile.medicalHistory || "");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load profile");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSave = async () => {
    setMessage("");
    try {
      await api.patch("/profile", {
        name: name.trim(),
        contactNumber: contactNumber.trim(),
        medicalHistory: medicalHistory.trim(),
      });
      await refreshProfile();
      setMessage("Profile updated");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Update failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact number"
        value={contactNumber}
        onChangeText={setContactNumber}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Medical history"
        value={medicalHistory}
        onChangeText={setMedicalHistory}
        multiline
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={handleSave}>
        <Text style={styles.primaryButtonText}>Save Changes</Text>
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
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: "top",
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
  message: {
    color: "#2563eb",
    marginBottom: 8,
  },
});

export default PatientProfileScreen;

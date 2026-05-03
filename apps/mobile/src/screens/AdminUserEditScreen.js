import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import api from "../services/api";

const AdminUserEditScreen = ({ navigation, route }) => {
  const { user } = route.params;
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [role, setRole] = useState(user.role || "patient");
  const [contactNumber, setContactNumber] = useState(user.contactNumber || "");
  const [age, setAge] = useState(user.age ? String(user.age) : "");
  const [gender, setGender] = useState(user.gender || "");
  const [address, setAddress] = useState(user.address || "");
  const [medicalHistory, setMedicalHistory] = useState(user.medicalHistory || "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setError("");
    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }

    try {
      setIsSaving(true);
      await api.put(`/users/${user._id}`, {
        name,
        email,
        role,
        contactNumber,
        age: age ? Number(age) : undefined,
        gender,
        address,
        medicalHistory,
      });
      Alert.alert("Saved", "User profile updated", [{ text: "OK" }]);
      navigation.goBack();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit User</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Role (patient/doctor/admin)"
        autoCapitalize="none"
        value={role}
        onChangeText={setRole}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact number"
        keyboardType="phone-pad"
        value={contactNumber}
        onChangeText={setContactNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="Age"
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />
      <TextInput
        style={styles.input}
        placeholder="Gender (Male/Female/Other)"
        value={gender}
        onChangeText={setGender}
      />
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Medical history"
        value={medicalHistory}
        onChangeText={setMedicalHistory}
        multiline
        textAlignVertical="top"
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
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
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

export default AdminUserEditScreen;

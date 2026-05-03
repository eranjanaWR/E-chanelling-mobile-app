import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";

const SignupScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [role, setRole] = useState("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Registration failed";
      setError(message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      <View style={styles.roleRow}>
        <Pressable
          style={[styles.roleButton, role === "patient" && styles.roleButtonActive]}
          onPress={() => setRole("patient")}
        >
          <Text style={role === "patient" ? styles.roleTextActive : styles.roleText}>Patient</Text>
        </Pressable>
        <Pressable
          style={[styles.roleButton, role === "doctor" && styles.roleButtonActive]}
          onPress={() => setRole("doctor")}
        >
          <Text style={role === "doctor" ? styles.roleTextActive : styles.roleText}>Doctor</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
      />
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
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={handleSignup}>
        <Text style={styles.primaryButtonText}>Create Account</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#ffffff",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  roleRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  roleText: {
    color: "#6b7280",
  },
  roleTextActive: {
    color: "#ffffff",
    fontWeight: "600",
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
  linkText: {
    marginTop: 16,
    textAlign: "center",
    color: "#2563eb",
  },
  error: {
    color: "#ef4444",
    marginBottom: 8,
  },
});

export default SignupScreen;

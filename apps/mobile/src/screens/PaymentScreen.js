import React, { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../services/api";

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card" },
  { id: "cash", label: "Pay at Hospital (Cash)" },
  { id: "online", label: "Online Transfer" },
  { id: "bank", label: "Bank Transfer" },
];

const PaymentScreen = ({ route, navigation }) => {
  const { appointmentId, doctor, appointmentDate, timeSlot, consultationFee, centerName, centerLocation } =
    route.params || {};

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [proofBase64, setProofBase64] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Permission to access gallery is required");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setProofImage(result.assets[0].uri);
      setProofBase64(result.assets[0].base64);
      setError("");
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod) {
      setError("Please select a payment method");
      return;
    }
    if (!proofImage || !proofBase64) {
      setError("Please upload payment proof");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.patch(`/appointments/${appointmentId}/payment-proof`, {
        paymentMethod: selectedMethod,
        paymentProof: proofBase64,
      });
      navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  const fee = consultationFee != null ? `Rs. ${consultationFee}` : "N/A";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.sectionLabel}>Booking Summary</Text>

      <View style={styles.summaryCard}>
        <Row label="Doctor" value={doctor?.name || "—"} />
        <Row label="Date" value={appointmentDate || "—"} />
        <Row label="Time Slot" value={timeSlot || "—"} />
        {centerName ? (
          <Row
            label="Hospital"
            value={centerLocation ? `${centerName} · ${centerLocation}` : centerName}
          />
        ) : null}
        <View style={styles.divider} />
        <Row label="Consultation Fee" value={fee} bold />
      </View>

      <Text style={styles.sectionLabel}>Select Payment Method</Text>

      {PAYMENT_METHODS.map((method) => (
        <Pressable
          key={method.id}
          style={[
            styles.methodButton,
            selectedMethod === method.id && styles.methodButtonSelected,
          ]}
          onPress={() => {
            setSelectedMethod(method.id);
            setError("");
          }}
        >
          <View style={styles.radioCircle}>
            {selectedMethod === method.id && <View style={styles.radioFill} />}
          </View>
          <Text
            style={[
              styles.methodText,
              selectedMethod === method.id && styles.methodTextSelected,
            ]}
          >
            {method.label}
          </Text>
        </Pressable>
      ))}

      {selectedMethod ? (
        <View style={styles.uploadSection}>
          <Text style={styles.sectionLabel}>Upload Payment Proof</Text>
          <Pressable style={styles.uploadButton} onPress={handlePickImage}>
            <Text style={styles.uploadButtonText}>
              {proofImage ? "Change Image" : "Select Image from Gallery"}
            </Text>
          </Pressable>
          {proofImage ? (
            <Image source={{ uri: proofImage }} style={styles.proofPreview} resizeMode="cover" />
          ) : null}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]} onPress={handleConfirmPayment} disabled={submitting}>
        {submitting
          ? <ActivityIndicator color="#ffffff" />
          : <Text style={styles.primaryButtonText}>Confirm Payment</Text>
        }
      </Pressable>
    </ScrollView>
  );
};

const Row = ({ label, value, bold }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#ffffff",
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rowLabel: {
    color: "#6b7280",
    fontSize: 14,
    flex: 1,
  },
  rowValue: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  rowValueBold: {
    fontWeight: "700",
    fontSize: 15,
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
  methodButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#f8fafc",
  },
  methodButtonSelected: {
    borderColor: "#111827",
    backgroundColor: "#f0f0f0",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#111827",
  },
  methodText: {
    fontSize: 15,
    color: "#374151",
  },
  methodTextSelected: {
    fontWeight: "600",
    color: "#111827",
  },
  uploadSection: {
    marginBottom: 16,
  },
  uploadButton: {
    borderWidth: 1.5,
    borderColor: "#111827",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  uploadButtonText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 14,
  },
  proofPreview: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 12,
  },
  error: {
    color: "#ef4444",
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default PaymentScreen;

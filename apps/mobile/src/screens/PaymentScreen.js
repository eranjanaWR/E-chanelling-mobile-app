import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const sanitizeCardNumber = (value) => value.replace(/\s+/g, "");
const sanitizeExpiry = (value) => value.replace(/[^0-9/]/g, "");
const sanitizeCvv = (value) => value.replace(/\D/g, "");

const PaymentScreen = ({ route, navigation }) => {
  const amount = route.params?.amount;
  const doctorName = route.params?.doctorName || "Doctor";
  const appointmentId = route.params?.appointmentId;

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePay = () => {
    const trimmed = sanitizeCardNumber(cardNumber);
    if (!trimmed || trimmed.length < 12) {
      setError("Enter a valid card number");
      setSuccess("");
      return;
    }

    if (!expiry || expiry.length < 4) {
      setError("Enter a valid expiry date");
      setSuccess("");
      return;
    }

    if (!cvv || cvv.length < 3) {
      setError("Enter a valid CVV");
      setSuccess("");
      return;
    }

    if (!cardHolder.trim()) {
      setError("Enter card holder name");
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("Payment successfully done");
    setTimeout(() => {
      navigation.navigate("Dashboard", { paidAppointmentId: appointmentId });
    }, 600);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.subtitle}>{doctorName}</Text>
      {amount ? <Text style={styles.amount}>Amount: Rs. {amount}</Text> : null}

      <Text style={styles.sectionTitle}>Card Detail</Text>
      <TextInput
        style={styles.input}
        placeholder="Card number"
        keyboardType="numeric"
        value={cardNumber}
        onChangeText={(value) => setCardNumber(sanitizeCardNumber(value))}
        maxLength={19}
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Expiry date"
          keyboardType="numeric"
          value={expiry}
          onChangeText={(value) => setExpiry(sanitizeExpiry(value))}
          maxLength={5}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="CVV"
          keyboardType="numeric"
          value={cvv}
          onChangeText={(value) => setCvv(sanitizeCvv(value))}
          maxLength={4}
          secureTextEntry
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Card holder"
        value={cardHolder}
        onChangeText={setCardHolder}
      />

      <Text style={styles.securityNote}>All payments are secured</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <Pressable style={styles.payButton} onPress={handlePay}>
        <Text style={styles.payButtonText}>Pay Now</Text>
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
    marginBottom: 6,
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: 8,
  },
  amount: {
    fontWeight: "700",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  securityNote: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 16,
  },
  payButton: {
    backgroundColor: "#e24a43",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 6,
  },
  payButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  error: {
    color: "#ef4444",
    marginBottom: 8,
  },
  success: {
    color: "#16a34a",
    marginBottom: 8,
  },
});

export default PaymentScreen;

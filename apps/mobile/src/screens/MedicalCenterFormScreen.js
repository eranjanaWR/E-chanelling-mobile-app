import React, { useLayoutEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import api from "../services/api";

const CENTER_TYPES = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
  { value: "specialized", label: "Specialized" },
];

const MedicalCenterFormScreen = ({ route, navigation }) => {
  const { center } = route.params || {};
  const isEdit = !!center;

  const [name, setName] = useState(center?.name ?? "");
  const [location, setLocation] = useState(center?.location ?? "");
  const [centerType, setCenterType] = useState(center?.centerType ?? "private");
  const [phone, setPhone] = useState(center?.phone ?? "");
  const [fee, setFee] = useState(
    center?.consultationFee != null ? String(center.consultationFee) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? "Edit Center" : "Add Medical Center" });
  }, [navigation, isEdit]);

  const validate = () => {
    if (!name.trim()) return "Center name is required";
    if (!location.trim()) return "Location is required";
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name: name.trim(),
      location: location.trim(),
      centerType,
      phone: phone.trim(),
      consultationFee: Number(fee) || 0,
    };

    try {
      if (isEdit) {
        await api.put(`/doctors/medical-centers/${center._id}`, payload);
      } else {
        await api.post("/doctors/medical-centers", payload);
      }
      navigation.goBack();
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed");
      setSaving(false);
    }
  };

  const handleSaveAndAddSlots = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name: name.trim(),
      location: location.trim(),
      centerType,
      phone: phone.trim(),
      consultationFee: Number(fee) || 0,
    };

    try {
      if (isEdit) {
        await api.put(`/doctors/medical-centers/${center._id}`, payload);
        navigation.navigate("ManageTimeSlots", { centerId: center._id, centerName: name.trim() });
      } else {
        const res = await api.post("/doctors/medical-centers", payload);
        const newCenter = res.data.center;
        if (newCenter?._id) {
          navigation.navigate("ManageTimeSlots", {
            centerId: newCenter._id,
            centerName: newCenter.name,
          });
        } else {
          navigation.goBack();
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed");
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Center Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. City Medical Centre"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Colombo"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Center Type *</Text>
        <View style={styles.typeRow}>
          {CENTER_TYPES.map(({ value, label }) => (
            <Pressable
              key={value}
              style={[styles.typeBtn, centerType === value && styles.typeBtnActive]}
              onPress={() => setCenterType(value)}
            >
              <Text
                style={centerType === value ? styles.typeBtnTextActive : styles.typeBtnText}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 0112345678"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Consultation Fee (LKR)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2000"
          keyboardType="numeric"
          value={fee}
          onChangeText={setFee}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.btnText}>
            {saving ? "Saving…" : isEdit ? "Update Center" : "Add Center"}
          </Text>
        </Pressable>

        {isEdit ? (
          <Pressable
            style={[styles.btn, styles.secondaryBtn]}
            onPress={() =>
              navigation.navigate("ManageTimeSlots", {
                centerId: center._id,
                centerName: center.name,
              })
            }
          >
            <Text style={styles.secondaryBtnText}>Manage Time Slots</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20 },

  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 4, marginTop: 12 },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 15,
  },

  typeRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  typeBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
  typeBtnText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  typeBtnTextActive: { fontSize: 13, fontWeight: "600", color: "#fff" },

  btn: {
    backgroundColor: "#111827",
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  secondaryBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#111827",
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  secondaryBtnText: { color: "#111827", fontWeight: "600", fontSize: 15 },

  cancelBtn: { paddingVertical: 13, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#6b7280", fontWeight: "600" },

  errorText: { color: "#ef4444", fontSize: 13, marginTop: 8 },
});

export default MedicalCenterFormScreen;

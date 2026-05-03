import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

const SPECIALTIES = [
  "Cardiologist",
  "Dermatologist",
  "General Physician",
  "Neurologist",
  "Orthopedic Surgeon",
  "Pediatrician",
  "Psychiatrist",
  "Radiologist",
  "Urologist",
  "Gynecologist",
  "ENT Specialist",
  "Ophthalmologist",
];

const TYPE_LABEL = { private: "Private", public: "Public", specialized: "Specialized" };

const DoctorProfileScreen = ({ navigation }) => {
  const [doctor, setDoctor] = useState(null);
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState("");
  const [showSpecialties, setShowSpecialties] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", isError: false });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/doctors/my-profile");
      const d = res.data.doctor;
      setDoctor(d);
      setSpecialty(d.specialty || "");
      setExperience(d.experience != null ? String(d.experience) : "");
    } catch (err) {
      setMessage({ text: err?.response?.data?.message || "Failed to load profile", isError: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSaveBasic = async () => {
    if (!specialty.trim()) {
      setMessage({ text: "Please select a specialty", isError: true });
      return;
    }
    setSaving(true);
    setMessage({ text: "", isError: false });
    try {
      const res = await api.patch("/doctors/my-profile", {
        specialty: specialty.trim(),
        experience: Number(experience) || 0,
      });
      setDoctor(res.data.doctor);
      setMessage({ text: "Basic info saved", isError: false });
    } catch (err) {
      setMessage({ text: err?.response?.data?.message || "Save failed", isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCenter = (centerId, centerName) => {
    Alert.alert(
      "Delete Medical Center",
      `Remove "${centerName}" and all its time slots?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await api.delete(`/doctors/medical-centers/${centerId}`);
              setDoctor(res.data.doctor);
            } catch (err) {
              setMessage({ text: err?.response?.data?.message || "Delete failed", isError: true });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Basic Info ── */}
      <Text style={styles.sectionTitle}>Basic Information</Text>

      <Text style={styles.label}>Specialty *</Text>
      <Pressable
        style={styles.selector}
        onPress={() => setShowSpecialties(!showSpecialties)}
      >
        <Text style={specialty ? styles.selectorText : styles.selectorPlaceholder}>
          {specialty || "Select specialty"}
        </Text>
        <Text style={styles.chevron}>{showSpecialties ? "▲" : "▼"}</Text>
      </Pressable>

      {showSpecialties && (
        <View style={styles.dropdown}>
          {SPECIALTIES.map((s) => (
            <Pressable
              key={s}
              style={[styles.dropdownItem, specialty === s && styles.dropdownItemActive]}
              onPress={() => {
                setSpecialty(s);
                setShowSpecialties(false);
              }}
            >
              <Text style={specialty === s ? styles.dropdownTextActive : styles.dropdownText}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.label}>Years of Experience</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 5"
        keyboardType="numeric"
        value={experience}
        onChangeText={setExperience}
      />

      {message.text ? (
        <Text style={message.isError ? styles.errorText : styles.successText}>
          {message.text}
        </Text>
      ) : null}

      <Pressable
        style={[styles.btn, saving && styles.btnDisabled]}
        onPress={handleSaveBasic}
        disabled={saving}
      >
        <Text style={styles.btnText}>{saving ? "Saving…" : "Save Basic Info"}</Text>
      </Pressable>

      {/* ── Medical Centers ── */}
      <View style={styles.divider} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Medical Centers</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => navigation.navigate("MedicalCenterForm", {})}
        >
          <Text style={styles.addBtnText}>+ Add Center</Text>
        </Pressable>
      </View>

      {!doctor?.medicalCenters?.length ? (
        <Text style={styles.emptyText}>
          No medical centers yet. Tap "+ Add Center" to get started.
        </Text>
      ) : (
        doctor.medicalCenters.map((center) => (
          <View key={center._id} style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{center.name}</Text>
              <Text style={styles.cardMeta}>
                {center.location}{"  ·  "}
                <Text style={styles.typeBadge}>{TYPE_LABEL[center.centerType]}</Text>
              </Text>
              {center.phone ? <Text style={styles.cardMeta}>{center.phone}</Text> : null}
              <Text style={styles.cardFee}>Fee: LKR {center.consultationFee ?? 0}</Text>
              <Text style={styles.cardSlotCount}>
                {center.timeSlots?.length ?? 0} time slot
                {center.timeSlots?.length !== 1 ? "s" : ""}
              </Text>
            </View>

            <View style={styles.cardActions}>
              <Pressable
                style={styles.actionBtn}
                onPress={() => navigation.navigate("MedicalCenterForm", { center })}
              >
                <Text style={styles.actionBtnText}>Edit</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={() =>
                  navigation.navigate("ManageTimeSlots", {
                    centerId: center._id,
                    centerName: center.name,
                  })
                }
              >
                <Text style={[styles.actionBtnText, styles.actionBtnPrimaryText]}>
                  Time Slots
                </Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.actionBtnDanger]}
                onPress={() => handleDeleteCenter(center._id, center.name)}
              >
                <Text style={[styles.actionBtnText, styles.actionBtnDangerText]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 4, marginTop: 8 },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 15,
    marginBottom: 4,
  },

  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  selectorText: { fontSize: 15, color: "#111827" },
  selectorPlaceholder: { fontSize: 15, color: "#9ca3af" },
  chevron: { fontSize: 12, color: "#6b7280" },

  dropdown: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 8,
    overflow: "hidden",
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  dropdownItemActive: { backgroundColor: "#111827" },
  dropdownText: { fontSize: 15, color: "#111827" },
  dropdownTextActive: { fontSize: 15, color: "#fff", fontWeight: "600" },

  btn: {
    backgroundColor: "#111827",
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 12,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },

  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 24 },

  addBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  emptyText: { color: "#6b7280", textAlign: "center", marginTop: 16, marginBottom: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 14,
    overflow: "hidden",
  },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  cardMeta: { fontSize: 13, color: "#6b7280", marginBottom: 2 },
  typeBadge: { fontWeight: "600", color: "#2563eb" },
  cardFee: { fontSize: 13, color: "#059669", fontWeight: "600", marginTop: 4 },
  cardSlotCount: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  cardActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#f3f4f6",
  },
  actionBtnText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  actionBtnPrimary: { backgroundColor: "#eff6ff" },
  actionBtnPrimaryText: { color: "#2563eb" },
  actionBtnDanger: { backgroundColor: "#fff5f5", borderRightWidth: 0 },
  actionBtnDangerText: { color: "#ef4444" },

  errorText: { color: "#ef4444", fontSize: 13, marginTop: 6 },
  successText: { color: "#059669", fontSize: 13, marginTop: 6 },
});

export default DoctorProfileScreen;

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { useAuth } from "../context/AuthContext";

// ─── Component ────────────────────────────────────────────────────────────────
const PatientNotesScreen = ({ route }) => {
  const { patient } = route.params ?? { patient: { _id: "", name: "Unknown" } };
  const { user } = useAuth(); // logged-in doctor

  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ── Fetch existing notes for this patient ─────────────────────────────────
  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError("");
      const response = await api.get(`/medicine-strip/${patient._id}`);
      setNotes(response.data?.notes ?? []);
    } catch (err) {
      console.error("[PatientNotes] fetch error:", err?.response?.data ?? err?.message);
      setLoadError("Could not load past notes.");
    } finally {
      setIsLoading(false);
    }
  }, [patient._id]);

  useEffect(() => {
    if (patient._id) fetchNotes();
    else setIsLoading(false);
  }, [fetchNotes, patient._id]);

  // ── Save note to database ──────────────────────────────────────────────────
  const handleSave = async () => {
    const trimmed = noteText.trim();
    if (!trimmed) {
      Alert.alert("Empty note", "Please type something before saving.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await api.post("/medicine-strip", {
        note: trimmed,
        patientId: patient._id,
        patientName: patient.name,
      });

      const saved = response.data?.note;
      if (saved) {
        // Prepend immediately — no need to re-fetch
        setNotes((prev) => [saved, ...prev]);
      }
      setNoteText(""); // clear input
    } catch (err) {
      console.error("[PatientNotes] save error:", err?.response?.data ?? err?.message);
      Alert.alert(
        "Save failed",
        err?.response?.data?.message ?? "Could not save the note. Try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render a single note card ─────────────────────────────────────────────
  const renderNote = ({ item }) => (
    <View style={styles.noteCard}>
      <Text style={styles.noteText}>{item.note}</Text>
      <View style={styles.noteFooter}>
        <Text style={styles.noteMeta}>
          Dr. {item.doctorName}
        </Text>
        <Text style={styles.noteDate}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* ── Patient Banner ── */}
      <View style={styles.banner}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {(patient.name ?? "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.bannerInfo}>
          <Text style={styles.patientLabel}>PATIENT</Text>
          <Text style={styles.patientName}>{patient.name}</Text>
        </View>
      </View>

      {/* ── Note Input — TOP of body ── */}
      <View style={styles.inputSection}>
        <Text style={styles.inputSectionTitle}>Add a Note</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Write a note for this patient…"
          placeholderTextColor="#9ca3af"
          value={noteText}
          onChangeText={setNoteText}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.saveBtnPressed,
            isSaving && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>💾  Save Note</Text>
          )}
        </Pressable>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>Past Notes</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* ── Notes List ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#2563eb" />
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable onPress={fetchNotes} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item._id}
          renderItem={renderNote}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No notes yet.</Text>
              <Text style={styles.emptySubtext}>
                Write one above and tap Save.
              </Text>
            </View>
          }
          contentContainerStyle={
            notes.length === 0 ? styles.emptyListContainer : styles.listContent
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  // ── Banner
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  bannerInfo: {
    flex: 1,
  },
  patientLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 1,
    fontWeight: "600",
  },
  patientName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },

  // ── Input section (top)
  inputSection: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  inputSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
    minHeight: 80,
    maxHeight: 140,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnPressed: {
    backgroundColor: "#1d4ed8",
  },
  saveBtnDisabled: {
    backgroundColor: "#93c5fd",
  },
  saveBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },

  // ── Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginHorizontal: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Notes list
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "center",
  },

  // ── Note card
  noteCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  noteText: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 22,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    flexWrap: "wrap",
    gap: 4,
  },
  noteMeta: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: "600",
  },
  noteDate: {
    fontSize: 11,
    color: "#9ca3af",
  },

  // ── States
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: "#2563eb",
    fontWeight: "600",
  },
});

export default PatientNotesScreen;

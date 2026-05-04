import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import api from "../services/api";

// ─── Component ────────────────────────────────────────────────────────────────
const PatientListScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ── Fetch all patients from the database ──────────────────────────────────
  const fetchPatients = useCallback(async ({ refreshing = false } = {}) => {
    try {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError("");

      const response = await api.get("/patients");
      setPatients(response.data?.patients ?? []);
    } catch (err) {
      // Log full error details to the console for debugging
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      const networkMsg = err?.message;
      console.error("[PatientList] fetch error:", { status, msg, networkMsg });

      // Show a helpful message including the HTTP status if available
      if (status === 401) {
        setError("Session expired. Please log out and log in again.");
      } else if (status === 403) {
        setError("Access denied (403). Only doctors can view patients.");
      } else if (msg) {
        setError(`Server error: ${msg}`);
      } else {
        setError(
          `Could not load patients (${networkMsg ?? "network error"}). Is the server running?`
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // ── Real-time filter – matches anywhere in the name ───────────────────────
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      (p.name ?? "").toLowerCase().includes(q)
    );
  }, [searchQuery, patients]);

  // ── Navigate to PatientNotes, passing id + name ───────────────────────────
  const handlePatientPress = (patient) => {
    navigation.navigate("PatientNotes", { patient });
  };

  // ── Render a single list row ───────────────────────────────────────────────
  const renderPatient = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        styles.listItem,
        pressed && styles.listItemPressed,
      ]}
      onPress={() => handlePatientPress(item)}
      android_ripple={{ color: "#e8f4fd" }}
    >
      {/* Avatar circle */}
      <View style={styles.avatar}>
        <Text style={styles.avatarLetter}>
          {(item.name ?? "?").charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Name + email */}
      <View style={styles.info}>
        <Text style={styles.patientName}>{item.name || "—"}</Text>
        {item.email ? (
          <Text style={styles.patientEmail} numberOfLines={1}>
            {item.email}
          </Text>
        ) : null}
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );

  // ─── Loading state ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading patients…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Error Banner ── */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => fetchPatients()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {/* ── Search Bar ── */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Patient"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Text style={styles.clearBtn}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* ── Result count ── */}
      <Text style={styles.countText}>
        {filteredPatients.length}{" "}
        {filteredPatients.length === 1 ? "patient" : "patients"} found
      </Text>

      {/* ── Patient List ── */}
      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item._id}
        renderItem={renderPatient}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchPatients({ refreshing: true })}
            tintColor="#2563eb"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `No patients match "${searchQuery}"`
                : "No registered patients yet."}
            </Text>
          </View>
        }
        contentContainerStyle={
          filteredPatients.length === 0
            ? styles.emptyListContainer
            : styles.listContent
        }
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    gap: 12,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    flex: 1,
  },
  retryText: {
    color: "#2563eb",
    fontWeight: "700",
    marginLeft: 8,
  },

  // Search
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    padding: 0,
  },
  clearBtn: {
    fontSize: 14,
    color: "#9ca3af",
    paddingLeft: 8,
  },
  countText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 10,
    marginLeft: 2,
  },

  // List
  listContent: {
    paddingBottom: 24,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  listItemPressed: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2563eb",
  },
  info: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  patientEmail: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: "#9ca3af",
  },

  // Empty
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
  },
});

export default PatientListScreen;

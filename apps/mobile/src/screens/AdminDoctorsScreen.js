import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import api from "../services/api";

const toIsoDate = (date) => date.toISOString().slice(0, 10);

const AdminDoctorsScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [availabilityDates, setAvailabilityDates] = useState({});
  const [availabilityState, setAvailabilityState] = useState({});

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get("/doctors");
        const doctorList = response.data?.doctors || [];
        setDoctors(doctorList);
        setAvailabilityState((prev) => {
          const nextState = { ...prev };
          doctorList.forEach((doctor) => {
            if (!nextState[doctor._id]) {
              nextState[doctor._id] = doctor.availabilityStatus || "available";
            }
          });
          return nextState;
        });
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load doctors");
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const updateAvailability = async (doctorId, status) => {
    const fallbackDate = toIsoDate(new Date());
    const date = availabilityDates[doctorId] || fallbackDate;
    if (!availabilityDates[doctorId]) {
      setAvailabilityDates((prev) => ({ ...prev, [doctorId]: date }));
    }

    try {
      setError("");
      const response = await api.put(`/doctors/${doctorId}/availability`, {
        status,
        date,
      });

      setDoctors((prev) =>
        prev.map((doctor) => (doctor._id === doctorId ? response.data.doctor : doctor))
      );
      setAvailabilityState((prev) => ({ ...prev, [doctorId]: status }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update availability");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name || "Unnamed doctor"}</Text>
            <Text style={styles.cardMeta}>Specialty: {item.specialty || "N/A"}</Text>
            <Text style={styles.cardMeta}>Email: {item.email || "N/A"}</Text>
            <Text style={styles.cardMeta}>Qualification: {item.qualification || "N/A"}</Text>
            <Text style={styles.cardMeta}>Experience: {item.experience || 0} years</Text>
            <Text style={styles.cardMeta}>Consultation fee: {item.fees || 0}</Text>
            <Text style={styles.cardMeta}>
              Availability: {item.availabilityStatus || "available"}
              {item.availabilityDate ? ` (${item.availabilityDate})` : ""}
            </Text>

            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={availabilityDates[item._id] || item.availabilityDate || ""}
              onChangeText={(value) =>
                setAvailabilityDates((prev) => ({ ...prev, [item._id]: value }))
              }
            />
            <View style={styles.actionRow}>
              <Pressable
                style={[
                  styles.actionButton,
                  styles.availableButton,
                  availabilityState[item._id] === "available" && styles.actionButtonActive,
                ]}
                onPress={() => updateAvailability(item._id, "available")}
              >
                <Text style={styles.actionButtonText}>Available</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  styles.unavailableButton,
                  availabilityState[item._id] === "unavailable" && styles.actionButtonActive,
                ]}
                onPress={() => updateAvailability(item._id, "unavailable")}
              >
                <Text style={styles.actionButtonText}>Unavailable</Text>
              </Pressable>
            </View>
            {Array.isArray(item.medicalCenters) && item.medicalCenters.length > 0 ? (
              <View style={styles.centerList}>
                <Text style={styles.centerTitle}>Medical centers</Text>
                {item.medicalCenters.map((center) => (
                  <Text key={center._id} style={styles.cardMeta}>
                    {center.name} - {center.location}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No doctors found yet.</Text>}
        contentContainerStyle={doctors.length ? null : styles.emptyContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionButtonActive: {
    opacity: 0.85,
  },
  availableButton: {
    backgroundColor: "#16a34a",
  },
  unavailableButton: {
    backgroundColor: "#dc2626",
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  centerList: {
    marginTop: 8,
  },
  centerTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  error: {
    color: "#ef4444",
    marginBottom: 12,
  },
});

export default AdminDoctorsScreen;

import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import api from "../services/api";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toIsoDate = (date) => date.toISOString().slice(0, 10);

const getUpcomingDatesForDay = (dayName, count = 8) => {
  if (!dayName) return [];
  const targetIndex = WEEKDAYS.indexOf(dayName);
  if (targetIndex < 0) return [];

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const offset = (targetIndex - start.getDay() + 7) % 7;
  const firstDate = new Date(start);
  firstDate.setDate(start.getDate() + offset);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() + index * 7);
    return {
      value: toIsoDate(date),
      label: date.toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
  });
};

const extractDayFromLabel = (label) => {
  if (!label) return "";
  const day = label.split("·")[0]?.trim();
  return WEEKDAYS.includes(day) ? day : "";
};

const AdminAppointmentCreateScreen = ({ navigation }) => {
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showPatientOptions, setShowPatientOptions] = useState(false);
  const [showDoctorOptions, setShowDoctorOptions] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [nextQueueNumber, setNextQueueNumber] = useState(null);
  const [loadingQueueNumber, setLoadingQueueNumber] = useState(false);
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const [userResponse, doctorResponse] = await Promise.all([
          api.get("/users"),
          api.get("/doctors"),
        ]);

        setUsers(userResponse.data?.users || []);
        setDoctors(doctorResponse.data?.doctors || []);
      } catch (err) {
        setLoadError(err?.response?.data?.message || "Failed to load users and doctors");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const patientOptions = useMemo(() => {
    if (!users.length) return [];
    const onlyPatients = users.filter((user) => user.role === "patient");
    return (onlyPatients.length ? onlyPatients : users.filter((user) => user.role !== "admin"))
      .map((user) => ({
        id: user._id,
        label: `${user.name || "Unknown"} · ${user.email || "No email"}`,
      }));
  }, [users]);

  const doctorOptions = useMemo(() => {
    if (!doctors.length) return [];
    return doctors.map((doctor) => ({
      id: doctor._id,
      label: `${doctor.name || "Unknown"} · ${doctor.specialty || "No specialty"}`,
    }));
  }, [doctors]);

  const selectedPatientLabel = useMemo(
    () => patientOptions.find((option) => option.id === patientId)?.label || "",
    [patientOptions, patientId]
  );

  const selectedDoctorLabel = useMemo(
    () => doctorOptions.find((option) => option.id === doctorId)?.label || "",
    [doctorOptions, doctorId]
  );

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === doctorId),
    [doctors, doctorId]
  );

  const doctorTimeSlots = useMemo(() => {
    if (!selectedDoctor) return [];
    const slots = [];
    if (Array.isArray(selectedDoctor.medicalCenters)) {
      selectedDoctor.medicalCenters.forEach((center) => {
        (center.timeSlots || []).forEach((slot) => {
          slots.push({
            centerName: center.name,
            location: center.location,
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        });
      });
    }

    if (!slots.length && Array.isArray(selectedDoctor.availability)) {
      selectedDoctor.availability.forEach((item) => {
        (item.slots || []).forEach((slotText) => {
          slots.push({
            day: item.day,
            label: slotText,
          });
        });
      });
    }

    return slots;
  }, [selectedDoctor]);

  const filteredPatientOptions = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return patientOptions;
    return patientOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [patientOptions, patientSearch]);

  const dateOptions = useMemo(() => getUpcomingDatesForDay(selectedDay), [selectedDay]);

  const handleTimeSlotChange = (value) => {
    setTimeSlot(value);
    const inferredDay = extractDayFromLabel(value);
    if (inferredDay) {
      setSelectedDay(inferredDay);
      setAppointmentDate("");
      setShowDateOptions(true);
    }
  };

  useEffect(() => {
    const fetchQueue = async () => {
      setNextQueueNumber(null);
      if (!doctorId) return;
      const trimmedDate = appointmentDate.trim();
      if (!trimmedDate) return;
      const parsedDate = new Date(trimmedDate);
      if (Number.isNaN(parsedDate.getTime())) return;

      setLoadingQueueNumber(true);
      try {
        const res = await api.get("/appointments/next-queue", {
          params: {
            doctorId,
            appointmentDate: parsedDate.toISOString(),
          },
        });
        setNextQueueNumber(res.data.queueNumber);
      } catch (err) {
        setNextQueueNumber(null);
      } finally {
        setLoadingQueueNumber(false);
      }
    };

    fetchQueue();
  }, [appointmentDate, doctorId]);

  const handleCreate = async () => {
    setError("");

    if (!patientId || !doctorId || !appointmentDate || !timeSlot) {
      setError("Patient ID, Doctor ID, Date, and Time Slot are required");
      return;
    }

    if (patientId.trim().length !== 24 || doctorId.trim().length !== 24) {
      setError("Patient ID and Doctor ID must be 24-character IDs");
      return;
    }

    try {
      setIsSaving(true);
      await api.post("/appointments/admin", {
        patientId: patientId.trim(),
        doctorId: doctorId.trim(),
        appointmentDate,
        timeSlot,
        status,
      });
      Alert.alert("Created", "Appointment created", [{ text: "OK" }]);
      navigation.goBack();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create appointment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Appointment</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#111827" />
          <Text style={styles.loadingText}>Loading users and doctors...</Text>
        </View>
      ) : null}

      <Pressable
        style={styles.input}
        onPress={() => setShowPatientOptions((prev) => !prev)}
      >
        <Text style={patientId ? styles.inputText : styles.placeholderText}>
          {selectedPatientLabel || "Select patient"}
        </Text>
      </Pressable>
      {showPatientOptions ? (
        <View style={styles.dropdown}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search patient name"
            value={patientSearch}
            onChangeText={setPatientSearch}
          />
          {filteredPatientOptions.length ? (
            filteredPatientOptions.map((option) => (
              <Pressable
                key={option.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setPatientId(option.id);
                  setShowPatientOptions(false);
                  setPatientSearch("");
                }}
              >
                <Text style={styles.dropdownText}>{option.label}</Text>
                <Text style={styles.dropdownMeta}>{option.id}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.helperText}>No patients found.</Text>
          )}
        </View>
      ) : null}

      <Pressable
        style={styles.input}
        onPress={() => setShowDoctorOptions((prev) => !prev)}
      >
        <Text style={doctorId ? styles.inputText : styles.placeholderText}>
          {selectedDoctorLabel || "Select doctor"}
        </Text>
      </Pressable>
      {showDoctorOptions ? (
        <View style={styles.dropdown}>
          {doctorOptions.length ? (
            doctorOptions.map((option) => (
              <Pressable
                key={option.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setDoctorId(option.id);
                  setShowDoctorOptions(false);
                }}
              >
                <Text style={styles.dropdownText}>{option.label}</Text>
                <Text style={styles.dropdownMeta}>{option.id}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.helperText}>No doctors found.</Text>
          )}
        </View>
      ) : null}

      {doctorId ? (
        <View style={styles.slotSection}>
          <Text style={styles.sectionTitle}>Doctor time slots</Text>
          {doctorTimeSlots.length ? (
            doctorTimeSlots.map((slot, index) => {
              const label = slot.label
                ? `${slot.day} · ${slot.label}`
                : `${slot.day} · ${slot.startTime} - ${slot.endTime}`;
              const subtitle = slot.centerName
                ? `${slot.centerName}${slot.location ? ` · ${slot.location}` : ""}`
                : "";

              return (
                <Pressable
                  key={`${index}-${label}`}
                  style={styles.slotButton}
                  onPress={() => {
                    setTimeSlot(label);
                    const inferredDay = extractDayFromLabel(label);
                    if (inferredDay) {
                      setSelectedDay(inferredDay);
                      setAppointmentDate("");
                      setShowDateOptions(true);
                    }
                  }}
                >
                  <Text style={styles.slotText}>{label}</Text>
                  {subtitle ? <Text style={styles.slotSubtitle}>{subtitle}</Text> : null}
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.helperText}>No time slots available for this doctor.</Text>
          )}
        </View>
      ) : null}

      <Pressable
        style={styles.input}
        onPress={() => {
          if (dateOptions.length) {
            setShowDateOptions((prev) => !prev);
          }
        }}
      >
        <Text style={appointmentDate ? styles.inputText : styles.placeholderText}>
          {appointmentDate || "Select date"}
        </Text>
      </Pressable>
      {selectedDay && dateOptions.length > 0 ? (
        <View style={styles.dropdown}>
          {showDateOptions ? (
            dateOptions.map((option) => (
              <Pressable
                key={option.value}
                style={styles.dropdownItem}
                onPress={() => {
                  setAppointmentDate(option.value);
                  setShowDateOptions(false);
                }}
              >
                <Text style={styles.dropdownText}>{option.label}</Text>
                <Text style={styles.dropdownMeta}>{option.value}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.helperText}>Tap to pick a {selectedDay} date.</Text>
          )}
        </View>
      ) : (
        <Text style={styles.helperText}>Select a time slot to see dates.</Text>
      )}
      <TextInput
        style={styles.input}
        placeholder="Time slot (e.g. 09:30-10:00)"
        value={timeSlot}
        onChangeText={handleTimeSlotChange}
      />

      {loadingQueueNumber ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#111827" />
          <Text style={styles.loadingText}>Checking queue number...</Text>
        </View>
      ) : nextQueueNumber !== null ? (
        <Text style={styles.queueText}>Next queue number: {nextQueueNumber}</Text>
      ) : (
        <Text style={styles.helperText}>Queue number will be assigned automatically.</Text>
      )}
      <TextInput
        style={styles.input}
        placeholder="Status (pending/confirmed/cancelled)"
        value={status}
        onChangeText={setStatus}
      />

      <Pressable style={styles.saveButton} onPress={handleCreate} disabled={isSaving}>
        <Text style={styles.saveButtonText}>{isSaving ? "Creating..." : "Create"}</Text>
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
  inputText: {
    color: "#111827",
  },
  placeholderText: {
    color: "#9ca3af",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dropdownText: {
    color: "#111827",
    fontWeight: "600",
  },
  dropdownMeta: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  loadingText: {
    color: "#6b7280",
    marginLeft: 8,
    fontSize: 12,
  },
  slotSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  slotButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  slotText: {
    fontWeight: "600",
    color: "#111827",
  },
  slotSubtitle: {
    marginTop: 4,
    color: "#6b7280",
    fontSize: 12,
  },
  queueText: {
    color: "#111827",
    marginBottom: 12,
    fontWeight: "700",
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
  helperText: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 12,
  },
});

export default AdminAppointmentCreateScreen;

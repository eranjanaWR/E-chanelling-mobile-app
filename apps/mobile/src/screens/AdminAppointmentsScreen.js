import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

const STATUSES = ["pending", "confirmed", "cancelled"];

const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#10b981",
  cancelled: "#ef4444",
};

const AdminAppointmentsScreen = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [editModal, setEditModal] = useState(null);   // holds appointment being edited
  const [editDate, setEditDate] = useState("");
  const [editTimeSlot, setEditTimeSlot] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      api.get("/appointments")
        .then((res) => { if (!cancelled) setAppointments(res.data.appointments || []); })
        .catch(() => { if (!cancelled) setAppointments([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  const openEditModal = (item) => {
    const d = new Date(item.appointmentDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setEditDate(`${yyyy}-${mm}-${dd}`);
    setEditTimeSlot(item.timeSlot);
    setEditModal(item);
  };

  const handleSaveEdit = async () => {
    const dateValue = editDate.trim();
    const timeValue = editTimeSlot.trim();
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateValue || !timeValue) {
      Alert.alert("Error", "Date and time slot are required");
      return;
    }
    if (!datePattern.test(dateValue)) {
      Alert.alert("Error", "Use YYYY-MM-DD format for the date");
      return;
    }

    const parsedDate = new Date(`${dateValue}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert("Error", "Invalid date");
      return;
    }

    setEditSaving(true);
    try {
      const res = await api.patch(`/appointments/${editModal._id}/details`, {
        appointmentDate: parsedDate.toISOString(),
        timeSlot: timeValue,
      });
      setAppointments((prev) =>
        prev.map((a) => (a._id === editModal._id ? res.data.appointment : a))
      );
      setEditModal(null);
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || err?.message || "Failed to save changes"
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    setStatusModal(null);
    try {
      const res = await api.patch(`/appointments/${appointmentId}/status`, { status });
      setAppointments((prev) =>
        prev.map((a) => (a._id === appointmentId ? res.data.appointment : a))
      );
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = (appointmentId) => {
    Alert.alert(
      "Delete Appointment",
      "Are you sure you want to delete this appointment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/appointments/${appointmentId}`);
              setAppointments((prev) => prev.filter((a) => a._id !== appointmentId));
            } catch (err) {
              Alert.alert("Error", err?.response?.data?.message || "Failed to delete appointment");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || "#6b7280";
    const proofUri = item.paymentProof
      ? `data:image/jpeg;base64,${item.paymentProof}`
      : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.patientName}>{item.patient?.name || "Unknown Patient"}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.detail}>Doctor: {item.doctor?.name || "—"}</Text>
        <Text style={styles.detail}>
          Date: {new Date(item.appointmentDate).toLocaleDateString()}
        </Text>
        <Text style={styles.detail}>Time Slot: {item.timeSlot}</Text>
        {item.paymentMethod ? (
          <Text style={styles.detail}>Payment: {item.paymentMethod}</Text>
        ) : null}

        {proofUri ? (
          <Pressable onPress={() => setPreviewImage(proofUri)}>
            <Image source={{ uri: proofUri }} style={styles.proofThumb} resizeMode="cover" />
            <Text style={styles.proofHint}>Tap to enlarge</Text>
          </Pressable>
        ) : (
          <Text style={styles.noProof}>No payment proof uploaded</Text>
        )}

        <View style={styles.actionRow}>
          <Pressable style={styles.editButton} onPress={() => openEditModal(item)}>
            <Text style={styles.editButtonText}>Edit Details</Text>
          </Pressable>
          <Pressable style={styles.updateButton} onPress={() => setStatusModal(item)}>
            <Text style={styles.updateButtonText}>Status</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
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
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No appointments found.</Text>}
      />

      {/* Payment proof full-screen preview */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPreviewImage(null)}>
          {previewImage ? (
            <Image source={{ uri: previewImage }} style={styles.fullImage} resizeMode="contain" />
          ) : null}
          <Text style={styles.dismissHint}>Tap anywhere to close</Text>
        </Pressable>
      </Modal>

      {/* Edit appointment details */}
      <Modal visible={!!editModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => !editSaving && setEditModal(null)}>
          <ScrollView
            style={styles.editSheet}
            contentContainerStyle={styles.editSheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.statusSheetTitle}>Edit Appointment</Text>
            <Text style={styles.statusSheetSub}>
              {editModal?.patient?.name} — {editModal?.doctor?.name}
            </Text>

            <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.fieldInput}
              value={editDate}
              onChangeText={setEditDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Time Slot</Text>
            <TextInput
              style={styles.fieldInput}
              value={editTimeSlot}
              onChangeText={setEditTimeSlot}
              placeholder="e.g. Monday · 18:00 - 23:30"
            />

            <Pressable
              style={[styles.saveButton, editSaving && { opacity: 0.6 }]}
              onPress={handleSaveEdit}
              disabled={editSaving}
            >
              {editSaving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveButtonText}>Save Changes</Text>
              }
            </Pressable>
            <Pressable style={styles.cancelOption} onPress={() => setEditModal(null)}>
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Modal>

      {/* Status update picker */}
      <Modal visible={!!statusModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setStatusModal(null)}>
          <View style={styles.statusSheet}>
            <Text style={styles.statusSheetTitle}>Update Status</Text>
            <Text style={styles.statusSheetSub}>
              {statusModal?.patient?.name} — {statusModal?.timeSlot}
            </Text>
            {STATUSES.map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.statusOption,
                  statusModal?.status === s && styles.statusOptionActive,
                ]}
                onPress={() => handleUpdateStatus(statusModal._id, s)}
              >
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[s] }]} />
                <Text style={styles.statusOptionText}>{s}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.cancelOption} onPress={() => setStatusModal(null)}>
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  list: { padding: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  patientName: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  detail: { fontSize: 13, color: "#374151", marginBottom: 4 },
  proofThumb: { width: "100%", height: 160, borderRadius: 8, marginTop: 10 },
  proofHint: { fontSize: 11, color: "#6b7280", textAlign: "center", marginTop: 4 },
  noProof: { fontSize: 12, color: "#9ca3af", marginTop: 8, fontStyle: "italic" },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 40 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  editButton: {
    flex: 1,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  editButtonText: { fontWeight: "600", color: "#2563eb", fontSize: 13 },
  updateButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#111827",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  updateButtonText: { fontWeight: "600", color: "#111827", fontSize: 13 },
  deleteButton: {
    flex: 1,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  deleteButtonText: { fontWeight: "600", color: "#ef4444", fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  fullImage: { width: "90%", height: "70%", alignSelf: "center", marginBottom: "auto", marginTop: "auto" },
  dismissHint: { color: "#ffffff", marginBottom: 24, fontSize: 13 },
  statusSheet: {
    backgroundColor: "#ffffff",
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  statusSheetTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4, color: "#111827" },
  statusSheetSub: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
  },
  statusOptionActive: { borderColor: "#111827", backgroundColor: "#f3f4f6" },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  statusOptionText: { fontSize: 15, color: "#111827", textTransform: "capitalize" },
  cancelOption: { alignItems: "center", paddingTop: 8 },
  cancelOptionText: { color: "#ef4444", fontWeight: "600" },
  editSheet: {
    backgroundColor: "#ffffff",
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  editSheetContent: { padding: 24, paddingBottom: 40 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 14 },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
  },
  saveButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: { color: "#ffffff", fontWeight: "600", fontSize: 15 },
});

export default AdminAppointmentsScreen;

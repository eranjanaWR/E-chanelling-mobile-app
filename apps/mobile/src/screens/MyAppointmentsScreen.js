import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
};

const MyAppointmentsScreen = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [completionAmounts, setCompletionAmounts] = useState({});
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewSavingId, setReviewSavingId] = useState(null);
  const [reviewDeletingId, setReviewDeletingId] = useState(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/appointments");
      setAppointments(response.data?.appointments || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  const handleComplete = async (appointmentId) => {
    const amountValue = completionAmounts[appointmentId];
    const parsedAmount = Number(amountValue);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    setUpdatingId(appointmentId);
    setError("");
    try {
      await api.patch(`/appointments/${appointmentId}/complete`, {
        amount: parsedAmount,
      });
      await loadAppointments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to complete appointment");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePay = () => {
    setError("Payment flow is not implemented yet");
  };

  const startReview = (appointment) => {
    const existing = appointment.review;
    setReviewDrafts((prev) => ({
      ...prev,
      [appointment._id]: {
        rating: existing?.rating ? String(existing.rating) : "",
        comment: existing?.comment || "",
      },
    }));
    setActiveReviewId(appointment._id);
  };

  const updateDraft = (appointmentId, key, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [appointmentId]: {
        ...(prev[appointmentId] || {}),
        [key]: value,
      },
    }));
  };

  const handleSaveReview = async (appointment) => {
    const draft = reviewDrafts[appointment._id] || {};
    const ratingValue = Number(draft.rating);
    const commentValue = String(draft.comment || "").trim();

    if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      setError("Rating must be between 1 and 5");
      return;
    }

    if (!commentValue) {
      setError("Comment is required");
      return;
    }

    setReviewSavingId(appointment._id);
    setError("");
    try {
      if (appointment.review?._id) {
        await api.put(`/reviews/${appointment.review._id}`, {
          rating: ratingValue,
          comment: commentValue,
        });
      } else {
        await api.post("/reviews", {
          appointmentId: appointment._id,
          rating: ratingValue,
          comment: commentValue,
        });
      }
      setActiveReviewId(null);
      await loadAppointments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save review");
    } finally {
      setReviewSavingId(null);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    setReviewDeletingId(reviewId);
    setError("");
    try {
      await api.delete(`/reviews/${reviewId}`);
      setActiveReviewId(null);
      await loadAppointments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete review");
    } finally {
      setReviewDeletingId(null);
    }
  };

  if (loading) {
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
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const dateLabel = formatDate(item.appointmentDate);
          const isDoctor = user?.role === "doctor";
          const isPatient = user?.role === "patient";
          const title = isDoctor
            ? item.patient?.name || "Patient"
            : item.doctor?.name || "Doctor";
          const subtitle = isDoctor
            ? item.patient?.email || ""
            : item.doctor?.specialty || "";

          const isCompleted = item.status === "completed";
          const canComplete = isDoctor && !isCompleted && item.status !== "cancelled";
          const canReview = isPatient && isCompleted;
          const amountDraft = completionAmounts[item._id] ?? "";
          const draft = reviewDrafts[item._id] || {
            rating: item.review?.rating ? String(item.review.rating) : "",
            comment: item.review?.comment || "",
          };
          const isEditingReview = activeReviewId === item._id;
          const isSavingReview = reviewSavingId === item._id;
          const isDeletingReview = reviewDeletingId === item.review?._id;
          const showPayment = isPatient && isCompleted && item.amount;

          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{title}</Text>
              {subtitle ? <Text style={styles.cardMeta}>{subtitle}</Text> : null}
              <Text style={styles.cardMeta}>Date: {dateLabel || "N/A"}</Text>
              <Text style={styles.cardMeta}>Time: {item.timeSlot || "N/A"}</Text>
              <Text style={styles.cardMeta}>Status: {item.status || "pending"}</Text>
              {item.amount ? (
                <Text style={styles.cardMeta}>Amount: Rs. {item.amount}</Text>
              ) : null}
              {canComplete ? (
                <View style={styles.completeSection}>
                  <TextInput
                    style={styles.amountInput}
                    keyboardType="numeric"
                    placeholder="Amount (LKR)"
                    value={amountDraft}
                    onChangeText={(value) =>
                      setCompletionAmounts((prev) => ({
                        ...prev,
                        [item._id]: value,
                      }))
                    }
                  />
                  <Pressable
                    style={[
                      styles.completeButton,
                      updatingId === item._id && styles.btnDisabled,
                    ]}
                    onPress={() => handleComplete(item._id)}
                    disabled={updatingId === item._id}
                  >
                    <Text style={styles.completeButtonText}>
                      {updatingId === item._id ? "Confirming..." : "Confirm"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              {showPayment ? (
                <Pressable style={styles.payButton} onPress={handlePay}>
                  <Text style={styles.payButtonText}>Pay</Text>
                </Pressable>
              ) : null}
              {canReview ? (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewTitle}>Review</Text>
                  {item.review && !isEditingReview ? (
                    <View>
                      <Text style={styles.reviewMeta}>Rating: {item.review.rating}/5</Text>
                      <Text style={styles.reviewMeta}>Comment: {item.review.comment}</Text>
                      <View style={styles.reviewActions}>
                        <Pressable
                          style={[styles.reviewButton, styles.reviewEditButton]}
                          onPress={() => startReview(item)}
                        >
                          <Text style={styles.reviewButtonText}>Edit</Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.reviewButton,
                            styles.reviewDeleteButton,
                            isDeletingReview && styles.btnDisabled,
                          ]}
                          onPress={() => handleDeleteReview(item.review._id)}
                          disabled={isDeletingReview}
                        >
                          <Text style={styles.reviewButtonText}>
                            {isDeletingReview ? "Deleting..." : "Delete"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                  {!item.review && !isEditingReview ? (
                    <Pressable
                      style={[styles.reviewButton, styles.reviewAddButton]}
                      onPress={() => startReview(item)}
                    >
                      <Text style={styles.reviewButtonText}>Add Review</Text>
                    </Pressable>
                  ) : null}
                  {isEditingReview ? (
                    <View style={styles.reviewForm}>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Rating (1-5)"
                        value={draft.rating}
                        onChangeText={(value) => updateDraft(item._id, "rating", value)}
                      />
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Comment"
                        value={draft.comment}
                        onChangeText={(value) => updateDraft(item._id, "comment", value)}
                        multiline
                      />
                      <View style={styles.reviewActions}>
                        <Pressable
                          style={[styles.reviewButton, styles.reviewSaveButton]}
                          onPress={() => handleSaveReview(item)}
                          disabled={isSavingReview}
                        >
                          <Text style={styles.reviewButtonText}>
                            {isSavingReview ? "Saving..." : "Save"}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.reviewButton, styles.reviewCancelButton]}
                          onPress={() => setActiveReviewId(null)}
                        >
                          <Text style={styles.reviewButtonText}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No appointments found.</Text>}
        contentContainerStyle={appointments.length ? null : styles.emptyContainer}
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
  completeButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  completeSection: {
    marginTop: 12,
  },
  completeButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  payButton: {
    marginTop: 10,
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingVertical: 10,
  },
  payButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  reviewSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  reviewMeta: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 4,
  },
  reviewActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  reviewButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#111827",
  },
  reviewButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  reviewAddButton: {
    alignSelf: "flex-start",
  },
  reviewEditButton: {
    backgroundColor: "#1f2937",
  },
  reviewDeleteButton: {
    backgroundColor: "#b91c1c",
  },
  reviewSaveButton: {
    backgroundColor: "#0f172a",
  },
  reviewCancelButton: {
    backgroundColor: "#6b7280",
  },
  reviewForm: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: "top",
  },
});

export default MyAppointmentsScreen;

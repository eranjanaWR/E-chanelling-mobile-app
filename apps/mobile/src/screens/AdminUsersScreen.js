import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

const AdminUsersScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get("/users");
      setUsers(response.data?.users || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const handleDelete = (userId) => {
    Alert.alert("Delete user", "This will remove the user permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setError("");
            await api.delete(`/users/${userId}`);
            setUsers((prev) => prev.filter((user) => user._id !== userId));
          } catch (err) {
            setError(err?.response?.data?.message || "Failed to delete user");
          }
        },
      },
    ]);
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
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name || "Unnamed user"}</Text>
            <Text style={styles.cardMeta}>Email: {item.email || "N/A"}</Text>
            <Text style={styles.cardMeta}>Role: {item.role || "patient"}</Text>
            <Text style={styles.cardMeta}>Contact: {item.contactNumber || "N/A"}</Text>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionButton, styles.editButton]}
                onPress={() => navigation.navigate("AdminUserEdit", { user: item })}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item._id)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No users found yet.</Text>}
        contentContainerStyle={users.length ? null : styles.emptyContainer}
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
  editButton: {
    backgroundColor: "#2563eb",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
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

export default AdminUsersScreen;

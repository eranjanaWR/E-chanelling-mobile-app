import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";

const AuthContext = createContext(null);

const storeSession = async (token, user) => {
  await SecureStore.setItemAsync("token", token);
  await SecureStore.setItemAsync("user", JSON.stringify(user));
};

const clearSession = async () => {
  await SecureStore.deleteItemAsync("token");
  await SecureStore.deleteItemAsync("user");
};

const readSession = async () => {
  const token = await SecureStore.getItemAsync("token");
  const rawUser = await SecureStore.getItemAsync("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  return { token, user };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const session = await readSession();
      setToken(session.token || null);
      setUser(session.user || null);
      setIsLoading(false);
    };

    bootstrap();
  }, []);

  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    setToken(response.data.token);
    setUser(response.data.user);
    await storeSession(response.data.token, response.data.user);
    return response.data;
  };

  const register = async (payload) => {
    const response = await api.post("/auth/register", payload);
    setToken(response.data.token);
    setUser(response.data.user);
    await storeSession(response.data.token, response.data.user);
    return response.data;
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await clearSession();
  };

  const refreshProfile = async () => {
    const response = await api.get("/profile");
    setUser(response.data.user);
    await storeSession(token, response.data.user);
    return response.data;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

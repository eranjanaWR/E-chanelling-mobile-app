import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Your Mac's local WiFi IP — run `ipconfig getifaddr en0` in Terminal to get it.
// Update this whenever your network changes.
const DEV_SERVER_IP = "192.168.1.4";

const getBaseUrl = () => {
  const configuredBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  // Expo Go injects hostUri at runtime — try both SDK 50+ and legacy paths
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.metadata?.hostUri ||
    Constants.hostUri;

  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:4000`;
  }

  // Reliable fallback for physical Android device over WiFi
  if (DEV_SERVER_IP) {
    return `http://${DEV_SERVER_IP}:4000`;
  }

  // Android emulator: 10.0.2.2 maps to the host machine
  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000";
  }

  return "http://localhost:4000";
};

const baseURL = getBaseUrl();
console.log("API base URL:", baseURL);

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

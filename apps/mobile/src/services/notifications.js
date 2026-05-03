import Constants from "expo-constants";
import { Platform } from "react-native";

const isExpoGo = Constants.appOwnership === "expo";
let handlerSet = false;

const getNotificationsModule = async () => {
  if (isExpoGo) {
    return null;
  }

  const module = await import("expo-notifications");
  return module;
};

const ensureHandler = (Notifications) => {
  if (handlerSet) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerSet = true;
};

export const registerForPushNotificationsAsync = async () => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return null;
  }

  ensureHandler(Notifications);
  const settings = await Notifications.getPermissionsAsync();
  let status = settings.status;

  if (status !== "granted") {
    const request = await Notifications.requestPermissionsAsync();
    status = request.status;
  }

  if (status !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return Notifications.getExpoPushTokenAsync();
};

const scheduleReminder = async (triggerDate, message) => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return null;
  }

  ensureHandler(Notifications);
  if (triggerDate <= new Date()) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Appointment Reminder",
      body: message,
    },
    trigger: triggerDate,
  });
};

export const scheduleAppointmentReminders = async (appointmentDate, doctorName) => {
  if (isExpoGo) {
    return [];
  }

  const doctorLabel = doctorName ? ` with ${doctorName}` : "";
  const reminders = [
    { hours: 24, message: `You have an appointment${doctorLabel} in 24 hours.` },
    { hours: 2, message: `You have an appointment${doctorLabel} in 2 hours.` },
    { hours: 0.25, message: `You have an appointment${doctorLabel} in 15 minutes.` },
  ];

  const scheduledIds = [];

  for (const reminder of reminders) {
    const ms = reminder.hours * 60 * 60 * 1000;
    const triggerDate = new Date(appointmentDate.getTime() - ms);
    const id = await scheduleReminder(triggerDate, reminder.message);
    if (id) {
      scheduledIds.push(id);
    }
  }

  return scheduledIds;
};

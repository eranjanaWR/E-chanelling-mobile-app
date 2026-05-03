import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import RegistrationScreen from "../screens/RegistrationScreen";
import DashboardScreen from "../screens/DashboardScreen";
import DoctorSearchScreen from "../screens/DoctorSearchScreen";
import AppointmentBookingScreen from "../screens/AppointmentBookingScreen";
import PatientProfileScreen from "../screens/PatientProfileScreen";
import DoctorProfileScreen from "../screens/DoctorProfileScreen";
import MedicalCenterFormScreen from "../screens/MedicalCenterFormScreen";
import ManageTimeSlotsScreen from "../screens/ManageTimeSlotsScreen";
import PaymentScreen from "../screens/PaymentScreen";
import AdminAppointmentsScreen from "../screens/AdminAppointmentsScreen";

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Signup" component={SignupScreen} options={{ title: "Sign Up" }} />
    <Stack.Screen name="Registration" component={RegistrationScreen} options={{ title: "Register" }} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen
      name="DoctorSearch"
      component={DoctorSearchScreen}
      options={{ title: "Find Doctors" }}
    />
    <Stack.Screen
      name="AppointmentBooking"
      component={AppointmentBookingScreen}
      options={{ title: "Book Appointment" }}
    />
    <Stack.Screen
      name="PatientProfile"
      component={PatientProfileScreen}
      options={{ title: "My Profile" }}
    />
    <Stack.Screen
      name="DoctorProfile"
      component={DoctorProfileScreen}
      options={{ title: "Doctor Profile" }}
    />
    <Stack.Screen
      name="MedicalCenterForm"
      component={MedicalCenterFormScreen}
      options={{ title: "Medical Center" }}
    />
    <Stack.Screen
      name="ManageTimeSlots"
      component={ManageTimeSlotsScreen}
      options={{ title: "Time Slots" }}
    />
    <Stack.Screen
      name="Payment"
      component={PaymentScreen}
      options={{ title: "Payment" }}
    />
    <Stack.Screen
      name="AdminAppointments"
      component={AdminAppointmentsScreen}
      options={{ title: "All Appointments" }}
    />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default RootNavigator;

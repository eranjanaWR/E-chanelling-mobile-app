import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import RegistrationScreen from "../screens/RegistrationScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import AdminDoctorsScreen from "../screens/AdminDoctorsScreen";
import AdminUsersScreen from "../screens/AdminUsersScreen";
import AdminUserEditScreen from "../screens/AdminUserEditScreen";
import AdminAppointmentsScreen from "../screens/AdminAppointmentsScreen";
import AdminAppointmentEditScreen from "../screens/AdminAppointmentEditScreen";
import AdminAppointmentCreateScreen from "../screens/AdminAppointmentCreateScreen";
import DoctorSearchScreen from "../screens/DoctorSearchScreen";
import AppointmentBookingScreen from "../screens/AppointmentBookingScreen";
import PatientProfileScreen from "../screens/PatientProfileScreen";
import DoctorProfileScreen from "../screens/DoctorProfileScreen";
import MedicalCenterFormScreen from "../screens/MedicalCenterFormScreen";
import ManageTimeSlotsScreen from "../screens/ManageTimeSlotsScreen";
import MyAppointmentsScreen from "../screens/MyAppointmentsScreen";
import PatientListScreen from "../screens/PatientListScreen";
import PatientNotesScreen from "../screens/PatientNotesScreen";
import ViewMedicineStripScreen from "../screens/ViewMedicineStripScreen";

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
      name="MyAppointments"
      component={MyAppointmentsScreen}
      options={{ title: "My Appointments" }}
    />
    <Stack.Screen
      name="PatientList"
      component={PatientListScreen}
      options={{ title: "Medicine Strip" }}
    />
    <Stack.Screen
      name="PatientNotes"
      component={PatientNotesScreen}
      options={({ route }) => ({ title: route.params?.patient?.name ?? "Patient Notes" })}
    />
    <Stack.Screen
      name="ViewMedicineStrip"
      component={ViewMedicineStripScreen}
      options={{ title: "My Medicine Strip" }}
    />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: "Admin" }} />
    <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: "Users" }} />
    <Stack.Screen name="AdminUserEdit" component={AdminUserEditScreen} options={{ title: "Edit User" }} />
    <Stack.Screen name="AdminDoctors" component={AdminDoctorsScreen} options={{ title: "Doctors" }} />
    <Stack.Screen name="AdminAppointments" component={AdminAppointmentsScreen} options={{ title: "Appointments" }} />
    <Stack.Screen
      name="AdminAppointmentEdit"
      component={AdminAppointmentEditScreen}
      options={{ title: "Edit Appointment" }}
    />
    <Stack.Screen
      name="AdminAppointmentCreate"
      component={AdminAppointmentCreateScreen}
      options={{ title: "Create Appointment" }}
    />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { token, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? (user?.role === "admin" ? <AdminStack /> : <AppStack />) : <AuthStack />}
    </NavigationContainer>
  );
};

export default RootNavigator;

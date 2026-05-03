import React from "react";
import { render } from "@testing-library/react-native";
import AppointmentBookingScreen from "../src/screens/AppointmentBookingScreen";

jest.mock("../src/services/api", () => ({
  post: jest.fn(() => Promise.resolve({ data: {} })),
}));

jest.mock("../src/services/notifications", () => ({
  scheduleAppointmentReminders: jest.fn(() => Promise.resolve([])),
}));

describe("AppointmentBookingScreen", () => {
  it("renders doctor details", () => {
    const doctor = { _id: "1", name: "Dr. Silva" };
    const { getByText } = render(
      <AppointmentBookingScreen route={{ params: { doctor } }} navigation={{ navigate: jest.fn() }} />
    );
    expect(getByText("Dr. Silva")).toBeTruthy();
  });
});

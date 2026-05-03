import React from "react";
import { render } from "@testing-library/react-native";
import DashboardScreen from "../src/screens/DashboardScreen";

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { name: "Alex", role: "patient" },
    logout: jest.fn(),
  }),
}));

describe("DashboardScreen", () => {
  it("renders the welcome message", () => {
    const { getByText } = render(
      <DashboardScreen navigation={{ navigate: jest.fn() }} />
    );
    expect(getByText("Welcome back")).toBeTruthy();
  });
});

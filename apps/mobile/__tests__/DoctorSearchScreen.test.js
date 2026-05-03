import React from "react";
import { render } from "@testing-library/react-native";
import DoctorSearchScreen from "../src/screens/DoctorSearchScreen";

jest.mock("../src/services/api", () => ({
  get: jest.fn(() => Promise.resolve({ data: { doctors: [] } })),
}));

describe("DoctorSearchScreen", () => {
  it("shows empty state initially", () => {
    const { getByText } = render(
      <DoctorSearchScreen navigation={{ navigate: jest.fn() }} />
    );
    expect(getByText("No doctors found yet.")).toBeTruthy();
  });
});

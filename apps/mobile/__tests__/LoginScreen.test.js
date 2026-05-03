import React from "react";
import { render } from "@testing-library/react-native";
import LoginScreen from "../src/screens/LoginScreen";

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    login: jest.fn(),
  }),
}));

describe("LoginScreen", () => {
  it("renders the login title", () => {
    const { getByText } = render(<LoginScreen navigation={{ navigate: jest.fn() }} />);
    expect(getByText("E-Channeling")).toBeTruthy();
  });
});

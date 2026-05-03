const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const { connectDb } = require("../src/config/db");
const User = require("../src/models/User");

describe("Auth routes", () => {
  const testUser = {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    password: "password123",
  };

  before(async () => {
    await connectDb();
  });

  after(async () => {
    await User.deleteOne({ email: testUser.email });
    await mongoose.connection.close();
  });

  it("registers a new user", async () => {
    const response = await request(app).post("/auth/register").send(testUser);
    if (response.status !== 201) {
      throw new Error(`Expected 201, got ${response.status}`);
    }
  });

  it("logs in an existing user", async () => {
    const response = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    if (!response.body.token) {
      throw new Error("Token is missing in response");
    }
  });
});

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const { connectDb } = require("../src/config/db");
const User = require("../src/models/User");
const Doctor = require("../src/models/Doctor");
const Appointment = require("../src/models/Appointment");

describe("Appointment routes", () => {
  const now = Date.now();
  const patient = {
    name: "Patient",
    email: `patient-${now}@example.com`,
    password: "password123",
    role: "patient",
  };
  const doctor = {
    name: "Dr. Test",
    email: `doctor-${now}@example.com`,
    specialty: "Cardiology",
  };

  let token;
  let doctorId;

  before(async () => {
    await connectDb();
  });

  after(async () => {
    await Appointment.deleteMany({});
    await Doctor.deleteOne({ email: doctor.email });
    await User.deleteOne({ email: patient.email });
    await mongoose.connection.close();
  });

  it("registers and books an appointment", async () => {
    const registerResponse = await request(app).post("/auth/register").send(patient);
    token = registerResponse.body.token;

    if (!token) {
      throw new Error("Token missing after registration");
    }

    const doctorResponse = await request(app).post("/doctors").send(doctor);
    doctorId = doctorResponse.body.doctor?._id;

    if (!doctorId) {
      throw new Error("Doctor creation failed");
    }

    const appointmentResponse = await request(app)
      .post("/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        doctorId,
        appointmentDate: new Date().toISOString(),
        timeSlot: "09:30 AM",
      });

    if (appointmentResponse.status !== 201) {
      throw new Error(`Expected 201, got ${appointmentResponse.status}`);
    }
  });

  it("fetches appointments for the patient", async () => {
    const listResponse = await request(app)
      .get("/appointments")
      .set("Authorization", `Bearer ${token}`);

    if (listResponse.status !== 200) {
      throw new Error(`Expected 200, got ${listResponse.status}`);
    }
  });
});

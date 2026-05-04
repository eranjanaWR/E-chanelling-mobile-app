require("dotenv").config();
const mongoose = require("mongoose");
const { connectDb } = require("../src/config/db");
const Appointment = require("../src/models/Appointment");
const Doctor = require("../src/models/Doctor");
const Review = require("../src/models/Review");
const User = require("../src/models/User");

const TARGET_REVIEWS_PER_DOCTOR = 3;
const MAX_RATING = 5;

const COMMENT_POOL = [
  "Very attentive and explained everything clearly.",
  "Quick checkup and helpful guidance.",
  "Friendly staff and smooth appointment.",
  "Doctor listened carefully and answered questions.",
  "Clean clinic, professional service.",
  "Felt comfortable and well informed.",
  "Diagnosis was clear and treatment helped.",
  "Prompt and courteous consultation.",
  "Great experience overall.",
  "Would recommend to others.",
];

const shuffle = (items) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getOrCreateDemoPatients = async (count) => {
  const patients = [];

  for (let i = 0; i < count; i += 1) {
    const email = `demo.patient.${i + 1}@example.com`;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: `Demo Patient ${i + 1}`,
        email,
        password: "demo123",
        role: "patient",
      });
    }

    patients.push(user);
  }

  return patients;
};

const createAppointmentForReview = async (patientId, doctorId) => {
  return Appointment.create({
    patient: patientId,
    doctor: doctorId,
    appointmentDate: new Date(),
    timeSlot: "Monday · 09:00 - 09:30",
    queueNumber: null,
    status: "completed",
    amount: 1500,
  });
};

const seedReviews = async () => {
  await connectDb();

  const doctors = await Doctor.find({});
  if (!doctors.length) {
    console.log("No doctors found. Seed doctors first.");
    return;
  }

  const demoPatients = await getOrCreateDemoPatients(6);

  for (const doctor of doctors) {
    const existing = await Review.find({ doctor: doctor._id });
    const existingComments = new Set(existing.map((review) => review.comment));
    const remaining = Math.max(0, TARGET_REVIEWS_PER_DOCTOR - existing.length);

    if (!remaining) {
      continue;
    }

    const availableComments = shuffle(
      COMMENT_POOL.filter((comment) => !existingComments.has(comment))
    );

    for (let i = 0; i < remaining; i += 1) {
      const patient = demoPatients[(i + doctor._id.toString().length) % demoPatients.length];
      const comment = availableComments[i] || `Helpful consultation ${i + 1}.`;
      const rating = Math.max(3, Math.floor(Math.random() * MAX_RATING) + 1);

      const appointment = await createAppointmentForReview(patient._id, doctor._id);

      await Review.create({
        appointment: appointment._id,
        patient: patient._id,
        doctor: doctor._id,
        rating,
        comment,
      });
    }

    console.log(
      `Seeded ${remaining} review(s) for doctor ${doctor.name || doctor._id.toString()}`
    );
  }
};

seedReviews()
  .then(() => {
    console.log("Review seeding complete.");
  })
  .catch((error) => {
    console.error("Failed to seed reviews", error);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

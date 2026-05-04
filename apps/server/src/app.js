require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");
const patientRoutes = require("./routes/patientRoutes");
const medicineStripRoutes = require("./routes/medicineStripRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({
    message: "E-chanelling API is running",
    health: "/health",
  });
});

app.use("/auth", authRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/doctors", doctorRoutes);
app.use("/profile", profileRoutes);
app.use("/users", userRoutes);
app.use("/patients", patientRoutes);
app.use("/medicine-strip", medicineStripRoutes);
app.use("/reviews", reviewRoutes);

const startServer = () =>
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

module.exports = { app, startServer };

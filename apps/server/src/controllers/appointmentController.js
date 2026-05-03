const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

const listAppointments = async (req, res) => {
  try {
    const filter = {};

    if (req.user?.role === "patient") {
      filter.patient = req.user._id;
    }

    if (req.user?.role === "doctor") {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (doctor) {
        filter.doctor = doctor._id;
      }
    }

    const appointments = await Appointment.find(filter)
      .populate("patient", "name email")
      .populate("doctor", "name specialty");

    return res.json({ appointments });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

const createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot) {
      return res
        .status(400)
        .json({ message: "doctorId, appointmentDate, and timeSlot are required" });
    }

    if (req.user?.role && req.user.role !== "patient") {
      return res.status(403).json({ message: "Only patients can book appointments" });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      appointmentDate,
      timeSlot,
    });

    return res.status(201).json({ appointment });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create appointment" });
  }
};

module.exports = { listAppointments, createAppointment };

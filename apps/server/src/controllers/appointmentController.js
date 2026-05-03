const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const mongoose = require("mongoose");

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

const createAppointmentAdmin = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, timeSlot, status } = req.body;

    if (!patientId || !doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({
        message: "patientId, doctorId, appointmentDate, and timeSlot are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Invalid patientId" });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctorId" });
    }

    const parsedDate = new Date(appointmentDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid appointment date" });
    }

    const [patient, doctor] = await Promise.all([
      User.findById(patientId),
      Doctor.findById(doctorId),
    ]);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const validStatuses = ["pending", "confirmed", "cancelled"];
    const safeStatus = validStatuses.includes(status) ? status : "pending";

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: parsedDate,
      timeSlot,
      status: safeStatus,
    });

    const populated = await Appointment.findById(appointment._id)
      .populate("patient", "name email")
      .populate("doctor", "name specialty");

    return res.status(201).json({ appointment: populated || appointment });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create appointment" });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { appointmentDate, timeSlot, status } = req.body;

    const update = {};

    if (appointmentDate !== undefined) {
      const parsedDate = new Date(appointmentDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid appointment date" });
      }
      update.appointmentDate = parsedDate;
    }

    if (timeSlot !== undefined) {
      update.timeSlot = String(timeSlot).trim();
    }

    if (status !== undefined) {
      const validStatuses = ["pending", "confirmed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      update.status = status;
    }

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { $set: update },
      { new: true }
    )
      .populate("patient", "name email")
      .populate("doctor", "name specialty");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.json({ appointment });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update appointment" });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findByIdAndDelete(appointmentId)
      .populate("patient", "name email")
      .populate("doctor", "name specialty");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.json({ appointment });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete appointment" });
  }
};

module.exports = {
  listAppointments,
  createAppointment,
  createAppointmentAdmin,
  updateAppointment,
  deleteAppointment,
};

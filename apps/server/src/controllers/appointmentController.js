const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Review = require("../models/Review");
const User = require("../models/User");
const mongoose = require("mongoose");

const getNextQueueNumber = async (doctorId, appointmentDate) => {
  const startOfDay = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate(),
    0,
    0,
    0,
    0
  );
  const endOfDay = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate(),
    23,
    59,
    59,
    999
  );

  const existing = await Appointment.find(
    {
      doctor: doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      queueNumber: { $ne: null },
    },
    { queueNumber: 1 }
  ).sort({ queueNumber: -1 }).limit(1);

  const maxQueue = existing.length ? existing[0].queueNumber : 0;
  return maxQueue + 1;
};

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

    const appointmentIds = appointments.map((appointment) => appointment._id);
    const reviews = appointmentIds.length
      ? await Review.find({ appointment: { $in: appointmentIds } })
          .populate("patient", "name email")
          .populate("doctor", "name specialty")
      : [];

    const reviewMap = new Map(
      reviews.map((review) => [String(review.appointment), review])
    );

    const payload = appointments.map((appointment) => {
      const review = reviewMap.get(String(appointment._id));
      if (!review) {
        return appointment;
      }
      const data = appointment.toObject();
      data.review = review;
      return data;
    });

    return res.json({ appointments: payload });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

const createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot, queueNumber } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot) {
      return res
        .status(400)
        .json({ message: "doctorId, appointmentDate, and timeSlot are required" });
    }

    if (req.user?.role && req.user.role !== "patient") {
      return res.status(403).json({ message: "Only patients can book appointments" });
    }

    let assignedQueueNumber;
    const parsedDate = new Date(appointmentDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid appointment date" });
    }

    if (queueNumber !== undefined && queueNumber !== null && String(queueNumber).trim() !== "") {
      assignedQueueNumber = Number(queueNumber);
    } else {
      assignedQueueNumber = await getNextQueueNumber(doctorId, parsedDate);
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      appointmentDate: parsedDate,
      timeSlot,
      queueNumber: assignedQueueNumber,
    });

    return res.status(201).json({ appointment });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create appointment" });
  }
};

const createAppointmentAdmin = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, timeSlot, status, queueNumber } = req.body;

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

    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    const safeStatus = validStatuses.includes(status) ? status : "pending";

    let assignedQueueNumber;
    if (queueNumber !== undefined && queueNumber !== null && String(queueNumber).trim() !== "") {
      assignedQueueNumber = Number(queueNumber);
    } else {
      assignedQueueNumber = await getNextQueueNumber(doctor._id, parsedDate);
    }

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: parsedDate,
      timeSlot,
      status: safeStatus,
      queueNumber: assignedQueueNumber,
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
    const { appointmentDate, timeSlot, status, queueNumber } = req.body;

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
      const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      update.status = status;
    }

    if (queueNumber !== undefined) {
      if (queueNumber !== null && !Number.isInteger(Number(queueNumber))) {
        return res.status(400).json({ message: "Queue number must be a whole number" });
      }
      update.queueNumber = queueNumber !== null ? Number(queueNumber) : null;
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

const completeAppointment = async (req, res) => {
  try {
    if (req.user?.role !== "doctor") {
      return res.status(403).json({ message: "Doctor access required" });
    }

    const { appointmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointmentId" });
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, doctor: doctor._id },
      { $set: { status: "completed" } },
      { new: true }
    )
      .populate("patient", "name email")
      .populate("doctor", "name specialty");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.json({ appointment });
  } catch (error) {
    console.error("completeAppointment error", error);
    return res.status(500).json({
      message: error?.message || "Failed to complete appointment",
    });
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

const getQueueNumberForDate = async (req, res) => {
  try {
    const { doctorId, appointmentDate } = req.query;

    if (!doctorId || !appointmentDate) {
      return res.status(400).json({ message: "doctorId and appointmentDate are required" });
    }

    const parsedDate = new Date(appointmentDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid appointment date" });
    }

    const nextQueueNumber = await getNextQueueNumber(doctorId, parsedDate);
    return res.json({ queueNumber: nextQueueNumber });
  } catch (error) {
    console.error("getQueueNumberForDate error", error);
    return res.status(500).json({ message: "Failed to calculate queue number" });
  }
};

module.exports = {
  listAppointments,
  createAppointment,
  createAppointmentAdmin,
  updateAppointment,
  deleteAppointment,
  getQueueNumberForDate,
  completeAppointment,
};

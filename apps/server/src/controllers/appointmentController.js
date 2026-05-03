const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

const listAppointments = async (req, res) => {
  try {
    const filter = {};

    if (req.user?.role === "patient") {
      filter.patient = req.user._id;
    } else if (req.user?.role === "doctor") {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (doctor) {
        filter.doctor = doctor._id;
      }
    }
    // admin sees all appointments — no filter applied

    const appointments = await Appointment.find(filter)
      .populate("patient", "name email")
      .populate("doctor", "name specialty")
      .sort({ createdAt: -1 });

    return res.json({ appointments });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

const adminEditAppointment = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    const { appointmentDate, timeSlot } = req.body;

    const update = {};
    if (appointmentDate) {
      const parsed = new Date(appointmentDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "Invalid date" });
      }
      update.appointmentDate = parsed;
    }
    if (timeSlot) update.timeSlot = timeSlot.trim();

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    )
      .populate("patient", "name email")
      .populate("doctor", "name specialty");

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    return res.json({ appointment });
  } catch (error) {
    return res.status(500).json({ message: "Failed to edit appointment" });
  }
};

const adminUpdateAppointment = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "cancelled"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }
    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    )
      .populate("patient", "name email")
      .populate("doctor", "name specialty");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    return res.json({ appointment });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update appointment" });
  }
};

const adminDeleteAppointment = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    return res.json({ message: "Appointment deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete appointment" });
  }
};

const updatePaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentProof } = req.body;

    if (!paymentMethod || !paymentProof) {
      return res.status(400).json({ message: "paymentMethod and paymentProof are required" });
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, patient: req.user._id },
      { $set: { paymentMethod, paymentProof, status: "confirmed" } },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.json({ appointment });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update payment proof" });
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

module.exports = { listAppointments, createAppointment, updatePaymentProof, adminEditAppointment, adminUpdateAppointment, adminDeleteAppointment };

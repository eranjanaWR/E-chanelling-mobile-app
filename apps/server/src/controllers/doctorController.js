const Doctor = require("../models/Doctor");

const listDoctors = async (req, res) => {
  try {
    const { specialty, day } = req.query;
    const filter = {};

    if (specialty) {
      filter.specialty = { $regex: specialty, $options: "i" };
    }

    if (day) {
      filter["availability.day"] = { $regex: `^${day}$`, $options: "i" };
    }

    const doctors = await Doctor.find(filter).sort({ name: 1 });
    return res.json({ doctors });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch doctors" });
  }
};

const createDoctor = async (req, res) => {
  try {
    const { userId, name, email, specialty, availability, fees } = req.body;

    if (!name || !email || !specialty) {
      return res.status(400).json({ message: "name, email, and specialty are required" });
    }

    const doctor = await Doctor.create({
      user: userId,
      name,
      email,
      specialty,
      availability: Array.isArray(availability) ? availability : [],
      fees: fees || 0,
    });

    return res.status(201).json({ doctor });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create doctor" });
  }
};

const updateDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, date } = req.body;

    const validStatuses = ["available", "unavailable"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status must be available or unavailable" });
    }

    if (!date || typeof date !== "string") {
      return res.status(400).json({ message: "Availability date is required" });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { $set: { availabilityStatus: status, availabilityDate: date.trim() } },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.json({ doctor });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update availability" });
  }
};

module.exports = { listDoctors, createDoctor, updateDoctorAvailability };

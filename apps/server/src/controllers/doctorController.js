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

module.exports = { listDoctors, createDoctor };

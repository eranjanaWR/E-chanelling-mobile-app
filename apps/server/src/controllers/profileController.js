const Doctor = require("../models/Doctor");
const User = require("../models/User");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ user: user._id });
      return res.json({ user, doctor });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userUpdates = {};
    const { name, contactNumber, medicalHistory, specialty, availability, fees, qualification, photoUrl } = req.body;

    if (name !== undefined) {
      userUpdates.name = name;
    }

    if (contactNumber !== undefined) {
      userUpdates.contactNumber = contactNumber;
    }

    if (medicalHistory !== undefined) {
      userUpdates.medicalHistory = medicalHistory;
    }

    const user = await User.findByIdAndUpdate(req.user._id, userUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "doctor") {
      const existingDoctor = await Doctor.findOne({ user: user._id });
      const doctorUpdates = {
        email: user.email,
      };

      if (name !== undefined) {
        doctorUpdates.name = name;
      }

      if (specialty !== undefined) {
        doctorUpdates.specialty = specialty;
      }

      if (!existingDoctor && !doctorUpdates.specialty) {
        return res.status(400).json({ message: "Specialty is required for doctor profiles" });
      }

      if (availability !== undefined) {
        doctorUpdates.availability = availability;
      }

      if (fees !== undefined) {
        doctorUpdates.fees = fees;
      }

      if (qualification !== undefined) {
        doctorUpdates.qualification = qualification;
      }

      if (photoUrl !== undefined) {
        doctorUpdates.photoUrl = photoUrl;
      }

      const doctor = await Doctor.findOneAndUpdate(
        { user: user._id },
        doctorUpdates,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return res.json({ user, doctor });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

module.exports = { getProfile, updateProfile };
